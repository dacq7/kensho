import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Navigate } from 'react-router-dom';
import api from '../lib/api';
import useAuthStore from '../store/authStore';

const loginSchema = z.object({
  email: z.string().email('Introduce un email válido'),
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
    defaultValues: { email: '', password: '' },
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
        email: values.email,
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#111111]">
      <div className="w-full max-w-md rounded-lg border border-[#C9A84C]/40 bg-[#1a1a1a] shadow-xl p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-[#C9A84C]">
            Budokan
          </h1>
          <p className="mt-1 text-sm text-white/70">Acceso al dojo</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-white/90 mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-md border border-white/15 bg-[#111111] px-3 py-2.5 text-white placeholder:text-white/35 focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
              placeholder="tu@email.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-[#CC0000]">{errors.email.message}</p>
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
            className="w-full rounded-md bg-[#CC0000] py-2.5 text-sm font-semibold text-white transition hover:bg-[#b30000] disabled:opacity-60 border border-[#C9A84C]/30"
          >
            {isSubmitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
