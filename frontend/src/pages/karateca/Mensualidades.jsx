import { useCallback, useEffect, useMemo, useState } from 'react';
import { DollarSign } from 'lucide-react';
import api from '../../lib/api';
import { formatFechaCorta } from '../../lib/dateUtils';
import { Badge, Card, EmptyState, SkeletonCard } from '../../components/ui';

function mesLargoEs(ym) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  const s = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function enMora(mesYyyyMm, pagado) {
  if (pagado) return false;
  const [y, mo] = mesYyyyMm.split('-').map(Number);
  const inicioDia6 = new Date(y, mo - 1, 6, 0, 0, 0, 0);
  return new Date() >= inicioDia6;
}

function parseMonto(m) {
  if (m == null || m === '') return 0;
  const n = parseFloat(String(m), 10);
  return Number.isNaN(n) ? 0 : n;
}

function formatMonto(m) {
  const n = parseMonto(m);
  return n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatFechaPago(iso) {
  return formatFechaCorta(iso) || '';
}

export default function KaratecaMensualidadesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: dash } = await api.get('/dashboard/karateca');
      const id = dash?.karateca?.id;
      const mesInicio = dash?.karateca?.mesInicioMensualidades ?? null;
      if (id == null) {
        setError('No se encontró tu perfil de karateca.');
        setItems([]);
        return;
      }
      const { data } = await api.get(`/mensualidades/karateca/${id}`);
      const raw = Array.isArray(data) ? data : [];
      setItems(
        mesInicio ? raw.filter((row) => row.mes >= mesInicio) : raw,
      );
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudieron cargar las mensualidades');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resumen = useMemo(() => {
    let alDia = 0;
    let enMoraCount = 0;
    let sinPagar = 0;
    let pendienteTotal = 0;

    for (const row of items) {
      if (row.pagado) {
        alDia += 1;
        continue;
      }
      pendienteTotal += parseMonto(row.monto);
      if (enMora(row.mes, false)) {
        enMoraCount += 1;
      } else {
        sinPagar += 1;
      }
    }

    return { alDia, enMoraCount, sinPagar, pendienteTotal };
  }, [items]);

  if (loading) {
    return (
      <div className="min-h-full p-3 md:p-6 lg:p-8">
        <div className="mx-auto grid max-w-[36rem] grid-cols-1 gap-4 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[36rem] min-h-full p-3 md:p-6 lg:p-8">
      <h1 className="mb-4 text-lg font-semibold tracking-tight text-dojo-dorado md:text-xl lg:text-2xl">
        Mensualidades
      </h1>

      {error && (
        <div className="mb-4 rounded-r-md border-l-4 border-dojo-rojo bg-dojo-rojo/10 px-4 py-3 text-sm text-red-200" role="alert">
          {error}
        </div>
      )}

      {/* ── Resumen ── */}
      <Card className="mb-6 md:mb-8">
        <h2 className="mb-3 text-sm font-semibold text-dojo-dorado md:text-base">Resumen</h2>
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge variant="success">{resumen.alDia} meses al día</Badge>
          <Badge variant="warning">{resumen.enMoraCount} meses en mora</Badge>
          <Badge variant="danger">{resumen.sinPagar} meses sin pagar</Badge>
        </div>
        {resumen.pendienteTotal > 0 && (
          <p className="m-0 text-lg font-bold text-dojo-rojo">
            Monto total pendiente: ${formatMonto(resumen.pendienteTotal)}
          </p>
        )}
      </Card>

      {/* ── Historial ── */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-dojo-dorado md:text-base">Historial</h2>
        {items.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title="Sin mensualidades"
            description="No hay pagos registrados para este período"
          />
        ) : (
          <ul className="m-0 list-none space-y-3 p-0 lg:space-y-0">
            {items.map((row) => {
              const mora = enMora(row.mes, row.pagado);
              let badge;
              if (row.pagado) {
                badge = (
                  <span className="inline-flex items-center gap-1">
                    <Badge variant="success">✓ Pagado</Badge>
                    {row.fechaPago && (
                      <span className="text-xs text-white/50">{formatFechaPago(row.fechaPago)}</span>
                    )}
                  </span>
                );
              } else if (mora) {
                badge = <Badge variant="warning">⚠ En mora</Badge>;
              } else {
                badge = <Badge variant="danger">✗ Pendiente</Badge>;
              }

              return (
                <li
                  key={row.id}
                  className="flex flex-col gap-3 rounded-lg border border-dojo-dorado/25 bg-dojo-surface p-4 text-sm md:text-base lg:flex-row lg:items-center lg:justify-between lg:rounded-none lg:border-0 lg:border-b lg:border-dojo-dorado/25 lg:bg-transparent lg:p-0 lg:pb-4"
                >
                  <div className="min-w-0 sm:min-w-[10rem]">
                    <div className="mb-2 font-bold text-white">{mesLargoEs(row.mes)}</div>
                    {badge}
                  </div>
                  <div className="text-lg font-bold text-dojo-dorado lg:text-base">
                    ${formatMonto(row.monto)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
