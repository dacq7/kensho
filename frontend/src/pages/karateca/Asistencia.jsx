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
    <div style={{ minHeight: '100%', background: DOJO.negro, color: '#eee', padding: '1.5rem', maxWidth: '40rem' }}>
      <h1 style={{ margin: '0 0 1.25rem', fontSize: '1.4rem', color: DOJO.dorado }}>Asistencia</h1>

      {error && (
        <div style={{ color: '#f88', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>
      )}

      <section style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', color: '#aaa', fontWeight: 600 }}>
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

      <section>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            marginBottom: '0.75rem',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '0.95rem', color: '#aaa', fontWeight: 600 }}>
            Historial por mes
          </h2>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#bbb' }}>
            Filtrar
            <select
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              style={{
                background: '#141414',
                color: '#eee',
                border: `1px solid ${DOJO.rojo}`,
                borderRadius: 6,
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {mesesFiltrados.map((bloque) => {
              const c = colorPct(bloque.pct);
              return (
                <article
                  key={bloque.ym}
                  style={{
                    background: '#1a1a1a',
                    border: `1px solid ${DOJO.dorado}`,
                    borderRadius: 10,
                    padding: '0.85rem 1rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      marginBottom: '0.65rem',
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff', textTransform: 'capitalize' }}>
                      {bloque.label}
                    </h3>
                    <span
                      style={{
                        background: c,
                        color: DOJO.negro,
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        padding: '0.2rem 0.55rem',
                        borderRadius: 999,
                      }}
                    >
                      {bloque.pct}%
                    </span>
                  </div>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {bloque.items.map((a) => (
                      <li
                        key={a.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.35rem 0',
                          borderBottom: '1px solid #2a2a2a',
                          fontSize: '0.88rem',
                        }}
                      >
                        <span style={{ fontSize: '1rem' }}>{a.presente ? '✅' : '❌'}</span>
                        <span style={{ color: '#ccc' }}>
                          {new Date(a.fecha).toLocaleDateString('es-ES', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
