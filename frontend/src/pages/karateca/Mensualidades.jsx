import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';

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
      const { data } = await api.get(`/mensualidades/karateca/${id}`);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudieron cargar las mensualidades');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

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
    <div style={{ minHeight: '100%', background: DOJO.negro, color: '#eee', padding: '1.5rem', maxWidth: '36rem' }}>
      <h1 style={{ margin: '0 0 1.25rem', fontSize: '1.4rem', color: DOJO.dorado }}>Mensualidades</h1>

      {error && (
        <div style={{ color: '#f88', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>
      )}

      <section style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', color: '#aaa', fontWeight: 600 }}>
          Resumen
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.85rem' }}>
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

      <section>
        <h2 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', color: '#aaa', fontWeight: 600 }}>
          Historial
        </h2>
        {items.length === 0 ? (
          <p style={{ color: '#888', fontSize: '0.92rem', margin: 0 }}>No hay mensualidades registradas</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
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
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.65rem',
                    padding: '0.65rem 0',
                    borderBottom: '1px solid #333',
                    fontSize: '0.9rem',
                  }}
                >
                  <div style={{ minWidth: '10rem' }}>
                    <div style={{ fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>{mesLargoEs(row.mes)}</div>
                    {badge}
                  </div>
                  <div style={{ color: DOJO.dorado, fontWeight: 700 }}>${formatMonto(row.monto)}</div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
