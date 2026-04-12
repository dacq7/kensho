import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CalendarCheck,
  DollarSign,
  Shield,
  Package,
  RefreshCw,
} from 'lucide-react';
import api from '../../lib/api';
import { Badge, Button, Card, Modal, SkeletonCard } from '../../components/ui';

/* ── helpers ─────────────────────────────────────────────────── */

function colorAsistenciaClass(p) {
  if (p >= 80) return 'text-emerald-400 font-bold';
  if (p >= 50) return 'text-amber-400 font-bold';
  return 'text-dojo-rojo font-bold';
}

function promedioGeneral(list) {
  if (!list.length) return 0;
  const sum = list.reduce((a, x) => a + x.promedio, 0);
  return Math.round(sum / list.length);
}

/* ── useCountUp ──────────────────────────────────────────────── */

function useCountUp(target, duration = 800) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!target) {
      setCount(0);
      return;
    }
    let rafId;
    let startTime = null;
    const end = target;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutQuart
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(end * eased));
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);

  return count;
}

/* ── CircleProgress ──────────────────────────────────────────── */

function CircleProgress({ value }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - value / 100);
  const strokeColor =
    value >= 80 ? '#34d399' : value >= 50 ? '#fbbf24' : '#CC0000';

  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden>
      <circle
        cx="32" cy="32" r={r}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="4"
      />
      <circle
        cx="32" cy="32" r={r}
        fill="none"
        stroke={strokeColor}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{
          transform: 'rotate(-90deg)',
          transformOrigin: 'center',
          transition: 'stroke-dashoffset 0.7s ease',
        }}
      />
    </svg>
  );
}

/* ── StatRow ─────────────────────────────────────────────────── */

function StatRow({ color, label, count, onClick }) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={[
        'flex min-h-[36px] w-full items-center justify-between rounded px-1 text-sm',
        onClick
          ? '-mx-1 cursor-pointer transition-colors hover:bg-white/5'
          : '',
      ].join(' ')}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-white/70">{label}</span>
      </div>
      <span className="font-bold text-white">{count}</span>
    </Wrapper>
  );
}

/* ── Dashboard ───────────────────────────────────────────────── */

export default function SenseiDashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalAsistencia, setModalAsistencia] = useState(false);
  const [modalMensTipo, setModalMensTipo] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: d } = await api.get('/dashboard/resumen');
      setData(d);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo cargar el resumen');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const asistenciaOrdenada = useMemo(() => {
    const list = data?.asistenciaPromedio ?? [];
    return [...list].sort((a, b) => b.promedio - a.promedio);
  }, [data]);

  const promedioDojo = useMemo(
    () => promedioGeneral(data?.asistenciaPromedio ?? []),
    [data]
  );

  const top5 = useMemo(() => asistenciaOrdenada.slice(0, 5), [asistenciaOrdenada]);

  const mensList = (tipo) => {
    if (!data?.mensualidades) return [];
    if (tipo === 'alDia') return data.mensualidades.alDia ?? [];
    if (tipo === 'unMes') return data.mensualidades.unMes ?? [];
    if (tipo === 'masDe1Mes') return data.mensualidades.masDe1Mes ?? [];
    return [];
  };

  /* count-up hooks — must be called unconditionally before early returns */
  const countKaratecas = useCountUp(data?.karatecas?.total ?? 0);
  const countPromedio = useCountUp(promedioDojo);
  const countPolizasActivas = useCountUp(data?.polizas?.activas ?? 0);
  const countPolizasPorVencer = useCountUp(data?.polizas?.porVencer ?? 0);
  const countPolizasVencidas = useCountUp(data?.polizas?.vencidas ?? 0);
  const countInvBueno = useCountUp(data?.inventario?.bueno ?? 0);
  const countInvRegular = useCountUp(data?.inventario?.regular ?? 0);
  const countInvMalo = useCountUp(data?.inventario?.malo ?? 0);

  /* ── early returns ── */

  if (loading) {
    return (
      <div className="min-h-full bg-dojo-negro p-3 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-full bg-dojo-negro p-3 md:p-6 lg:p-8">
        <div
          className="rounded-lg border border-dojo-rojo/50 bg-dojo-rojo/20 px-4 py-3 text-sm text-red-200"
          role="alert"
        >
          {error || 'Sin datos'}
        </div>
      </div>
    );
  }

  const preExamenAprobado = data.karatecas.preExamenAprobado ?? 0;
  const total = data.karatecas.total ?? 1;
  const preExamenPct = total > 0 ? (preExamenAprobado / total) * 100 : 0;

  /* ── render ── */

  return (
    <div className="min-h-full bg-dojo-negro p-3 text-white/90 md:p-6 lg:p-8">
      {/* Page header */}
      <div className="mb-5 md:mb-6">
        <h1 className="text-lg font-semibold text-dojo-dorado md:text-xl lg:text-2xl">
          Dashboard
        </h1>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-white/35">
          <span>Resumen operativo del dojo · actualizado ahora</span>
          <button
            type="button"
            onClick={load}
            className="rounded p-0.5 transition-colors hover:text-dojo-dorado/60"
            aria-label="Recargar datos"
          >
            <RefreshCw className="h-3 w-3" aria-hidden />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* ── 1. Karatecas ── */}
        <Card className="relative" onClick={() => navigate('/sensei/karatecas')}>
          <Users
            className="absolute right-3 top-3 h-8 w-8 text-dojo-dorado/20"
            aria-hidden
          />
          <p className="mb-1 text-sm text-white/60">Karatecas activos</p>
          <p className="text-4xl font-extrabold leading-tight text-dojo-dorado">
            {countKaratecas}
          </p>

          <div className="mt-4 space-y-1.5">
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-dojo-dorado transition-all duration-700"
                style={{ width: `${preExamenPct}%` }}
              />
            </div>
            <p className="text-xs text-white/50">
              {preExamenAprobado} con pre-examen aprobado
            </p>
          </div>
        </Card>

        {/* ── 2. Asistencia ── */}
        <Card className="relative" onClick={() => navigate('/sensei/asistencia')}>
          <CalendarCheck
            className="absolute right-3 top-3 h-8 w-8 text-dojo-dorado/20"
            aria-hidden
          />
          <p className="mb-3 text-sm text-white/60">Asistencia general</p>

          <div className="mb-4 flex items-center gap-4">
            <div className="relative shrink-0">
              <CircleProgress value={countPromedio} />
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                {countPromedio}%
              </span>
            </div>
            <div>
              <p className="text-3xl font-extrabold leading-none text-dojo-dorado">
                {countPromedio}%
              </p>
              <p className="mt-1 text-xs text-white/50">Promedio del dojo</p>
            </div>
          </div>

          <ul className="m-0 list-none p-0">
            {top5.map((row) => (
              <li
                key={row.karatecaId}
                className="flex items-center justify-between border-b border-white/8 py-1.5 text-sm last:border-0"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/sensei/asistencia');
                  }}
                  className="cursor-pointer border-0 bg-transparent p-0 text-left font-semibold text-dojo-dorado hover:text-dojo-dorado/80"
                >
                  {row.nombre}
                </button>
                <span className={colorAsistenciaClass(row.promedio)}>
                  {row.promedio}%
                </span>
              </li>
            ))}
          </ul>

          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full"
            onClick={(e) => {
              e.stopPropagation();
              setModalAsistencia(true);
            }}
          >
            Ver todos
          </Button>
        </Card>

        {/* ── 3. Mensualidades ── */}
        <Card className="relative">
          <DollarSign
            className="absolute right-3 top-3 h-8 w-8 text-dojo-dorado/20"
            aria-hidden
          />
          <p className="mb-3 text-sm text-white/60">Mensualidades</p>

          <div className="space-y-0.5">
            <StatRow
              color="#34d399"
              label="Al día"
              count={data.mensualidades.alDia.length}
              onClick={() => setModalMensTipo('alDia')}
            />
            <StatRow
              color="#fbbf24"
              label="Deben 1 mes"
              count={data.mensualidades.unMes.length}
              onClick={() => setModalMensTipo('unMes')}
            />
            <StatRow
              color="#CC0000"
              label="Deben +1 mes"
              count={data.mensualidades.masDe1Mes.length}
              onClick={() => setModalMensTipo('masDe1Mes')}
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full"
            onClick={() => navigate('/sensei/mensualidades')}
          >
            Ir a mensualidades
          </Button>
        </Card>

        {/* ── 4. Pólizas ── */}
        <Card className="relative" onClick={() => navigate('/sensei/polizas')}>
          <Shield
            className="absolute right-3 top-3 h-8 w-8 text-dojo-dorado/20"
            aria-hidden
          />
          <p className="mb-3 text-sm text-white/60">Pólizas</p>

          <div className="space-y-0.5">
            <StatRow color="#34d399" label="Activas" count={countPolizasActivas} />
            <StatRow color="#fbbf24" label="Por vencer" count={countPolizasPorVencer} />
            <StatRow color="#CC0000" label="Vencidas" count={countPolizasVencidas} />
          </div>

          {data.polizas.vencidas > 0 && (
            <p className="mt-3 text-xs font-medium text-dojo-rojo">
              ⚠ {data.polizas.vencidas} pólizas vencidas
            </p>
          )}
        </Card>

        {/* ── 5. Inventario ── */}
        <Card className="relative" onClick={() => navigate('/sensei/inventario')}>
          <Package
            className="absolute right-3 top-3 h-8 w-8 text-dojo-dorado/20"
            aria-hidden
          />
          <p className="mb-3 text-sm text-white/60">Inventario</p>

          <div className="space-y-0.5">
            <StatRow color="#34d399" label="Bueno" count={countInvBueno} />
            <StatRow color="#fbbf24" label="Regular" count={countInvRegular} />
            <StatRow color="#CC0000" label="Malo" count={countInvMalo} />
          </div>

          {data.inventario.malo > 0 && (
            <p className="mt-3 text-xs font-medium text-amber-400">
              ⚠ {data.inventario.malo} ítems requieren atención
            </p>
          )}
        </Card>
      </div>

      {/* ── Modal: Asistencia ── */}
      <Modal
        open={modalAsistencia}
        onClose={() => setModalAsistencia(false)}
        title="Asistencia — todos"
      >
        <ul className="m-0 list-none p-0">
          {asistenciaOrdenada.map((row) => (
            <li
              key={row.karatecaId}
              className="flex items-center justify-between border-b border-white/10 py-2 text-sm last:border-0"
            >
              <button
                type="button"
                onClick={() => {
                  setModalAsistencia(false);
                  navigate('/sensei/asistencia');
                }}
                className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-dojo-dorado"
              >
                {row.nombre}
              </button>
              <span className={colorAsistenciaClass(row.promedio)}>
                {row.promedio}%
              </span>
            </li>
          ))}
        </ul>
      </Modal>

      {/* ── Modal: Mensualidades ── */}
      <Modal
        open={!!modalMensTipo}
        onClose={() => setModalMensTipo(null)}
        title={
          modalMensTipo === 'alDia'
            ? 'Al día'
            : modalMensTipo === 'unMes'
              ? 'Deben 1 mes'
              : 'Deben +1 mes'
        }
      >
        <ul className="m-0 list-none p-0">
          {mensList(modalMensTipo).map((row) => (
            <li
              key={row.karatecaId}
              className="flex items-center justify-between border-b border-white/10 py-2.5 text-sm last:border-0"
            >
              <button
                type="button"
                onClick={() => {
                  setModalMensTipo(null);
                  navigate('/sensei/mensualidades');
                }}
                className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-dojo-dorado"
              >
                {row.nombre}
              </button>
              <span className="text-white/60">{row.kyu}</span>
            </li>
          ))}
        </ul>
        {mensList(modalMensTipo).length === 0 && (
          <p className="mt-2 text-sm text-white/50">
            No hay karatecas en esta categoría.
          </p>
        )}
      </Modal>
    </div>
  );
}
