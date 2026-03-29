import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';

const DOJO = { negro: '#111111', rojo: '#CC0000', dorado: '#C9A84C' };

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
      <div style={{ padding: '1.5rem', background: DOJO.negro, color: '#aaa', minHeight: '100%' }}>
        Cargando…
      </div>
    );
  }

  return (
    <div
      className="mx-auto w-full max-w-[40rem] p-3 md:p-6 lg:p-8"
      style={{ minHeight: '100%', background: DOJO.negro, color: '#eee' }}
    >
      <h1 className="mb-4 text-lg font-semibold md:text-xl lg:text-2xl" style={{ color: DOJO.dorado }}>
        Mi póliza
      </h1>

      {error && (
        <div style={{ color: '#f88', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>
      )}

      <section className="mb-6 flex flex-col gap-4 md:mb-8">
        {!vigente ? (
          <div
            style={{
              background: 'rgba(204,0,0,0.2)',
              border: `2px solid ${DOJO.rojo}`,
              color: '#ffb0b0',
              padding: '1rem 1.15rem',
              borderRadius: 10,
              fontWeight: 800,
              fontSize: '1.05rem',
              lineHeight: 1.35,
            }}
          >
            Sin póliza registrada — Contacta al Sensei
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="text-xl font-extrabold leading-tight text-white md:text-2xl lg:text-[1.65rem]">
              {vigente.aseguradora}
            </div>
            <p className="text-sm text-[#ccc] md:text-base">
              <span style={{ color: '#888' }}>N° Póliza: </span>
              <span style={{ fontWeight: 700, color: '#eee' }}>{vigente.numeroPoliza}</span>
            </p>
            <div className="flex flex-col gap-1 text-sm text-[#bbb] md:flex-row md:flex-wrap md:gap-2 md:text-base">
              <p className="m-0">
                Inicio:{' '}
                <strong style={{ color: '#ddd', fontWeight: 600 }}>{formatFecha(vigente.fechaInicio)}</strong>
              </p>
              <span className="hidden md:inline" aria-hidden>
                ·
              </span>
              <p className="m-0">
                Vencimiento:{' '}
                <strong style={{ color: '#ddd', fontWeight: 600 }}>{formatFecha(vigente.fechaVencimiento)}</strong>
              </p>
            </div>

            {(() => {
              const est = vigente.estado;
              const diff = diasRelativoVencimiento(vigente.fechaVencimiento);
              let badge;
              if (est === 'activa') {
                badge = (
                  <span
                    style={{
                      display: 'inline-block',
                      background: '#1a4d2e',
                      color: '#b8f5c8',
                      padding: '0.5rem 1rem',
                      borderRadius: 10,
                      fontSize: '1rem',
                      fontWeight: 800,
                    }}
                  >
                    ✓ Póliza Activa
                  </span>
                );
              } else if (est === 'por_vencer') {
                badge = (
                  <span
                    style={{
                      display: 'inline-block',
                      background: '#7a4b00',
                      color: '#ffe9a0',
                      padding: '0.5rem 1rem',
                      borderRadius: 10,
                      fontSize: '1rem',
                      fontWeight: 800,
                    }}
                  >
                    ⚠ Por vencer
                  </span>
                );
              } else {
                badge = (
                  <span
                    style={{
                      display: 'inline-block',
                      background: 'rgba(204,0,0,0.35)',
                      color: '#ffc8c8',
                      padding: '0.5rem 1rem',
                      borderRadius: 10,
                      fontSize: '1rem',
                      fontWeight: 800,
                    }}
                  >
                    ✗ Póliza Vencida
                  </span>
                );
              }

              let diasLine = null;
              if (est === 'vencida') {
                const vencidos = Math.max(0, -diff);
                diasLine = (
                  <p style={{ margin: '0.85rem 0 0', fontSize: '1rem', color: '#f0a0a0', fontWeight: 700 }}>
                    Vencida hace {vencidos} {vencidos === 1 ? 'día' : 'días'}
                  </p>
                );
              } else {
                const rest = Math.max(0, diff);
                const diasColor = est === 'por_vencer' ? '#ffe9a0' : '#c8e8d0';
                diasLine = (
                  <p style={{ margin: '0.85rem 0 0', fontSize: '1rem', color: diasColor, fontWeight: 700 }}>
                    {rest === 0
                      ? 'Vence hoy'
                      : `${rest} ${rest === 1 ? 'día restante' : 'días restantes'}`}
                  </p>
                );
              }

              return (
                <div>
                  {badge}
                  {diasLine}
                </div>
              );
            })()}
          </div>
        )}
      </section>

      {historialRows.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-base font-bold md:text-lg" style={{ color: DOJO.dorado }}>
            Historial de pólizas anteriores
          </h2>
          <div className="space-y-3 lg:hidden">
            {historialRows.map((row) => (
              <div
                key={row.id}
                className="rounded-lg border border-[#333] bg-[#141414] p-4 text-sm"
              >
                <p className="mb-1 font-semibold text-white">{row.aseguradora}</p>
                <p className="mb-2 text-[#ccc]">N° {row.numeroPoliza}</p>
                <p className="mb-1 text-xs text-[#aaa]">Inicio: {formatFecha(row.fechaInicio)}</p>
                <p className="mb-2 text-xs text-[#aaa]">Vencimiento: {formatFecha(row.fechaVencimiento)}</p>
                <p className="text-[#ddd]">{labelEstadoTabla(row.estado)}</p>
              </div>
            ))}
          </div>
          <div className="hidden overflow-x-auto lg:block">
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.85rem',
                color: '#ddd',
              }}
            >
              <thead>
                <tr style={{ borderBottom: `2px solid ${DOJO.dorado}`, textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem 0.4rem', color: DOJO.dorado }}>Aseguradora</th>
                  <th style={{ padding: '0.5rem 0.4rem', color: DOJO.dorado }}>N° Póliza</th>
                  <th style={{ padding: '0.5rem 0.4rem', color: DOJO.dorado }}>Fecha inicio</th>
                  <th style={{ padding: '0.5rem 0.4rem', color: DOJO.dorado }}>Fecha vencimiento</th>
                  <th style={{ padding: '0.5rem 0.4rem', color: DOJO.dorado }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {historialRows.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #333' }}>
                    <td style={{ padding: '0.55rem 0.4rem', verticalAlign: 'top' }}>{row.aseguradora}</td>
                    <td style={{ padding: '0.55rem 0.4rem', verticalAlign: 'top' }}>{row.numeroPoliza}</td>
                    <td style={{ padding: '0.55rem 0.4rem', color: '#ccc', verticalAlign: 'top' }}>
                      {formatFecha(row.fechaInicio)}
                    </td>
                    <td style={{ padding: '0.55rem 0.4rem', color: '#ccc', verticalAlign: 'top' }}>
                      {formatFecha(row.fechaVencimiento)}
                    </td>
                    <td style={{ padding: '0.55rem 0.4rem', verticalAlign: 'top' }}>{labelEstadoTabla(row.estado)}</td>
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
