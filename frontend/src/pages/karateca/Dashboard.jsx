import { useCallback, useEffect, useState } from 'react';
import api from '../../lib/api';
import { KyuBadge } from '../../lib/kyuUtils';

const DOJO = { negro: '#111111', rojo: '#CC0000', dorado: '#C9A84C' };

function formatFecha(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function mesCortoEs(ym) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  const s = d.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function enMoraMensualidad(mesYyyyMm, pagado) {
  if (pagado) return false;
  const [y, mo] = mesYyyyMm.split('-').map(Number);
  const inicioDia6 = new Date(y, mo - 1, 6, 0, 0, 0, 0);
  return new Date() >= inicioDia6;
}

function colorPromedio(p) {
  if (p >= 80) return '#6ecf7a';
  if (p >= 50) return '#e6c84c';
  return '#e85c5c';
}

function badgePolizaEstado(estado) {
  if (estado === 'activa') return { label: 'Activa', bg: '#1a4d2e', color: '#9af7b8' };
  if (estado === 'por_vencer') return { label: '⚠ Por vencer', bg: '#7a4b00', color: '#ffd08a' };
  return { label: 'Vencida', bg: 'rgba(204,0,0,0.4)', color: '#ffaaaa' };
}

export default function KaratecaDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: d } = await api.get('/dashboard/karateca');
      setData(d);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo cargar tu resumen');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div style={{ padding: '1.5rem', background: DOJO.negro, color: '#aaa', minHeight: '100%' }}>
        Cargando…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '1.5rem', background: DOJO.negro, color: '#f88', minHeight: '100%' }}>
        {error || 'Sin datos'}
      </div>
    );
  }

  const { karateca, asistencia, mensualidades, poliza } = data;
  const col = colorPromedio(asistencia.promedio);
  const u = karateca.user;

  return (
    <div style={{ minHeight: '100%', background: DOJO.negro, color: '#eee', padding: '1.5rem', maxWidth: '52rem' }}>
      {/* Sección 1 — Perfil */}
      <section
        style={{
          borderBottom: `2px solid ${DOJO.dorado}`,
          paddingBottom: '1.25rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#fff', fontWeight: 800 }}>{u.nombre}</h1>
          <KyuBadge kyu={karateca.kyuActual} />
        </div>
        {karateca.preExamenAprobado ? (
          <div
            style={{
              display: 'inline-block',
              background: `linear-gradient(135deg, ${DOJO.dorado}, #a88628)`,
              color: DOJO.negro,
              padding: '0.35rem 0.75rem',
              borderRadius: 8,
              fontWeight: 800,
              fontSize: '0.85rem',
              marginBottom: '1rem',
            }}
          >
            ⭐ Autorizado para examen
          </div>
        ) : (
          <div
            style={{
              display: 'inline-block',
              background: '#444',
              color: '#ccc',
              padding: '0.35rem 0.75rem',
              borderRadius: 8,
              fontSize: '0.85rem',
              marginBottom: '1rem',
            }}
          >
            Pre-examen pendiente
          </div>
        )}
        <dl style={{ margin: 0, display: 'grid', gap: '0.45rem', fontSize: '0.92rem' }}>
          <div><dt style={{ display: 'inline', color: '#888' }}>Email: </dt><dd style={{ display: 'inline', margin: 0 }}>{u.email}</dd></div>
          <div><dt style={{ display: 'inline', color: '#888' }}>Teléfono: </dt><dd style={{ display: 'inline', margin: 0 }}>{u.telefono || '—'}</dd></div>
          <div><dt style={{ display: 'inline', color: '#888' }}>Fecha de nacimiento: </dt><dd style={{ display: 'inline', margin: 0 }}>{formatFecha(u.fechaNacimiento)}</dd></div>
          <div><dt style={{ display: 'inline', color: '#888' }}>Ingreso al dojo: </dt><dd style={{ display: 'inline', margin: 0 }}>{formatFecha(u.fechaIngreso)}</dd></div>
        </dl>
      </section>

      {/* Sección 2 — Asistencia */}
      <section style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: DOJO.dorado }}>Asistencia</h2>
        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: col, lineHeight: 1 }}>{asistencia.promedio}%</div>
        <p style={{ margin: '0.35rem 0 0.75rem', color: '#aaa', fontSize: '0.9rem' }}>
          {asistencia.clasesAsistidas} de {asistencia.totalClases} clases asistidas
        </p>
        <div
          style={{
            height: 10,
            borderRadius: 999,
            background: '#333',
            overflow: 'hidden',
            maxWidth: '100%',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, asistencia.promedio)}%`,
              background: col,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </section>

      {/* Sección 3 — Mensualidades */}
      <section style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: DOJO.dorado }}>Mensualidades (últimos 6 meses)</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
          {mensualidades.map((m) => {
            const label = mesCortoEs(m.mes);
            const mora = enMoraMensualidad(m.mes, m.pagado);
            let bg;
            let color;
            let text;
            if (m.pagado) {
              bg = '#1a4d2e';
              color = '#b8f5c8';
              text = `✓ ${label}`;
            } else if (mora) {
              bg = '#7a4b00';
              color = '#ffe9a0';
              text = `⚠ ${label}`;
            } else {
              bg = 'rgba(204,0,0,0.35)';
              color = '#ffc8c8';
              text = `✗ ${label}`;
            }
            return (
              <span
                key={m.mes}
                style={{
                  display: 'inline-block',
                  padding: '0.35rem 0.65rem',
                  borderRadius: 8,
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  background: bg,
                  color,
                }}
              >
                {text}
              </span>
            );
          })}
        </div>
      </section>

      {/* Sección 4 — Póliza */}
      <section>
        <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: DOJO.dorado }}>Póliza</h2>
        {!poliza ? (
          <p style={{ color: DOJO.rojo, fontWeight: 700, margin: 0 }}>Sin póliza registrada</p>
        ) : (
          <div
            style={{
              background: '#1a1a1a',
              border: `1px solid ${DOJO.dorado}`,
              borderRadius: 10,
              padding: '1rem',
            }}
          >
            <div style={{ marginBottom: '0.65rem' }}>
              {(() => {
                const b = badgePolizaEstado(poliza.estado);
                return (
                  <span
                    style={{
                      background: b.bg,
                      color: b.color,
                      padding: '0.25rem 0.55rem',
                      borderRadius: 999,
                      fontSize: '0.78rem',
                      fontWeight: 700,
                    }}
                  >
                    {b.label}
                  </span>
                );
              })()}
            </div>
            <dl style={{ margin: 0, display: 'grid', gap: '0.4rem', fontSize: '0.9rem' }}>
              <div><dt style={{ display: 'inline', color: '#888' }}>Aseguradora: </dt><dd style={{ display: 'inline', margin: 0 }}>{poliza.aseguradora}</dd></div>
              <div><dt style={{ display: 'inline', color: '#888' }}>Número: </dt><dd style={{ display: 'inline', margin: 0 }}>{poliza.numeroPoliza}</dd></div>
              <div><dt style={{ display: 'inline', color: '#888' }}>Inicio: </dt><dd style={{ display: 'inline', margin: 0 }}>{formatFecha(poliza.fechaInicio)}</dd></div>
              <div><dt style={{ display: 'inline', color: '#888' }}>Vencimiento: </dt><dd style={{ display: 'inline', margin: 0 }}>{formatFecha(poliza.fechaVencimiento)}</dd></div>
            </dl>
          </div>
        )}
      </section>
    </div>
  );
}
