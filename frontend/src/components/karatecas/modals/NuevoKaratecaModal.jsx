import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../../lib/api';
import { Button, Input, Modal } from '../../ui';

const TIPOS_DOCUMENTO = [
  { value: 'CC', label: 'CC — Cédula de Ciudadanía' },
  { value: 'TI', label: 'TI — Tarjeta de Identidad' },
  { value: 'CE', label: 'CE — Cédula de Extranjería' },
  { value: 'PA', label: 'PA — Pasaporte' },
  { value: 'RC', label: 'RC — Registro Civil' },
  { value: 'PPT', label: 'PPT — Permiso por Protección Temporal' },
];

const createSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  email: z.string().email('Email no válido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
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

export default function NuevoKaratecaModal({ open, onClose, onSuccess }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError: setFieldError,
  } = useForm({
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

  const handleClose = () => {
    reset();
    onClose();
  };

  const onCreate = async (values) => {
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
      reset();
      onClose();
      onSuccess();
    } catch (e) {
      setFieldError('root', {
        message: e.response?.data?.message || 'No se pudo crear el karateca',
      });
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Nuevo Karateca">
      <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
        {errors.root && (
          <div
            className="rounded-md border border-dojo-rojo/50 bg-dojo-rojo/20 px-3 py-2 text-sm text-red-200"
            role="alert"
          >
            {errors.root.message}
          </div>
        )}

        <Input
          id="nuevo-nombre"
          label="Nombre completo"
          error={errors.nombre?.message}
          {...register('nombre')}
        />

        <div className="flex flex-col gap-1">
          <label htmlFor="nuevo-tipoDocumento" className="text-sm font-medium text-white/80">
            Tipo de documento
          </label>
          <select
            id="nuevo-tipoDocumento"
            className="w-full rounded-md border border-white/20 bg-dojo-surface px-3 py-2 text-sm text-white outline-none focus:border-dojo-dorado focus:ring-2 focus:ring-dojo-dorado/30"
            {...register('tipoDocumento')}
          >
            {TIPOS_DOCUMENTO.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errors.tipoDocumento && (
            <p className="text-xs text-dojo-rojo">{errors.tipoDocumento.message}</p>
          )}
        </div>

        <Input
          id="nuevo-numeroDocumento"
          label="Número de documento"
          error={errors.numeroDocumento?.message}
          inputMode="numeric"
          autoComplete="off"
          {...register('numeroDocumento')}
        />

        <Input
          id="nuevo-email"
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          id="nuevo-password"
          label="Password temporal"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          id="nuevo-telefono"
          label="Teléfono (opcional)"
          {...register('telefono')}
        />

        <Input
          id="nuevo-fechaNacimiento"
          label="Fecha de nacimiento (opcional)"
          type="date"
          {...register('fechaNacimiento')}
        />

        <Input
          id="nuevo-mesInicio"
          label="Inicio de mensualidades"
          type="month"
          placeholder="Selecciona el mes desde el que debe pagar"
          error={errors.mesInicioMensualidades?.message}
          {...register('mesInicioMensualidades')}
        />

        <div className="flex flex-col justify-end gap-2 pt-2 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
