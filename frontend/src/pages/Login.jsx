import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Navigate } from 'react-router-dom';
import api from '../lib/api';
import useAuthStore from '../store/authStore';

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
    <div className="flex min-h-screen flex-col items-stretch justify-center bg-[#111111] px-4 py-6 md:items-center md:px-4 md:py-8">
      <div className="w-full rounded-lg border border-[#C9A84C]/40 bg-[#1a1a1a] p-4 shadow-xl md:mx-auto md:max-w-md md:p-8">
        <div className="mb-6 text-center md:mb-8">
          <h1 className="text-lg font-semibold tracking-tight text-[#C9A84C] md:text-2xl">
            Budokan
          </h1>
          <p className="mt-1 text-sm text-white/70">Acceso al dojo</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label
              htmlFor="numeroDocumento"
              className="block text-sm font-medium text-white/90 mb-1.5"
            >
              Número de documento
            </label>
            <input
              id="numeroDocumento"
              type="text"
              inputMode="numeric"
              autoComplete="username"
              className="w-full rounded-md border border-white/15 bg-[#111111] px-3 py-2.5 text-white placeholder:text-white/35 focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
              placeholder="Solo números"
              {...register('numeroDocumento')}
            />
            {errors.numeroDocumento && (
              <p className="mt-1 text-sm text-[#CC0000]">{errors.numeroDocumento.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-white/90 mb-1.5"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-md border border-white/15 bg-[#111111] px-3 py-2.5 text-white placeholder:text-white/35 focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-[#CC0000]">{errors.password.message}</p>
            )}
          </div>

          {errors.root && (
            <p className="text-sm text-[#CC0000] text-center" role="alert">
              {errors.root.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-[44px] w-full rounded-md border border-[#C9A84C]/30 bg-[#CC0000] py-2.5 text-sm font-semibold text-white transition hover:bg-[#b30000] disabled:opacity-60 md:w-auto md:px-8"
          >
            {isSubmitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
