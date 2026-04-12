import { useCallback, useEffect, useMemo, useState } from 'react';
import { DollarSign } from 'lucide-react';
import api from '../../lib/api';
import { EmptyState } from '../../components/ui';

const DOJO = { negro: '#111111', rojo: '#CC0000', dorado: '#C9A84C' };

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
  if (!iso) return '';
  return new Date(iso).toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
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
      <div style={{ padding: '1.5rem', background: DOJO.negro, color: '#aaa', minHeight: '100%' }}>
        Cargando…
      </div>
    );
  }

  return (
    <div
      className="mx-auto w-full max-w-[36rem] p-3 md:p-6 lg:p-8"
      style={{ minHeight: '100%', background: DOJO.negro, color: '#eee' }}
    >
      <h1 className="mb-4 text-lg font-semibold md:text-xl lg:text-2xl" style={{ color: DOJO.dorado }}>
        Mensualidades
      </h1>

      {error && (
        <div style={{ color: '#f88', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>
      )}

      <section className="mb-6 md:mb-8">
        <h2 className="mb-3 text-sm font-semibold md:text-base" style={{ color: DOJO.dorado }}>
          Resumen
        </h2>
        <div className="mb-4 flex flex-wrap gap-2">
          <span
            style={{
              background: '#1a4d2e',
              color: '#b8f5c8',
              padding: '0.4rem 0.75rem',
              borderRadius: 8,
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            {resumen.alDia} meses al día
          </span>
          <span
            style={{
              background: '#7a4b00',
              color: '#ffe9a0',
              padding: '0.4rem 0.75rem',
              borderRadius: 8,
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            {resumen.enMoraCount} meses en mora
          </span>
          <span
            style={{
              background: 'rgba(204,0,0,0.35)',
              color: '#ffc8c8',
              padding: '0.4rem 0.75rem',
              borderRadius: 8,
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            {resumen.sinPagar} meses sin pagar
          </span>
        </div>
        {resumen.pendienteTotal > 0 && (
          <p style={{ margin: 0, color: DOJO.rojo, fontWeight: 800, fontSize: '1rem' }}>
            Monto total pendiente: ${formatMonto(resumen.pendienteTotal)}
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold md:text-base" style={{ color: DOJO.dorado }}>
          Historial
        </h2>
        {items.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title="Sin mensualidades"
            description="No hay pagos registrados para este período"
          />
        ) : (
          <ul className="space-y-3 lg:space-y-0" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {items.map((row) => {
              const mora = enMora(row.mes, row.pagado);
              let badge;
              if (row.pagado) {
                badge = (
                  <span
                    style={{
                      display: 'inline-block',
                      background: '#1a4d2e',
                      color: '#b8f5c8',
                      padding: '0.25rem 0.55rem',
                      borderRadius: 999,
                      fontSize: '0.78rem',
                      fontWeight: 700,
                    }}
                  >
                    ✓ Pagado
                    {row.fechaPago && (
                      <span style={{ fontWeight: 500, opacity: 0.95 }}>
                        {' '}
                        · {formatFechaPago(row.fechaPago)}
                      </span>
                    )}
                  </span>
                );
              } else if (mora) {
                badge = (
                  <span
                    style={{
                      display: 'inline-block',
                      background: '#7a4b00',
                      color: '#ffe9a0',
                      padding: '0.25rem 0.55rem',
                      borderRadius: 999,
                      fontSize: '0.78rem',
                      fontWeight: 700,
                    }}
                  >
                    ⚠ En mora
                  </span>
                );
              } else {
                badge = (
                  <span
                    style={{
                      display: 'inline-block',
                      background: 'rgba(204,0,0,0.35)',
                      color: '#ffc8c8',
                      padding: '0.25rem 0.55rem',
                      borderRadius: 999,
                      fontSize: '0.78rem',
                      fontWeight: 700,
                    }}
                  >
                    ✗ Pendiente
                  </span>
                );
              }

              return (
                <li
                  key={row.id}
                  className="flex flex-col gap-3 rounded-lg border border-[#C9A84C]/25 bg-[#141414] p-4 text-sm md:text-base lg:flex-row lg:items-center lg:justify-between lg:rounded-none lg:border-0 lg:border-b lg:border-[#C9A84C]/25 lg:bg-transparent lg:p-0 lg:pb-4"
                >
                  <div className="min-w-0 sm:min-w-[10rem]">
                    <div className="mb-2 font-bold text-white">{mesLargoEs(row.mes)}</div>
                    {badge}
                  </div>
                  <div className="text-lg font-bold lg:text-base" style={{ color: DOJO.dorado }}>
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
