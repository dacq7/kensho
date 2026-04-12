import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Navigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import api from '../lib/api';
import useAuthStore from '../store/authStore';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const loginSchema = z.object({
  numeroDocumento: z
    .string()
    .min(1, 'El número de documento es obligatorio')
    .regex(/^\d+$/, 'Solo números'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const { isAuthenticated, user, hydrated } = useAuthStore();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { numeroDocumento: '', password: '' },
  });

  useEffect(() => {
    document.title = 'Iniciar sesión — Budokan';
  }, []);

  if (hydrated && isAuthenticated && user) {
    const to = user.rol === 'SENSEI' ? '/sensei/dashboard' : '/karateca/dashboard';
    return <Navigate to={to} replace />;
  }

  const onSubmit = async (values) => {
    try {
      const { data } = await api.post('/auth/login', {
        numeroDocumento: values.numeroDocumento.trim(),
        password: values.password,
      });
      login(data.user, data.token);
      const target =
        data.user.rol === 'SENSEI' ? '/sensei/dashboard' : '/karateca/dashboard';
      navigate(target, { replace: true });
    } catch (err) {
      if (err.response?.status === 401) {
        setError('root', {
          type: 'manual',
          message: 'Credenciales incorrectas',
        });
        return;
      }
      setError('root', {
        type: 'manual',
        message: 'No se pudo iniciar sesión. Inténtalo de nuevo.',
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-dojo-negro lg:grid lg:grid-cols-2">
      {/* ── Left panel (desktop only) ── */}
      <div
        className="relative hidden lg:flex lg:flex-col lg:items-center lg:justify-center lg:overflow-hidden"
        style={{
          background: '#0a0a0a',
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(201,168,76,0.02) 0px, rgba(201,168,76,0.02) 1px, transparent 1px, transparent 40px)',
        }}
      >
        {/* Kanji watermark */}
        <span
          className="pointer-events-none absolute select-none font-black leading-none text-dojo-dorado"
          style={{ fontSize: '8rem', opacity: 0.15, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
          aria-hidden
        >
          空手
        </span>

        {/* Dojo emblem */}
        <div className="relative z-10 flex flex-col items-center gap-5">
          <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
            <div
              className="absolute border-[3px] border-dojo-dorado"
              style={{ width: 80, height: 80, transform: 'rotate(45deg)' }}
            />
            <span className="relative z-10 text-[2rem] font-black leading-none text-dojo-dorado">
              B
            </span>
          </div>

          <div className="flex flex-col items-center gap-3">
            <p className="font-bold tracking-[0.3em] text-dojo-dorado" style={{ fontSize: '1.1rem' }}>
              BUDOKAN SKIF
            </p>
            <p className="text-sm text-white/40">Dojo · El Carmen de Viboral</p>
            <div className="h-px w-[120px] bg-dojo-dorado/20" />
            <p className="max-w-[240px] text-center text-sm italic text-white/35">
              "El camino del karate es una búsqueda constante de perfección"
            </p>
          </div>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex min-h-screen flex-col items-center justify-center bg-dojo-negro px-4 py-10 lg:bg-dojo-surface lg:px-8">
        <div className="w-full max-w-[380px]">
          {/* Breadcrumb label */}
          <p className="mb-5 text-xs tracking-widest text-dojo-dorado/60 uppercase">
            BUDOKAN SKIF
          </p>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-white">Bienvenido</h1>
          <p className="mt-1 text-sm text-white/50">Accede a tu dojo</p>

          {/* Divider */}
          <div className="my-6 h-px bg-dojo-dorado/10" />

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              id="numeroDocumento"
              label="Número de documento"
              type="text"
              inputMode="numeric"
              autoComplete="username"
              placeholder="Solo números"
              error={errors.numeroDocumento?.message}
              {...register('numeroDocumento')}
            />

            <Input
              id="password"
              label="Contraseña"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            {errors.root && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-r-md border-l-4 border-dojo-rojo bg-dojo-rojo/10 px-4 py-3"
              >
                <p className="text-sm text-red-300">{errors.root.message}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Entrando…' : 'Entrar al dojo'}
              {!isSubmitting && <ChevronRight className="h-4 w-4" aria-hidden />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
