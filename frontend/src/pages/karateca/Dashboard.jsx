import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

function pad2(n) {
  return String(n).padStart(2, '0');
}

function ymdActualMes() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
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

  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [pwdActual, setPwdActual] = useState('');
  const [pwdNueva, setPwdNueva] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdError, setPwdError] = useState(null);
  const [pwdSubmitting, setPwdSubmitting] = useState(false);
  const [seguridadMsg, setSeguridadMsg] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: d } = await api.get('/dashboard/karateca');
      const { data: full } = await api.get(`/karatecas/${d.karateca.id}`);
      setData({
        ...d,
        karateca: {
          ...d.karateca,
          user: {
            ...d.karateca.user,
            tipoDocumento: full.user?.tipoDocumento ?? d.karateca.user?.tipoDocumento,
            numeroDocumento: full.user?.numeroDocumento ?? d.karateca.user?.numeroDocumento,
          },
        },
      });
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

  const ymActual = ymdActualMes();
  const filaMesActual = Array.isArray(mensualidades)
    ? mensualidades.find((m) => m.mes === ymActual)
    : undefined;
  const mesActualPagado = filaMesActual?.pagado === true;
  const hayMesesEnMora = Array.isArray(mensualidades)
    ? mensualidades.some((m) => enMoraMensualidad(m.mes, m.pagado))
    : false;
  const mensualidadesAlDia = mesActualPagado && !hayMesesEnMora;

  return (
    <div
      className="mx-auto w-full max-w-[52rem] p-3 md:p-6 lg:p-8"
      style={{ minHeight: '100%', background: DOJO.negro, color: '#eee' }}
    >
      {/* Sección 1 — Perfil */}
      <section
        className="mb-6 border-b pb-5 md:mb-8"
        style={{ borderColor: DOJO.dorado }}
      >
        <div className="mb-3 flex flex-wrap items-center gap-2 md:gap-3">
          <h1 className="text-xl font-extrabold text-white md:text-2xl lg:text-3xl">{u.nombre}</h1>
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
          <div>
            <dt style={{ display: 'inline', color: '#888' }}>Documento: </dt>
            <dd style={{ display: 'inline', margin: 0 }}>
              {u.tipoDocumento && u.numeroDocumento
                ? `${u.tipoDocumento} ${u.numeroDocumento}`
                : '—'}
            </dd>
          </div>
          <div><dt style={{ display: 'inline', color: '#888' }}>Email: </dt><dd style={{ display: 'inline', margin: 0 }}>{u.email}</dd></div>
          <div><dt style={{ display: 'inline', color: '#888' }}>Teléfono: </dt><dd style={{ display: 'inline', margin: 0 }}>{u.telefono || '—'}</dd></div>
          <div><dt style={{ display: 'inline', color: '#888' }}>Fecha de nacimiento: </dt><dd style={{ display: 'inline', margin: 0 }}>{formatFecha(u.fechaNacimiento)}</dd></div>
        </dl>

        <div
          style={{
            marginTop: '1.25rem',
            paddingTop: '1.25rem',
            borderTop: `1px solid ${DOJO.dorado}`,
          }}
        >
          <h3 style={{ margin: '0 0 0.65rem', fontSize: '0.95rem', color: DOJO.dorado, fontWeight: 700 }}>
            Seguridad
          </h3>
          {seguridadMsg && (
            <p style={{ margin: '0 0 0.65rem', fontSize: '0.88rem', color: '#8fdf8f', fontWeight: 600 }}>
              {seguridadMsg}
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              setPwdError(null);
              setPwdActual('');
              setPwdNueva('');
              setPwdConfirm('');
              setPwdModalOpen(true);
            }}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: 8,
              border: `1px solid ${DOJO.dorado}`,
              background: '#1a1a1a',
              color: DOJO.dorado,
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
            }}
          >
            Cambiar contraseña
          </button>
        </div>
      </section>

      {pwdModalOpen && (
        <div
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.75)',
            padding: '1rem',
          }}
          onClick={() => !pwdSubmitting && setPwdModalOpen(false)}
        >
          <div
            role="dialog"
            aria-labelledby="pwd-modal-title"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '22rem',
              background: DOJO.negro,
              border: `2px solid ${DOJO.dorado}`,
              borderRadius: 10,
              padding: '1.15rem',
            }}
          >
            <h3 id="pwd-modal-title" style={{ margin: '0 0 1rem', color: DOJO.dorado, fontSize: '1.05rem' }}>
              Cambiar contraseña
            </h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setPwdError(null);
                if (pwdNueva.length < 6) {
                  setPwdError('La nueva contraseña debe tener al menos 6 caracteres');
                  return;
                }
                if (pwdNueva !== pwdConfirm) {
                  setPwdError('La nueva contraseña y la confirmación no coinciden');
                  return;
                }
                setPwdSubmitting(true);
                try {
                  const res = await api.patch(
                    '/auth/change-password',
                    {
                      passwordActual: pwdActual,
                      passwordNueva: pwdNueva,
                    },
                    { validateStatus: () => true },
                  );
                  if (res.status === 200) {
                    setPwdModalOpen(false);
                    setPwdActual('');
                    setPwdNueva('');
                    setPwdConfirm('');
                    setSeguridadMsg('Contraseña actualizada correctamente');
                    window.setTimeout(() => setSeguridadMsg(null), 5000);
                  } else if (res.status === 401) {
                    setPwdError(
                      res.data?.message || 'Contraseña actual incorrecta',
                    );
                  } else {
                    setPwdError(
                      res.data?.message || 'No se pudo cambiar la contraseña',
                    );
                  }
                } catch (err) {
                  setPwdError(
                    err.response?.data?.message || 'No se pudo cambiar la contraseña',
                  );
                } finally {
                  setPwdSubmitting(false);
                }
              }}
            >
              <label style={{ display: 'block', marginBottom: '0.75rem' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#bbb', marginBottom: '0.25rem' }}>
                  Contraseña actual
                </span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={pwdActual}
                  onChange={(e) => setPwdActual(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.45rem',
                    borderRadius: 6,
                    border: `1px solid ${DOJO.rojo}`,
                    background: '#0d0d0d',
                    color: '#fff',
                  }}
                />
              </label>
              <label style={{ display: 'block', marginBottom: '0.75rem' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#bbb', marginBottom: '0.25rem' }}>
                  Nueva contraseña
                </span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={pwdNueva}
                  onChange={(e) => setPwdNueva(e.target.value)}
                  minLength={6}
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.45rem',
                    borderRadius: 6,
                    border: `1px solid ${DOJO.rojo}`,
                    background: '#0d0d0d',
                    color: '#fff',
                  }}
                />
              </label>
              <label style={{ display: 'block', marginBottom: '0.85rem' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#bbb', marginBottom: '0.25rem' }}>
                  Confirmar nueva contraseña
                </span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={pwdConfirm}
                  onChange={(e) => setPwdConfirm(e.target.value)}
                  minLength={6}
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.45rem',
                    borderRadius: 6,
                    border: `1px solid ${DOJO.rojo}`,
                    background: '#0d0d0d',
                    color: '#fff',
                  }}
                />
              </label>
              {pwdError && (
                <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: '#f88' }} role="alert">
                  {pwdError}
                </p>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  disabled={pwdSubmitting}
                  onClick={() => !pwdSubmitting && setPwdModalOpen(false)}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: 6,
                    border: '1px solid #555',
                    background: 'transparent',
                    color: '#ccc',
                    cursor: pwdSubmitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pwdSubmitting}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: 6,
                    border: 'none',
                    background: DOJO.rojo,
                    color: '#fff',
                    fontWeight: 700,
                    cursor: pwdSubmitting ? 'not-allowed' : 'pointer',
                    opacity: pwdSubmitting ? 0.75 : 1,
                  }}
                >
                  {pwdSubmitting ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sección 2 — Asistencia */}
      <section className="mb-6 md:mb-8">
        <h2 className="mb-2 text-sm font-semibold md:text-base" style={{ color: DOJO.dorado }}>
          Asistencia
        </h2>
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
      <section className="mb-6 md:mb-8">
        <h2 className="mb-3 text-sm font-semibold md:text-base" style={{ color: DOJO.dorado }}>
          Mensualidades
        </h2>
        <div
          style={{
            display: 'inline-block',
            padding: '0.65rem 1.15rem',
            borderRadius: 10,
            fontSize: '1.05rem',
            fontWeight: 800,
            background: mensualidadesAlDia ? '#1a4d2e' : 'rgba(204,0,0,0.35)',
            color: mensualidadesAlDia ? '#b8f5c8' : '#ffc8c8',
          }}
        >
          {mensualidadesAlDia ? '✓ Al día' : '✗ Tiene pagos pendientes'}
        </div>
        <div style={{ marginTop: '0.65rem' }}>
          <Link
            to="/karateca/mensualidades"
            style={{
              fontSize: '0.85rem',
              color: DOJO.dorado,
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Ver historial completo →
          </Link>
        </div>
      </section>

      {/* Sección 4 — Póliza */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold md:text-base" style={{ color: DOJO.dorado }}>
          Póliza
        </h2>
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
