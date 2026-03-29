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
    <div style={{ minHeight: '100%', background: DOJO.negro, color: '#eee', padding: '1.5rem', maxWidth: '40rem' }}>
      <h1 style={{ margin: '0 0 1.25rem', fontSize: '1.4rem', color: DOJO.dorado }}>Mi póliza</h1>

      {error && (
        <div style={{ color: '#f88', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>
      )}

      <section style={{ marginBottom: '1.75rem' }}>
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
          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#fff', marginBottom: '0.65rem', lineHeight: 1.2 }}>
              {vigente.aseguradora}
            </div>
            <p style={{ margin: '0 0 0.35rem', fontSize: '0.95rem', color: '#ccc' }}>
              <span style={{ color: '#888' }}>N° Póliza: </span>
              <span style={{ fontWeight: 700, color: '#eee' }}>{vigente.numeroPoliza}</span>
            </p>
            <p style={{ margin: '0 0 1rem', fontSize: '0.92rem', color: '#bbb' }}>
              Inicio: <strong style={{ color: '#ddd', fontWeight: 600 }}>{formatFecha(vigente.fechaInicio)}</strong>
              {' · '}
              Vencimiento:{' '}
              <strong style={{ color: '#ddd', fontWeight: 600 }}>{formatFecha(vigente.fechaVencimiento)}</strong>
            </p>

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
        <section>
          <h2 style={{ margin: '0 0 0.85rem', fontSize: '1.05rem', color: DOJO.dorado, fontWeight: 700 }}>
            Historial de pólizas anteriores
          </h2>
          <div style={{ overflowX: 'auto' }}>
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
