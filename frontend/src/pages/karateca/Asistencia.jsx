import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarCheck } from 'lucide-react';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';
import { parseLocalDate } from '../../lib/dateUtils';
import { Card, EmptyState, SkeletonCard } from '../../components/ui';

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

function colorPctText(p) {
  if (p >= 80) return 'text-emerald-400';
  if (p >= 50) return 'text-amber-400';
  return 'text-red-400';
}

function colorPctBg(p) {
  if (p >= 80) return 'bg-emerald-400';
  if (p >= 50) return 'bg-amber-400';
  return 'bg-red-400';
}

function colorPctBadge(p) {
  if (p >= 80) return 'bg-emerald-400/20 text-emerald-400';
  if (p >= 50) return 'bg-amber-400/20 text-amber-400';
  return 'bg-red-400/20 text-red-400';
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

  if (loading) {
    return (
      <div className="min-h-full p-3 md:p-6 lg:p-8">
        <div className="mx-auto grid max-w-[40rem] grid-cols-1 gap-4 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error && karatecaId == null) {
    return (
      <div className="min-h-full p-3 md:p-6 lg:p-8">
        <div className="rounded-r-md border-l-4 border-dojo-rojo bg-dojo-rojo/10 px-4 py-3 text-sm text-red-200" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[40rem] min-h-full p-3 md:p-6 lg:p-8">
      <h1 className="mb-4 text-lg font-semibold tracking-tight text-dojo-dorado md:text-xl lg:text-2xl">
        Asistencia
      </h1>

      {error && (
        <div className="mb-4 rounded-r-md border-l-4 border-dojo-rojo bg-dojo-rojo/10 px-4 py-3 text-sm text-red-200" role="alert">
          {error}
        </div>
      )}

      {/* ── Resumen ── */}
      <Card className="mb-6 md:mb-8">
        <h2 className="mb-3 text-sm font-semibold text-dojo-dorado md:text-base">Resumen</h2>
        <p className={`text-5xl font-black leading-none ${colorPctText(promedio)}`}>
          {promedio}%
        </p>
        <p className="mt-2 mb-4 text-sm text-white/50">
          {clasesAsistidas} de {totalClases} clases asistidas
        </p>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all duration-500 ${colorPctBg(promedio)}`}
            style={{ width: `${Math.min(100, promedio)}%` }}
          />
        </div>
      </Card>

      {/* ── Historial ── */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-dojo-dorado md:text-base">
            Historial por mes
          </h2>
          <label className="flex min-h-[44px] items-center gap-2 text-sm text-white/60">
            Filtrar
            <select
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              className="min-h-[44px] flex-1 rounded-md border border-white/15 bg-dojo-negro px-3 py-2 text-sm text-white focus:border-dojo-dorado focus:outline-none sm:flex-initial"
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
          <EmptyState
            icon={CalendarCheck}
            title="Sin registros"
            description="No hay clases registradas para este período"
          />
        ) : (
          <div className="flex flex-col gap-3 md:gap-4">
            {mesesFiltrados.map((bloque) => {
              const badgeClass = colorPctBadge(bloque.pct);
              const headerInner = (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="m-0 text-base font-semibold capitalize text-white md:text-lg">
                    {bloque.label}
                  </h3>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${badgeClass}`}>
                    {bloque.pct}%
                  </span>
                </div>
              );
              const listInner = (
                <ul className="m-0 list-none p-0">
                  {bloque.items.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center gap-2 border-b border-white/5 py-2 text-sm md:text-base"
                    >
                      <span className="text-base">{a.presente ? '✅' : '❌'}</span>
                      <span className="text-white/70">
                        {parseLocalDate(a.fecha).toLocaleDateString('es-ES', {
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
                  <details className="rounded-lg border border-dojo-dorado/25 bg-dojo-surface lg:hidden">
                    <summary className="min-h-[44px] cursor-pointer list-none p-4 [&::-webkit-details-marker]:hidden">
                      {headerInner}
                    </summary>
                    <div className="border-t border-white/10 px-4 pb-4 pt-2">{listInner}</div>
                  </details>
                  <article className="hidden rounded-lg border border-dojo-dorado/25 bg-dojo-surface p-4 lg:block">
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
