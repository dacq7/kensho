import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';
import { Badge, Card, SkeletonCard } from '../../components/ui';

function formatFecha(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Diferencia en días entre la fecha de vencimiento (solo día) y hoy. Positivo = aún no vence ese día. */
function diasRelativoVencimiento(fechaVencimiento) {
  const v = new Date(fechaVencimiento);
  const a = new Date();
  const d0 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const d1 = Date.UTC(v.getFullYear(), v.getMonth(), v.getDate());
  return Math.round((d1 - d0) / 86400000);
}

function labelEstadoTabla(estado) {
  if (estado === 'activa') return 'Activa';
  if (estado === 'por_vencer') return 'Por vencer';
  if (estado === 'vencida') return 'Vencida';
  return estado || '—';
}

function estadoBadgeVariant(estado) {
  if (estado === 'activa') return 'success';
  if (estado === 'por_vencer') return 'warning';
  return 'danger';
}

function estadoBadgeLabel(estado) {
  if (estado === 'activa') return '✓ Póliza Activa';
  if (estado === 'por_vencer') return '⚠ Por vencer';
  return '✗ Póliza Vencida';
}

export default function KaratecaPolizaPage() {
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let id = user?.karatecaId ?? user?.karateca?.id;
      if (id == null) {
        const { data: dash } = await api.get('/dashboard/karateca');
        id = dash?.karateca?.id;
      }
      if (id == null) {
        setError('No se encontró tu perfil de karateca.');
        setItems([]);
        return;
      }
      const { data } = await api.get(`/polizas/karateca/${id}`);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudieron cargar las pólizas');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const vigente = useMemo(() => {
    if (!items.length) return null;
    return [...items].sort(
      (a, b) => new Date(b.fechaVencimiento) - new Date(a.fechaVencimiento),
    )[0];
  }, [items]);

  const historialRows = useMemo(() => {
    if (items.length <= 1) return [];
    const sorted = [...items].sort(
      (a, b) => new Date(b.fechaVencimiento) - new Date(a.fechaVencimiento),
    );
    return sorted.slice(1);
  }, [items]);

  if (loading) {
    return (
      <div className="min-h-full p-3 md:p-6 lg:p-8">
        <div className="mx-auto max-w-[40rem]">
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[40rem] min-h-full p-3 md:p-6 lg:p-8">
      <h1 className="mb-4 text-lg font-semibold tracking-tight text-dojo-dorado md:text-xl lg:text-2xl">
        Mi póliza
      </h1>

      {error && (
        <div className="mb-4 rounded-r-md border-l-4 border-dojo-rojo bg-dojo-rojo/10 px-4 py-3 text-sm text-red-200" role="alert">
          {error}
        </div>
      )}

      <section className="mb-6 flex flex-col gap-4 md:mb-8">
        {!vigente ? (
          <div className="rounded-lg border border-dojo-rojo/50 bg-dojo-rojo/10 px-4 py-4">
            <p className="font-extrabold text-red-300">Sin póliza registrada</p>
            <p className="mt-1 text-sm text-red-400/80">Contacta al Sensei</p>
            <div className="mt-3">
              <Badge variant="danger">Sin cobertura</Badge>
            </div>
          </div>
        ) : (
          <Card>
            <p className="mb-1 text-2xl font-extrabold leading-tight text-white">
              {vigente.aseguradora}
            </p>
            <p className="mb-4 text-sm text-white/50">
              <span className="text-xs uppercase tracking-wider text-white/40">N° Póliza </span>
              <span className="font-semibold text-white/80">{vigente.numeroPoliza}</span>
            </p>

            <dl className="mb-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wider text-white/40">Inicio</dt>
                <dd className="mt-0.5 font-medium text-white/80">{formatFecha(vigente.fechaInicio)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-white/40">Vencimiento</dt>
                <dd className="mt-0.5 font-medium text-white/80">{formatFecha(vigente.fechaVencimiento)}</dd>
              </div>
            </dl>

            {(() => {
              const est = vigente.estado;
              const diff = diasRelativoVencimiento(vigente.fechaVencimiento);

              let diasLine = null;
              if (est === 'vencida') {
                const vencidos = Math.max(0, -diff);
                diasLine = (
                  <p className="mt-3 text-sm font-bold text-red-400">
                    Vencida hace {vencidos} {vencidos === 1 ? 'día' : 'días'}
                  </p>
                );
              } else {
                const rest = Math.max(0, diff);
                const diasColorClass = est === 'por_vencer' ? 'text-amber-400' : 'text-emerald-400';
                diasLine = (
                  <p className={`mt-3 text-sm font-bold ${diasColorClass}`}>
                    {rest === 0
                      ? 'Vence hoy'
                      : `${rest} ${rest === 1 ? 'día restante' : 'días restantes'}`}
                  </p>
                );
              }

              return (
                <div>
                  <Badge variant={estadoBadgeVariant(est)} className="text-sm px-3 py-1">
                    {estadoBadgeLabel(est)}
                  </Badge>
                  {diasLine}
                </div>
              );
            })()}
          </Card>
        )}
      </section>

      {historialRows.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-dojo-dorado md:text-base">
            Historial de pólizas anteriores
          </h2>

          {/* Mobile cards */}
          <div className="space-y-3 lg:hidden">
            {historialRows.map((row) => (
              <div
                key={row.id}
                className="rounded-lg border border-dojo-dorado/20 bg-dojo-surface p-4 text-sm"
              >
                <p className="mb-1 font-semibold text-white">{row.aseguradora}</p>
                <p className="mb-2 text-white/50">N° {row.numeroPoliza}</p>
                <p className="mb-1 text-xs text-white/40">Inicio: {formatFecha(row.fechaInicio)}</p>
                <p className="mb-2 text-xs text-white/40">Vencimiento: {formatFecha(row.fechaVencimiento)}</p>
                <Badge variant={estadoBadgeVariant(row.estado)}>{labelEstadoTabla(row.estado)}</Badge>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-dojo-dorado">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dojo-dorado/70">Aseguradora</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dojo-dorado/70">N° Póliza</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dojo-dorado/70">Fecha inicio</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dojo-dorado/70">Fecha vencimiento</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dojo-dorado/70">Estado</th>
                </tr>
              </thead>
              <tbody>
                {historialRows.map((row) => (
                  <tr key={row.id} className="border-b border-white/5 transition-colors hover:bg-white/[0.02]">
                    <td className="px-4 py-3 align-top text-white/85">{row.aseguradora}</td>
                    <td className="px-4 py-3 align-top text-white/70">{row.numeroPoliza}</td>
                    <td className="px-4 py-3 align-top text-white/60">{formatFecha(row.fechaInicio)}</td>
                    <td className="px-4 py-3 align-top text-white/60">{formatFecha(row.fechaVencimiento)}</td>
                    <td className="px-4 py-3 align-top">
                      <Badge variant={estadoBadgeVariant(row.estado)}>{labelEstadoTabla(row.estado)}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
