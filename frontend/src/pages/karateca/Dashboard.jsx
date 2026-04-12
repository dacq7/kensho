import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, DollarSign, Shield } from 'lucide-react';
import api from '../../lib/api';
import { KyuBadge } from '../../lib/kyuUtils';
import { Badge, Button, Card, Input, Modal, SkeletonCard } from '../../components/ui';

/* ── pure helpers (logic unchanged) ─────────────────────────── */

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

/* ── presentation helpers ────────────────────────────────────── */

function colorPromedioClass(p) {
  if (p >= 80) return { text: 'text-emerald-400', bg: 'bg-emerald-400' };
  if (p >= 50) return { text: 'text-amber-400', bg: 'bg-amber-400' };
  return { text: 'text-red-400', bg: 'bg-red-400' };
}

function polizaBadgeVariant(estado) {
  if (estado === 'activa') return 'success';
  if (estado === 'por_vencer') return 'warning';
  return 'danger';
}

function polizaBadgeLabel(estado) {
  if (estado === 'activa') return 'Activa';
  if (estado === 'por_vencer') return '⚠ Por vencer';
  return 'Vencida';
}

function getInitials(nombre) {
  if (!nombre) return 'U';
  const words = nombre.trim().split(/\s+/);
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
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

/* ── ProfileField ────────────────────────────────────────────── */

function ProfileField({ label, value }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-white/40">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-white/85">{value || '—'}</dd>
    </div>
  );
}

/* ── Page component ──────────────────────────────────────────── */

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

  /* count-up — must be before early returns */
  const countPromedio = useCountUp(data?.asistencia?.promedio ?? 0);

  /* ── loading ── */
  if (loading) {
    return (
      <div className="min-h-full p-3 md:p-6 lg:p-8">
        <div className="mx-auto max-w-2xl grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  /* ── error ── */
  if (error || !data) {
    return (
      <div className="min-h-full p-3 md:p-6 lg:p-8">
        <div
          className="rounded-lg border border-dojo-rojo/50 bg-dojo-rojo/20 px-4 py-3 text-sm text-red-200"
          role="alert"
        >
          {error || 'Sin datos'}
        </div>
      </div>
    );
  }

  /* ── derive values ── */
  const { karateca, asistencia, mensualidades, poliza } = data;
  const u = karateca.user;
  const col = colorPromedioClass(asistencia.promedio);

  const ymActual = ymdActualMes();
  const filaMesActual = Array.isArray(mensualidades)
    ? mensualidades.find((m) => m.mes === ymActual)
    : undefined;
  const mesActualPagado = filaMesActual?.pagado === true;
  const hayMesesEnMora = Array.isArray(mensualidades)
    ? mensualidades.some((m) => enMoraMensualidad(m.mes, m.pagado))
    : false;
  const mensualidadesAlDia = mesActualPagado && !hayMesesEnMora;

  /* ── render ── */
  return (
    <div className="min-h-full p-3 md:p-6 lg:p-8">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* ── Sección 1: Perfil ── */}
        <Card>
          {/* Avatar + name row */}
          <div className="flex flex-wrap items-center gap-4">
            <div
              className="flex shrink-0 items-center justify-center rounded-full border-2 border-dojo-dorado/40 bg-dojo-rojo/20 text-xl font-black text-dojo-dorado"
              style={{ width: 64, height: 64 }}
            >
              {getInitials(u.nombre)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold text-white">{u.nombre}</h1>
                <KyuBadge kyu={karateca.kyuActual} />
              </div>
              <div className="mt-1.5">
                {karateca.preExamenAprobado ? (
                  <Badge variant="gold">⭐ Autorizado para examen</Badge>
                ) : (
                  <Badge variant="muted">Pre-examen pendiente</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="my-5 h-px bg-dojo-dorado/15" />

          {/* Profile data grid */}
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ProfileField
              label="Documento"
              value={
                u.tipoDocumento && u.numeroDocumento
                  ? `${u.tipoDocumento} ${u.numeroDocumento}`
                  : null
              }
            />
            <ProfileField label="Email" value={u.email} />
            <ProfileField label="Teléfono" value={u.telefono} />
            <ProfileField label="Fecha de nacimiento" value={formatFecha(u.fechaNacimiento)} />
          </dl>

          {/* Security */}
          <div className="mt-5 border-t border-dojo-dorado/15 pt-5">
            <h3 className="mb-3 text-sm font-bold text-dojo-dorado">Seguridad</h3>
            {seguridadMsg && (
              <p className="mb-3 text-sm font-semibold text-emerald-400">{seguridadMsg}</p>
            )}
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => {
                setPwdError(null);
                setPwdActual('');
                setPwdNueva('');
                setPwdConfirm('');
                setPwdModalOpen(true);
              }}
            >
              Cambiar contraseña
            </Button>
          </div>
        </Card>

        {/* ── Password modal ── */}
        <Modal
          open={pwdModalOpen}
          onClose={() => { if (!pwdSubmitting) setPwdModalOpen(false); }}
          title="Cambiar contraseña"
        >
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
                  setPwdError(res.data?.message || 'Contraseña actual incorrecta');
                } else {
                  setPwdError(res.data?.message || 'No se pudo cambiar la contraseña');
                }
              } catch (err) {
                setPwdError(err.response?.data?.message || 'No se pudo cambiar la contraseña');
              } finally {
                setPwdSubmitting(false);
              }
            }}
            className="space-y-4"
          >
            <Input
              id="pwd-actual"
              label="Contraseña actual"
              type="password"
              autoComplete="current-password"
              value={pwdActual}
              onChange={(e) => setPwdActual(e.target.value)}
              required
            />
            <Input
              id="pwd-nueva"
              label="Nueva contraseña"
              type="password"
              autoComplete="new-password"
              value={pwdNueva}
              onChange={(e) => setPwdNueva(e.target.value)}
              minLength={6}
              required
            />
            <Input
              id="pwd-confirm"
              label="Confirmar nueva contraseña"
              type="password"
              autoComplete="new-password"
              value={pwdConfirm}
              onChange={(e) => setPwdConfirm(e.target.value)}
              minLength={6}
              required
            />

            {pwdError && (
              <div
                role="alert"
                className="rounded-r-md border-l-4 border-dojo-rojo bg-dojo-rojo/10 px-4 py-2.5 text-sm text-red-300"
              >
                {pwdError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={pwdSubmitting}
                onClick={() => !pwdSubmitting && setPwdModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={pwdSubmitting}
              >
                {pwdSubmitting ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* ── Sección 2: Asistencia ── */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-dojo-dorado" aria-hidden />
            <h2 className="text-sm font-semibold text-dojo-dorado md:text-base">Asistencia</h2>
          </div>

          <p className={`text-5xl font-black leading-none ${col.text}`}>
            {countPromedio}%
          </p>
          <p className="mt-2 text-sm text-white/50">
            {asistencia.clasesAsistidas} de {asistencia.totalClases} clases asistidas
          </p>

          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-700 ${col.bg}`}
              style={{ width: `${Math.min(100, asistencia.promedio)}%` }}
            />
          </div>
        </Card>

        {/* ── Sección 3: Mensualidades ── */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-dojo-dorado" aria-hidden />
            <h2 className="text-sm font-semibold text-dojo-dorado md:text-base">Mensualidades</h2>
          </div>

          <div
            className={[
              'inline-flex items-center rounded-full border px-4 py-2 text-base font-bold',
              mensualidadesAlDia
                ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300'
                : 'border-dojo-rojo/30 bg-dojo-rojo/20 text-red-300',
            ].join(' ')}
          >
            {mensualidadesAlDia ? '✓ Al día' : '✗ Pagos pendientes'}
          </div>

          <div className="mt-4">
            <Link
              to="/karateca/mensualidades"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md border border-dojo-dorado/50 px-3 py-1.5 text-sm font-medium text-dojo-dorado transition-colors hover:bg-dojo-dorado/10"
            >
              Ver historial completo →
            </Link>
          </div>
        </Card>

        {/* ── Sección 4: Póliza ── */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-dojo-dorado" aria-hidden />
            <h2 className="text-sm font-semibold text-dojo-dorado md:text-base">Póliza</h2>
          </div>

          {!poliza ? (
            <div className="space-y-2">
              <Badge variant="danger">Sin póliza registrada</Badge>
              <p className="text-sm text-white/50">
                Contacta a tu sensei para registrar tu póliza
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <Badge variant={polizaBadgeVariant(poliza.estado)}>
                  {polizaBadgeLabel(poliza.estado)}
                </Badge>
              </div>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ProfileField label="Aseguradora" value={poliza.aseguradora} />
                <ProfileField label="Número de póliza" value={poliza.numeroPoliza} />
                <ProfileField label="Inicio" value={formatFecha(poliza.fechaInicio)} />
                <ProfileField label="Vencimiento" value={formatFecha(poliza.fechaVencimiento)} />
              </dl>
            </>
          )}
        </Card>

      </div>
    </div>
  );
}
