import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../../lib/api';
import { GRADO_INFO, GRADO_ORDER, KyuBadge } from '../../../lib/kyuUtils';
import { Button, Modal } from '../../ui';

const TIPOS_DOCUMENTO = [
  { value: 'CC', label: 'CC — Cédula de Ciudadanía' },
  { value: 'TI', label: 'TI — Tarjeta de Identidad' },
  { value: 'CE', label: 'CE — Cédula de Extranjería' },
  { value: 'PA', label: 'PA — Pasaporte' },
  { value: 'RC', label: 'RC — Registro Civil' },
  { value: 'PPT', label: 'PPT — Permiso por Protección Temporal' },
];

const editSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  tipoDocumento: z.enum(['CC', 'TI', 'CE', 'PA', 'RC', 'PPT']),
  numeroDocumento: z
    .string()
    .min(1, 'El número de documento es obligatorio')
    .regex(/^\d+$/, 'Solo números'),
  telefono: z.string().optional(),
  fechaNacimiento: z.string().optional(),
  mesInicioMensualidades: z
    .string()
    .optional()
    .refine((s) => !s || /^\d{4}-\d{2}$/.test(s), 'Formato de mes inválido (YYYY-MM)'),
});

function gradoValue(row) {
  if (typeof row.dan === 'number' && row.dan >= 1) return `${row.dan}dan`;
  return row.kyuActual;
}

function gradoLabel(grado) {
  return GRADO_INFO[grado]?.label || grado;
}

const inputClass =
  'w-full rounded-md border border-white/20 bg-dojo-surface px-3 py-2 text-sm text-white outline-none focus:border-dojo-dorado focus:ring-2 focus:ring-dojo-dorado/30';

export default function EditarKaratecaModal({ karateca, onClose, onSuccess }) {
  // Local copy so ascenso/pre-examen updates reflect immediately without closing
  const [local, setLocal] = useState(karateca);
  const [error, setError] = useState(null);

  const [ascensoTarget, setAscensoTarget] = useState('');
  const [savingAscenso, setSavingAscenso] = useState(false);
  const [togglingPre, setTogglingPre] = useState(false);

  const [resetPwOpen, setResetPwOpen] = useState(false);
  const [resetPw, setResetPw] = useState('');
  const [resetPwConfirm, setResetPwConfirm] = useState('');
  const [resetPwError, setResetPwError] = useState(null);
  const [resetPwSuccess, setResetPwSuccess] = useState(false);
  const [resetPwSaving, setResetPwSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(editSchema) });

  // Sync form and local state when a new karateca is opened
  useEffect(() => {
    if (!karateca) {
      // Reset all internal state when modal closes
      setError(null);
      setResetPwOpen(false);
      setResetPw('');
      setResetPwConfirm('');
      setResetPwError(null);
      setResetPwSuccess(false);
      return;
    }
    setLocal(karateca);
    setError(null);
    const u = karateca.user;
    reset({
      nombre: u.nombre ?? '',
      tipoDocumento: ['CC', 'TI', 'CE', 'PA', 'RC', 'PPT'].includes(u.tipoDocumento)
        ? u.tipoDocumento
        : 'CC',
      numeroDocumento: u.numeroDocumento ?? '',
      telefono: u.telefono ?? '',
      fechaNacimiento: u.fechaNacimiento ? String(u.fechaNacimiento).slice(0, 10) : '',
      mesInicioMensualidades: karateca.mesInicioMensualidades ?? '',
    });
    setAscensoTarget(gradoValue(karateca) || GRADO_ORDER[0]);
  }, [karateca, reset]);

  const onEditSave = async (values) => {
    setError(null);
    try {
      await api.put(`/karatecas/${local.id}`, {
        nombre: values.nombre,
        tipoDocumento: values.tipoDocumento,
        numeroDocumento: values.numeroDocumento.trim(),
        telefono: values.telefono?.trim() || undefined,
        fechaNacimiento: values.fechaNacimiento?.trim() ? values.fechaNacimiento : null,
        mesInicioMensualidades: values.mesInicioMensualidades?.trim() || null,
      });
      onClose();
      onSuccess();
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo guardar');
    }
  };

  const confirmarAscenso = async () => {
    if (!local || !ascensoTarget) return;
    setSavingAscenso(true);
    setError(null);
    try {
      const { data } = await api.patch(`/karatecas/${local.id}/kyu`, {
        kyuActual: ascensoTarget,
        fechaUltimoAscenso: new Date().toISOString(),
      });
      setLocal((prev) => ({ ...prev, ...data }));
      onSuccess();
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo registrar el ascenso');
    } finally {
      setSavingAscenso(false);
    }
  };

  const togglePreExamen = async (next) => {
    setTogglingPre(true);
    setError(null);
    try {
      const { data } = await api.patch(`/karatecas/${local.id}/pre-examen`, {
        preExamenAprobado: next,
      });
      setLocal((prev) => ({ ...prev, preExamenAprobado: data.preExamenAprobado }));
      onSuccess();
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo actualizar el pre-examen');
    } finally {
      setTogglingPre(false);
    }
  };

  return (
    <Modal open={karateca !== null} onClose={onClose} title="Editar Karateca">
      {local && (
        <div className="space-y-6">
          <p className="text-xs text-white/50">
            Email: <span className="text-white/80">{local.user?.email}</span>
          </p>

          {error && (
            <div
              className="rounded-md border border-dojo-rojo/50 bg-dojo-rojo/20 px-3 py-2 text-sm text-red-200"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Data form */}
          <form onSubmit={handleSubmit(onEditSave)} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-white/80">Nombre completo</label>
              <input className={inputClass} {...register('nombre')} />
              {errors.nombre && (
                <p className="text-xs text-dojo-rojo">{errors.nombre.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-white/80">Tipo de documento</label>
              <select className={inputClass} {...register('tipoDocumento')}>
                {TIPOS_DOCUMENTO.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {errors.tipoDocumento && (
                <p className="text-xs text-dojo-rojo">{errors.tipoDocumento.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-white/80">Número de documento</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                className={inputClass}
                {...register('numeroDocumento')}
              />
              {errors.numeroDocumento && (
                <p className="text-xs text-dojo-rojo">{errors.numeroDocumento.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-white/80">Teléfono</label>
              <input className={inputClass} {...register('telefono')} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-white/80">Fecha de nacimiento</label>
              <input type="date" className={inputClass} {...register('fechaNacimiento')} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-white/80">Inicio de mensualidades</label>
              <input
                type="month"
                placeholder="Selecciona el mes desde el que debe pagar"
                className={[inputClass, 'border-dojo-dorado/30 placeholder:text-white/35'].join(' ')}
                {...register('mesInicioMensualidades')}
              />
              {errors.mesInicioMensualidades && (
                <p className="text-xs text-dojo-rojo">{errors.mesInicioMensualidades.message}</p>
              )}
            </div>

            <div className="flex flex-col justify-end gap-2 pt-2 sm:flex-row">
              <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? 'Guardando…' : 'Guardar datos'}
              </Button>
            </div>
          </form>

          {/* Reset password */}
          <div className="border-t border-dojo-dorado/20 pt-5">
            <h3 className="text-sm font-semibold text-dojo-dorado">Resetear contraseña</h3>
            {resetPwSuccess && (
              <p className="mt-2 text-sm font-medium text-emerald-400">
                Contraseña actualizada correctamente
              </p>
            )}
            {!resetPwOpen ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setResetPwError(null);
                  setResetPwSuccess(false);
                  setResetPw('');
                  setResetPwConfirm('');
                  setResetPwOpen(true);
                }}
              >
                Resetear contraseña
              </Button>
            ) : (
              <div className="mt-3 space-y-3 rounded-lg border border-dojo-dorado/25 bg-dojo-negro p-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-white/80">
                    Nueva contraseña temporal
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={resetPw}
                    onChange={(e) => setResetPw(e.target.value)}
                    minLength={6}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-white/80">Confirmar contraseña</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={resetPwConfirm}
                    onChange={(e) => setResetPwConfirm(e.target.value)}
                    minLength={6}
                    className={inputClass}
                  />
                </div>
                {resetPwError && (
                  <p className="text-sm text-dojo-rojo" role="alert">{resetPwError}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={resetPwSaving}
                    onClick={async () => {
                      setResetPwError(null);
                      if (resetPw.length < 6) {
                        setResetPwError('La contraseña debe tener al menos 6 caracteres');
                        return;
                      }
                      if (resetPw !== resetPwConfirm) {
                        setResetPwError('Las contraseñas no coinciden');
                        return;
                      }
                      const uid = local?.user?.id;
                      if (uid == null) {
                        setResetPwError('Usuario no disponible');
                        return;
                      }
                      setResetPwSaving(true);
                      try {
                        await api.patch(`/auth/reset-password/${uid}`, { passwordNueva: resetPw });
                        setResetPwOpen(false);
                        setResetPw('');
                        setResetPwConfirm('');
                        setResetPwSuccess(true);
                      } catch (e) {
                        setResetPwError(
                          e.response?.data?.message || 'No se pudo actualizar la contraseña',
                        );
                      } finally {
                        setResetPwSaving(false);
                      }
                    }}
                  >
                    {resetPwSaving ? 'Guardando…' : 'Confirmar reset'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={resetPwSaving}
                    onClick={() => {
                      setResetPwOpen(false);
                      setResetPw('');
                      setResetPwConfirm('');
                      setResetPwError(null);
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Ascenso de grado */}
          <div className="border-t border-dojo-dorado/20 pt-5">
            <h3 className="text-sm font-semibold text-dojo-dorado">Ascender grado</h3>
            <p className="mt-1 text-xs text-white/50">
              Grado actual: <KyuBadge kyu={gradoValue(local)} />
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <div className="min-w-[180px] flex-1">
                <label className="mb-1 block text-xs text-white/60">Grado</label>
                <select
                  value={ascensoTarget}
                  onChange={(e) => setAscensoTarget(e.target.value)}
                  className="w-full rounded-md border border-white/15 bg-dojo-negro px-3 py-2 text-sm text-white outline-none focus:border-dojo-dorado focus:ring-1 focus:ring-dojo-dorado"
                >
                  {GRADO_ORDER.map((k) => (
                    <option key={k} value={k}>{gradoLabel(k)}</option>
                  ))}
                </select>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={savingAscenso || !ascensoTarget}
                onClick={confirmarAscenso}
              >
                {savingAscenso ? '…' : 'Confirmar ascenso'}
              </Button>
            </div>
          </div>

          {/* Pre-examen toggle */}
          <div className="border-t border-dojo-dorado/20 pt-5">
            <h3 className="text-sm font-semibold text-dojo-dorado">Pre-examen</h3>
            <label className="mt-3 flex cursor-pointer items-center justify-between gap-4 rounded-md border border-white/10 bg-dojo-negro px-4 py-3">
              <span className="text-sm text-white/85">
                {local.preExamenAprobado ? 'Autorizado para examen' : 'No autorizado'}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={local.preExamenAprobado}
                disabled={togglingPre}
                onClick={() => togglePreExamen(!local.preExamenAprobado)}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                  local.preExamenAprobado ? 'bg-dojo-dorado' : 'bg-white/20'
                }`}
              >
                <span
                  className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-transform ${
                    local.preExamenAprobado ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </label>
          </div>
        </div>
      )}
    </Modal>
  );
}
