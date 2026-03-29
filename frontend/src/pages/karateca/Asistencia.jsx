import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';

const DOJO = { negro: '#111111', rojo: '#CC0000', dorado: '#C9A84C' };

function ymd(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function mesLargoEs(ym) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1, 15);
  return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}

function ymFromYmd(ymdStr) {
  return ymdStr.slice(0, 7);
}

function colorPct(p) {
  if (p >= 80) return '#6ecf7a';
  if (p >= 50) return '#e6c84c';
  return '#e85c5c';
}

function pctMes(asistenciasMes) {
  const allDays = new Set(asistenciasMes.map((a) => ymd(a.fecha)));
  const presentDays = new Set(
    asistenciasMes.filter((a) => a.presente).map((a) => ymd(a.fecha)),
  );
  const total = allDays.size;
  if (total === 0) return 0;
  return Math.round((presentDays.size / total) * 100);
}

export default function KaratecaAsistenciaPage() {
  const user = useAuthStore((s) => s.user);

  const [karatecaId, setKaratecaId] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroMes, setFiltroMes] = useState('todos');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let id = user?.karatecaId ?? user?.karateca?.id;
      const { data: dash } = await api.get('/dashboard/karateca');
      if (id == null) id = dash?.karateca?.id;
      if (id == null) {
        setError('No se encontró tu perfil de karateca.');
        setKaratecaId(null);
        setResumen(null);
        setHistorial([]);
        return;
      }
      setKaratecaId(id);
      setResumen(dash?.asistencia ?? null);

      const { data: asistRows } = await api.get(`/asistencias/karateca/${id}`);
      setHistorial(Array.isArray(asistRows) ? asistRows : []);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo cargar la asistencia');
      setResumen(null);
      setHistorial([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const porMes = useMemo(() => {
    const map = new Map();
    for (const row of historial) {
      const key = ymFromYmd(ymd(row.fecha));
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(row);
    }
    const ordenMeses = [...map.keys()].sort((a, b) => b.localeCompare(a));
    return ordenMeses.map((ym) => ({
      ym,
      label: mesLargoEs(ym),
      items: map.get(ym).sort((a, b) => new Date(b.fecha) - new Date(a.fecha)),
      pct: pctMes(map.get(ym)),
    }));
  }, [historial]);

  const mesesOpciones = useMemo(() => ['todos', ...porMes.map((m) => m.ym)], [porMes]);

  const mesesFiltrados = useMemo(() => {
    if (filtroMes === 'todos') return porMes;
    return porMes.filter((m) => m.ym === filtroMes);
  }, [porMes, filtroMes]);

  const promedio = resumen?.promedio ?? 0;
  const totalClases = resumen?.totalClases ?? 0;
  const clasesAsistidas = resumen?.clasesAsistidas ?? 0;
  const col = colorPct(promedio);

  if (loading) {
    return (
      <div style={{ padding: '1.5rem', background: DOJO.negro, color: '#aaa', minHeight: '100%' }}>
        Cargando…
      </div>
    );
  }

  if (error && karatecaId == null) {
    return (
      <div style={{ padding: '1.5rem', background: DOJO.negro, color: '#f88', minHeight: '100%' }}>
        {error}
      </div>
    );
  }

  return (
    <div
      className="mx-auto w-full max-w-[40rem] p-3 md:p-6 lg:p-8"
      style={{ minHeight: '100%', background: DOJO.negro, color: '#eee' }}
    >
      <h1 className="mb-4 text-lg font-semibold md:text-xl lg:text-2xl" style={{ color: DOJO.dorado }}>
        Asistencia
      </h1>

      {error && (
        <div style={{ color: '#f88', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>
      )}

      <section className="mb-6 md:mb-8">
        <h2 className="mb-2 text-sm font-semibold text-[#aaa] md:text-base">
          Resumen
        </h2>
        <div style={{ fontSize: '2.6rem', fontWeight: 900, color: col, lineHeight: 1 }}>{promedio}%</div>
        <p style={{ margin: '0.4rem 0 0.85rem', color: '#aaa', fontSize: '0.9rem' }}>
          {clasesAsistidas} de {totalClases} clases asistidas
        </p>
        <div
          style={{
            height: 12,
            borderRadius: 999,
            background: '#333',
            overflow: 'hidden',
            maxWidth: '100%',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, promedio)}%`,
              background: col,
              transition: 'width 0.25s ease',
            }}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-[#aaa] md:text-base">Historial por mes</h2>
          <label className="flex min-h-[44px] items-center gap-2 text-sm text-[#bbb] md:text-base">
            Filtrar
            <select
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              className="min-h-[44px] flex-1 rounded-md sm:flex-initial"
              style={{
                background: '#141414',
                color: '#eee',
                border: `1px solid ${DOJO.rojo}`,
                padding: '0.3rem 0.45rem',
                fontSize: '0.85rem',
              }}
            >
              {mesesOpciones.map((m) => (
                <option key={m} value={m}>
                  {m === 'todos' ? 'Todos los meses' : mesLargoEs(m)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {mesesFiltrados.length === 0 ? (
          <p style={{ color: '#888', fontSize: '0.9rem' }}>No hay registros de asistencia.</p>
        ) : (
          <div className="flex flex-col gap-3 md:gap-4">
            {mesesFiltrados.map((bloque) => {
              const c = colorPct(bloque.pct);
              const headerInner = (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="m-0 text-base capitalize text-white md:text-lg">{bloque.label}</h3>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-extrabold"
                    style={{ background: c, color: DOJO.negro }}
                  >
                    {bloque.pct}%
                  </span>
                </div>
              );
              const listInner = (
                <ul className="m-0 list-none p-0">
                  {bloque.items.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center gap-2 border-b border-[#2a2a2a] py-2 text-sm md:text-base"
                    >
                      <span className="text-base">{a.presente ? '✅' : '❌'}</span>
                      <span className="text-[#ccc]">
                        {new Date(a.fecha).toLocaleDateString('es-ES', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              );
              return (
                <div key={bloque.ym}>
                  <details
                    className="rounded-lg border bg-[#1a1a1a] lg:hidden"
                    style={{ borderColor: DOJO.dorado }}
                  >
                    <summary className="min-h-[44px] cursor-pointer list-none p-4 [&::-webkit-details-marker]:hidden">
                      {headerInner}
                    </summary>
                    <div className="border-t border-[#2a2a2a] px-4 pb-4 pt-2">{listInner}</div>
                  </details>
                  <article
                    className="hidden rounded-lg border bg-[#1a1a1a] p-4 lg:block"
                    style={{ borderColor: DOJO.dorado }}
                  >
                    <div className="mb-3">{headerInner}</div>
                    {listInner}
                  </article>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
