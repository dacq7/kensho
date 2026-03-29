import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Plus, ToggleLeft, ToggleRight, Trash2, X } from 'lucide-react';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';
import { GRADO_INFO, GRADO_ORDER, KyuBadge } from '../../lib/kyuUtils';

const TIPOS_DOCUMENTO = [
  { value: 'CC', label: 'CC — Cédula de Ciudadanía' },
  { value: 'TI', label: 'TI — Tarjeta de Identidad' },
  { value: 'CE', label: 'CE — Cédula de Extranjería' },
  { value: 'PA', label: 'PA — Pasaporte' },
  { value: 'RC', label: 'RC — Registro Civil' },
  { value: 'PPT', label: 'PPT — Permiso por Protección Temporal' },
];

const tipoDocEnum = z.enum(['CC', 'TI', 'CE', 'PA', 'RC', 'PPT']);

const createSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  email: z.string().email('Email no válido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  tipoDocumento: tipoDocEnum,
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

const editSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  tipoDocumento: tipoDocEnum,
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

function formatoDocumento(user) {
  if (!user?.numeroDocumento) return '—';
  const t = user.tipoDocumento || '';
  return [t, user.numeroDocumento].filter(Boolean).join(' ');
}

function getLatestPoliza(polizas) {
  if (!polizas?.length) return null;
  return [...polizas].sort(
    (a, b) => new Date(b.fechaInicio) - new Date(a.fechaInicio),
  )[0];
}

/** 'sin' | 'activa' | 'vencida' */
function polizaEstado(polizas) {
  if (!polizas?.length) return 'sin';
  const p = getLatestPoliza(polizas);
  const v = new Date(p.fechaVencimiento);
  const end = new Date(v.getFullYear(), v.getMonth(), v.getDate());
  const t = new Date();
  const today = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  return end >= today ? 'activa' : 'vencida';
}

function gradoValue(row) {
  if (typeof row.dan === 'number' && row.dan >= 1) return `${row.dan}dan`;
  return row.kyuActual;
}

function gradoLabel(grado) {
  return GRADO_INFO[grado]?.label || grado;
}

function isActiveRow(row) {
  return row.activo !== false;
}

export default function SenseiKaratecasPage() {
  const token = useAuthStore((s) => s.token);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filterKyu, setFilterKyu] = useState('all');
  const [filterPoliza, setFilterPoliza] = useState('all');

  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);

  const [ascensoTarget, setAscensoTarget] = useState('');
  const [savingAscenso, setSavingAscenso] = useState(false);
  const [togglingPre, setTogglingPre] = useState(false);

  const [resetPwOpen, setResetPwOpen] = useState(false);
  const [resetPw, setResetPw] = useState('');
  const [resetPwConfirm, setResetPwConfirm] = useState('');
  const [resetPwError, setResetPwError] = useState(null);
  const [resetPwSuccess, setResetPwSuccess] = useState(false);
  const [resetPwSaving, setResetPwSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const { data } = await api.get('/karatecas?incluirInactivos=true');
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo cargar la lista');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, token]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filterKyu !== 'all' && gradoValue(r) !== filterKyu) {
        return false;
      }
      const pe = polizaEstado(r.polizas);
      if (filterPoliza === 'all') return true;
      if (filterPoliza === 'sin') return pe === 'sin';
      return pe === filterPoliza;
    });
  }, [rows, filterKyu, filterPoliza]);

  const createForm = useForm({
    resolver: zodResolver(createSchema),
    defaultValues: {
      nombre: '',
      email: '',
      password: '',
      tipoDocumento: 'CC',
      numeroDocumento: '',
      telefono: '',
      fechaNacimiento: '',
      mesInicioMensualidades: '',
    },
  });

  const editForm = useForm({
    resolver: zodResolver(editSchema),
    defaultValues: {
      nombre: '',
      tipoDocumento: 'CC',
      numeroDocumento: '',
      telefono: '',
      fechaNacimiento: '',
      mesInicioMensualidades: '',
    },
  });

  useEffect(() => {
    if (!editing) return;
    const u = editing.user;
    const fn = u.fechaNacimiento
      ? String(u.fechaNacimiento).slice(0, 10)
      : '';
    editForm.reset({
      nombre: u.nombre ?? '',
      tipoDocumento: (u.tipoDocumento && ['CC', 'TI', 'CE', 'PA', 'RC', 'PPT'].includes(u.tipoDocumento))
        ? u.tipoDocumento
        : 'CC',
      numeroDocumento: u.numeroDocumento ?? '',
      telefono: u.telefono ?? '',
      fechaNacimiento: fn,
      mesInicioMensualidades: editing?.mesInicioMensualidades ?? '',
    });
    setAscensoTarget(gradoValue(editing) || GRADO_ORDER[0]);
  }, [editing, editForm]);

  const closeModals = () => {
    setModal(null);
    setEditing(null);
    createForm.reset();
    setResetPwOpen(false);
    setResetPw('');
    setResetPwConfirm('');
    setResetPwError(null);
    setResetPwSuccess(false);
  };

  const onCreate = async (values) => {
    setError(null);
    try {
      await api.post('/karatecas', {
        nombre: values.nombre,
        email: values.email,
        password: values.password,
        tipoDocumento: values.tipoDocumento,
        numeroDocumento: values.numeroDocumento.trim(),
        telefono: values.telefono?.trim() || undefined,
        fechaNacimiento: values.fechaNacimiento?.trim() || undefined,
        mesInicioMensualidades: values.mesInicioMensualidades?.trim() || undefined,
      });
      closeModals();
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo crear el karateca');
    }
  };

  const onEditSave = async (values) => {
    if (!editing) return;
    setError(null);
    try {
      await api.put(`/karatecas/${editing.id}`, {
        nombre: values.nombre,
        tipoDocumento: values.tipoDocumento,
        numeroDocumento: values.numeroDocumento.trim(),
        telefono: values.telefono?.trim() || undefined,
        fechaNacimiento: values.fechaNacimiento?.trim()
          ? values.fechaNacimiento
          : null,
        mesInicioMensualidades: values.mesInicioMensualidades?.trim() || null,
      });
      closeModals();
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo guardar');
    }
  };

  const confirmarAscenso = async () => {
    if (!editing || !ascensoTarget) return;
    setSavingAscenso(true);
    setError(null);
    try {
      const { data } = await api.patch(`/karatecas/${editing.id}/kyu`, {
        kyuActual: ascensoTarget,
        fechaUltimoAscenso: new Date().toISOString(),
      });
      setEditing((prev) =>
        prev && prev.id === editing.id ? { ...prev, ...data } : prev,
      );
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo registrar el ascenso');
    } finally {
      setSavingAscenso(false);
    }
  };

  const toggleActivo = async (row) => {
    setError(null);
    try {
      await api.patch(`/karatecas/${row.id}/activo`, { activo: !isActiveRow(row) });
      await load();
      setEditing((prev) => (
        prev && prev.id === row.id ? { ...prev, activo: !isActiveRow(row) } : prev
      ));
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo cambiar el estado');
    }
  };

  const eliminarKarateca = async (row) => {
    const ok = window.confirm('¿Estás seguro? Esta acción no se puede deshacer');
    if (!ok) return;
    setError(null);
    try {
      await api.delete(`/karatecas/${row.id}`);
      if (editing?.id === row.id) closeModals();
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo eliminar el karateca');
    }
  };

  const togglePreExamen = async (next) => {
    if (!editing) return;
    setTogglingPre(true);
    setError(null);
    try {
      const { data } = await api.patch(`/karatecas/${editing.id}/pre-examen`, {
        preExamenAprobado: next,
      });
      setEditing((prev) => (prev ? { ...prev, preExamenAprobado: data.preExamenAprobado } : null));
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo actualizar el pre-examen');
    } finally {
      setTogglingPre(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-[#C9A84C] md:text-xl lg:text-2xl">
            Karatecas
          </h1>
          <p className="mt-1 text-sm text-white/55">
            Gestión de alumnos del dojo
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null);
            createForm.reset();
            setModal('new');
          }}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md border border-[#C9A84C]/30 bg-[#CC0000] px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#b30000] sm:w-auto"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Nuevo Karateca
        </button>
      </div>

      {error && (
        <div
          className="rounded-md border border-[#CC0000]/50 bg-[#CC0000]/15 px-4 py-3 text-sm text-red-100"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-lg border border-[#C9A84C]/20 bg-[#1a1a1a] p-3 sm:flex-row sm:flex-wrap sm:items-end md:p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-[#C9A84C]/90">
            Filtrar por kyu
          </label>
          <select
            value={filterKyu}
            onChange={(e) => setFilterKyu(e.target.value)}
            className="rounded-md border border-white/15 bg-[#111111] px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
          >
            <option value="all">Todos</option>
            {GRADO_ORDER.map((k) => (
              <option key={k} value={k}>
                {gradoLabel(k)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[#C9A84C]/90">
            Póliza
          </label>
          <select
            value={filterPoliza}
            onChange={(e) => setFilterPoliza(e.target.value)}
            className="rounded-md border border-white/15 bg-[#111111] px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
          >
            <option value="all">Todas</option>
            <option value="activa">Activa</option>
            <option value="vencida">Vencida</option>
            <option value="sin">Sin póliza</option>
          </select>
        </div>
      </div>

      <div className="space-y-3 lg:hidden">
        {loading ? (
          <p className="py-8 text-center text-white/50">Cargando…</p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-white/50">No hay resultados</p>
        ) : (
          filtered.map((row) => {
            const pe = polizaEstado(row.polizas);
            return (
              <div
                key={row.id}
                className="rounded-lg border border-[#C9A84C]/25 bg-[#1a1a1a] p-4 shadow-sm"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={isActiveRow(row) ? 'font-medium text-white' : 'text-white/70'}>
                    {row.user?.nombre}
                  </span>
                  {!isActiveRow(row) && (
                    <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium text-white/70">
                      Inactivo
                    </span>
                  )}
                </div>
                <p className="mb-2 text-sm text-white/65">
                  <span className="text-white/45">Documento: </span>
                  {formatoDocumento(row.user)}
                </p>
                <div className="mb-3">
                  <KyuBadge kyu={gradoValue(row)} />
                </div>
                <div className="mb-3 text-sm">
                  {pe === 'sin' && <span className="text-white/45">Sin póliza</span>}
                  {pe === 'activa' && (
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-300">
                      Activa
                    </span>
                  )}
                  {pe === 'vencida' && (
                    <span className="rounded-full bg-[#CC0000]/25 px-2 py-0.5 text-xs font-medium text-red-200">
                      Vencida
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setEditing(row);
                      setModal('edit');
                    }}
                    className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1 rounded-md border border-[#C9A84C]/40 px-3 text-xs font-medium text-[#C9A84C] hover:bg-[#C9A84C]/10 sm:flex-initial"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActivo(row)}
                    className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1 rounded-md border border-white/20 px-3 text-xs font-medium text-white/70 hover:bg-white/10 sm:flex-initial"
                    title={isActiveRow(row) ? 'Desactivar' : 'Activar'}
                  >
                    {isActiveRow(row) ? (
                      <ToggleLeft className="h-3.5 w-3.5 text-gray-400" />
                    ) : (
                      <ToggleRight className="h-3.5 w-3.5 text-emerald-400" />
                    )}
                    {isActiveRow(row) ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => eliminarKarateca(row)}
                    className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1 rounded-md border border-[#CC0000]/40 px-3 text-xs font-medium text-[#f08e8e] hover:bg-[#CC0000]/20 sm:flex-initial"
                    title="Eliminar"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-[#CC0000]" />
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="hidden overflow-hidden rounded-lg border border-[#C9A84C]/20 bg-[#1a1a1a] lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#C9A84C]/25 bg-[#111111] text-[#C9A84C]">
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Documento</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Teléfono</th>
                <th className="px-4 py-3 font-semibold">Kyu actual</th>
                <th className="px-4 py-3 font-semibold">Pre-examen</th>
                <th className="px-4 py-3 font-semibold">Póliza</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-white/50">
                    Cargando…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-white/50">
                    No hay resultados
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const pe = polizaEstado(row.polizas);
                  return (
                    <tr
                      key={row.id}
                      className={[
                        'hover:bg-white/[0.03]',
                        isActiveRow(row) ? '' : 'bg-white/[0.04] text-white/50',
                      ].join(' ')}
                    >
                      <td className="px-4 py-3 font-medium text-white">
                        <div className="flex items-center gap-2">
                          <span className={isActiveRow(row) ? 'text-white' : 'text-white/70'}>
                            {row.user?.nombre}
                          </span>
                          {!isActiveRow(row) && (
                            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium text-white/70">
                              Inactivo
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white/75 whitespace-nowrap">
                        {formatoDocumento(row.user)}
                      </td>
                      <td className="px-4 py-3 text-white/75">{row.user?.email}</td>
                      <td className="px-4 py-3 text-white/75">
                        {row.user?.telefono || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <KyuBadge kyu={gradoValue(row)} />
                      </td>
                      <td className="px-4 py-3">
                        {row.preExamenAprobado ? (
                          <span className="rounded-full bg-[#C9A84C]/20 px-2 py-0.5 text-xs font-medium text-[#C9A84C]">
                            Sí
                          </span>
                        ) : (
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {pe === 'sin' && (
                          <span className="text-white/45">Sin póliza</span>
                        )}
                        {pe === 'activa' && (
                          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-300">
                            Activa
                          </span>
                        )}
                        {pe === 'vencida' && (
                          <span className="rounded-full bg-[#CC0000]/25 px-2 py-0.5 text-xs font-medium text-red-200">
                            Vencida
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setError(null);
                            setEditing(row);
                            setModal('edit');
                          }}
                          className="inline-flex min-h-[44px] items-center gap-1 rounded-md border border-[#C9A84C]/40 px-2.5 py-1.5 text-xs font-medium text-[#C9A84C] hover:bg-[#C9A84C]/10"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleActivo(row)}
                          className="ml-2 inline-flex min-h-[44px] items-center gap-1 rounded-md border border-white/20 px-2.5 py-1.5 text-xs font-medium text-white/70 hover:bg-white/10"
                          title={isActiveRow(row) ? 'Desactivar' : 'Activar'}
                        >
                          {isActiveRow(row) ? (
                            <ToggleLeft className="h-3.5 w-3.5 text-gray-400" />
                          ) : (
                            <ToggleRight className="h-3.5 w-3.5 text-emerald-400" />
                          )}
                          {isActiveRow(row) ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminarKarateca(row)}
                          className="ml-2 inline-flex min-h-[44px] items-center gap-1 rounded-md border border-[#CC0000]/40 px-2.5 py-1.5 text-xs font-medium text-[#f08e8e] hover:bg-[#CC0000]/20"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-[#CC0000]" />
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo */}
      {modal === 'new' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-0 md:p-4">
          <div
            className="relative h-full max-h-[100dvh] w-full overflow-y-auto rounded-none border-0 border-[#C9A84C]/30 bg-[#1a1a1a] shadow-xl md:h-auto md:max-h-[90vh] md:max-w-md md:rounded-lg md:border"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-nuevo-title"
          >
            <div className="flex items-center justify-between border-b border-[#C9A84C]/20 px-5 py-4">
              <h2 id="modal-nuevo-title" className="text-lg font-semibold text-[#C9A84C]">
                Nuevo Karateca
              </h2>
              <button
                type="button"
                onClick={closeModals}
                className="rounded p-1 text-white/60 hover:bg-white/10 hover:text-white"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              onSubmit={createForm.handleSubmit(onCreate)}
              className="space-y-4 px-5 py-5"
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-white/80">
                  Nombre completo
                </label>
                <input
                  className="w-full rounded-md border border-white/15 bg-[#111111] px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                  {...createForm.register('nombre')}
                />
                {createForm.formState.errors.nombre && (
                  <p className="mt-1 text-xs text-[#CC0000]">
                    {createForm.formState.errors.nombre.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-white/80">
                  Tipo de documento
                </label>
                <select
                  className="w-full rounded-md border border-white/15 bg-[#111111] px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                  {...createForm.register('tipoDocumento')}
                >
                  {TIPOS_DOCUMENTO.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                {createForm.formState.errors.tipoDocumento && (
                  <p className="mt-1 text-xs text-[#CC0000]">
                    {createForm.formState.errors.tipoDocumento.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-white/80">
                  Número de documento
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  className="w-full rounded-md border border-white/15 bg-[#111111] px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                  {...createForm.register('numeroDocumento')}
                />
                {createForm.formState.errors.numeroDocumento && (
                  <p className="mt-1 text-xs text-[#CC0000]">
                    {createForm.formState.errors.numeroDocumento.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-white/80">
                  Email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  className="w-full rounded-md border border-white/15 bg-[#111111] px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                  {...createForm.register('email')}
                />
                {createForm.formState.errors.email && (
                  <p className="mt-1 text-xs text-[#CC0000]">
                    {createForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-white/80">
                  Password temporal
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  className="w-full rounded-md border border-white/15 bg-[#111111] px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                  {...createForm.register('password')}
                />
                {createForm.formState.errors.password && (
                  <p className="mt-1 text-xs text-[#CC0000]">
                    {createForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-white/80">
                  Teléfono (opcional)
                </label>
                <input
                  className="w-full rounded-md border border-white/15 bg-[#111111] px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                  {...createForm.register('telefono')}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-white/80">
                  Fecha de nacimiento (opcional)
                </label>
                <input
                  type="date"
                  className="w-full rounded-md border border-white/15 bg-[#111111] px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                  {...createForm.register('fechaNacimiento')}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-white/80">
                  Inicio de mensualidades
                </label>
                <input
                  type="month"
                  placeholder="Selecciona el mes desde el que debe pagar"
                  className="w-full rounded-md border border-[#C9A84C]/30 bg-[#111111] px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                  {...createForm.register('mesInicioMensualidades')}
                />
                {createForm.formState.errors.mesInicioMensualidades && (
                  <p className="mt-1 text-xs text-[#CC0000]">
                    {createForm.formState.errors.mesInicioMensualidades.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col justify-end gap-2 pt-2 sm:flex-row">
                <button
                  type="button"
                  onClick={closeModals}
                  className="min-h-[44px] w-full rounded-md border border-white/20 px-4 py-2 text-sm text-white/80 hover:bg-white/5 sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createForm.formState.isSubmitting}
                  className="min-h-[44px] w-full rounded-md bg-[#CC0000] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b30000] disabled:opacity-60 sm:w-auto"
                >
                  {createForm.formState.isSubmitting ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {modal === 'edit' && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-0 md:p-4">
          <div
            className="relative h-full max-h-[100dvh] w-full overflow-y-auto rounded-none border-0 border-[#C9A84C]/30 bg-[#1a1a1a] shadow-xl md:h-auto md:max-h-[90vh] md:max-w-lg md:rounded-lg md:border"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-edit-title"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-[#C9A84C]/20 bg-[#1a1a1a] px-5 py-4">
              <h2 id="modal-edit-title" className="text-lg font-semibold text-[#C9A84C]">
                Editar Karateca
              </h2>
              <button
                type="button"
                onClick={closeModals}
                className="rounded p-1 text-white/60 hover:bg-white/10 hover:text-white"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 px-5 py-5">
              <p className="text-xs text-white/50">
                Email:{' '}
                <span className="text-white/80">{editing.user?.email}</span>
              </p>

              <form
                onSubmit={editForm.handleSubmit(onEditSave)}
                className="space-y-4"
              >
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/80">
                    Nombre completo
                  </label>
                  <input
                    className="w-full rounded-md border border-white/15 bg-[#111111] px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                    {...editForm.register('nombre')}
                  />
                  {editForm.formState.errors.nombre && (
                    <p className="mt-1 text-xs text-[#CC0000]">
                      {editForm.formState.errors.nombre.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/80">
                    Tipo de documento
                  </label>
                  <select
                    className="w-full rounded-md border border-white/15 bg-[#111111] px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                    {...editForm.register('tipoDocumento')}
                  >
                    {TIPOS_DOCUMENTO.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  {editForm.formState.errors.tipoDocumento && (
                    <p className="mt-1 text-xs text-[#CC0000]">
                      {editForm.formState.errors.tipoDocumento.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/80">
                    Número de documento
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    className="w-full rounded-md border border-white/15 bg-[#111111] px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                    {...editForm.register('numeroDocumento')}
                  />
                  {editForm.formState.errors.numeroDocumento && (
                    <p className="mt-1 text-xs text-[#CC0000]">
                      {editForm.formState.errors.numeroDocumento.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/80">
                    Teléfono
                  </label>
                  <input
                    className="w-full rounded-md border border-white/15 bg-[#111111] px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                    {...editForm.register('telefono')}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/80">
                    Fecha de nacimiento
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-md border border-white/15 bg-[#111111] px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                    {...editForm.register('fechaNacimiento')}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/80">
                    Inicio de mensualidades
                  </label>
                  <input
                    type="month"
                    placeholder="Selecciona el mes desde el que debe pagar"
                    className="w-full rounded-md border border-[#C9A84C]/30 bg-[#111111] px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                    {...editForm.register('mesInicioMensualidades')}
                  />
                  {editForm.formState.errors.mesInicioMensualidades && (
                    <p className="mt-1 text-xs text-[#CC0000]">
                      {editForm.formState.errors.mesInicioMensualidades.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-col justify-end gap-2 pt-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={closeModals}
                    className="min-h-[44px] w-full rounded-md border border-white/20 px-4 py-2 text-sm text-white/80 hover:bg-white/5 sm:w-auto"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={editForm.formState.isSubmitting}
                    className="min-h-[44px] w-full rounded-md bg-[#CC0000] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b30000] disabled:opacity-60 sm:w-auto"
                  >
                    {editForm.formState.isSubmitting ? 'Guardando…' : 'Guardar datos'}
                  </button>
                </div>
              </form>

              <div className="border-t border-[#C9A84C]/20 pt-5">
                <h3 className="text-sm font-semibold text-[#C9A84C]">Resetear contraseña</h3>
                {resetPwSuccess && (
                  <p className="mt-2 text-sm font-medium text-emerald-400">
                    Contraseña actualizada correctamente
                  </p>
                )}
                {!resetPwOpen ? (
                  <button
                    type="button"
                    onClick={() => {
                      setResetPwError(null);
                      setResetPwSuccess(false);
                      setResetPw('');
                      setResetPwConfirm('');
                      setResetPwOpen(true);
                    }}
                    className="mt-3 rounded-md border border-[#C9A84C]/50 bg-[#111111] px-4 py-2 text-sm font-medium text-[#C9A84C] hover:bg-[#C9A84C]/10"
                  >
                    Resetear contraseña
                  </button>
                ) : (
                  <div className="mt-3 space-y-3 rounded-lg border border-[#C9A84C]/25 bg-[#111111] p-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-white/80">
                        Nueva contraseña temporal
                      </label>
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={resetPw}
                        onChange={(e) => setResetPw(e.target.value)}
                        minLength={6}
                        className="w-full rounded-md border border-white/15 bg-[#111111] px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-white/80">
                        Confirmar contraseña
                      </label>
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={resetPwConfirm}
                        onChange={(e) => setResetPwConfirm(e.target.value)}
                        minLength={6}
                        className="w-full rounded-md border border-white/15 bg-[#111111] px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                      />
                    </div>
                    {resetPwError && (
                      <p className="text-sm text-[#CC0000]" role="alert">
                        {resetPwError}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
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
                          const uid = editing?.user?.id;
                          if (uid == null) {
                            setResetPwError('Usuario no disponible');
                            return;
                          }
                          setResetPwSaving(true);
                          try {
                            await api.patch(`/auth/reset-password/${uid}`, {
                              passwordNueva: resetPw,
                            });
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
                        className="rounded-md bg-[#CC0000] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b30000] disabled:opacity-60"
                      >
                        {resetPwSaving ? 'Guardando…' : 'Confirmar reset'}
                      </button>
                      <button
                        type="button"
                        disabled={resetPwSaving}
                        onClick={() => {
                          setResetPwOpen(false);
                          setResetPw('');
                          setResetPwConfirm('');
                          setResetPwError(null);
                        }}
                        className="rounded-md border border-white/20 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-[#C9A84C]/20 pt-5">
                <h3 className="text-sm font-semibold text-[#C9A84C]">
                  Ascender grado
                </h3>
                <p className="mt-1 text-xs text-white/50">
                  Grado actual:{' '}
                  <KyuBadge kyu={gradoValue(editing)} />
                </p>
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <div className="min-w-[180px] flex-1">
                    <label className="mb-1 block text-xs text-white/60">
                      Grado
                    </label>
                    <select
                      value={ascensoTarget}
                      onChange={(e) => setAscensoTarget(e.target.value)}
                      className="w-full rounded-md border border-white/15 bg-[#111111] px-3 py-2 text-sm text-white focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                    >
                      {GRADO_ORDER.map((k) => (
                        <option key={k} value={k}>
                          {gradoLabel(k)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    disabled={savingAscenso || !ascensoTarget}
                    onClick={confirmarAscenso}
                    className="rounded-md border border-[#C9A84C]/50 bg-[#111111] px-4 py-2 text-sm font-medium text-[#C9A84C] hover:bg-[#C9A84C]/10 disabled:opacity-40"
                  >
                    {savingAscenso ? '…' : 'Confirmar ascenso'}
                  </button>
                </div>
              </div>

              <div className="border-t border-[#C9A84C]/20 pt-5">
                <h3 className="text-sm font-semibold text-[#C9A84C]">
                  Pre-examen
                </h3>
                <label className="mt-3 flex cursor-pointer items-center justify-between gap-4 rounded-md border border-white/10 bg-[#111111] px-4 py-3">
                  <span className="text-sm text-white/85">
                    {editing.preExamenAprobado
                      ? 'Autorizado para examen'
                      : 'No autorizado'}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={editing.preExamenAprobado}
                    disabled={togglingPre}
                    onClick={() => togglePreExamen(!editing.preExamenAprobado)}
                    className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                      editing.preExamenAprobado
                        ? 'bg-[#C9A84C]'
                        : 'bg-white/20'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white transition-transform ${
                        editing.preExamenAprobado ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
