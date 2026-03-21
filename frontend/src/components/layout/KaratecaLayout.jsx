import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { User, CalendarCheck, DollarSign, Shield, BookOpen, LogOut } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const nav = [
  { to: '/karateca/dashboard', label: 'Mi Perfil', icon: User },
  { to: '/karateca/asistencia', label: 'Asistencia', icon: CalendarCheck },
  { to: '/karateca/mensualidades', label: 'Mensualidades', icon: DollarSign },
  { to: '/karateca/poliza', label: 'Mi Póliza', icon: Shield },
  { to: '/karateca/tecnico', label: 'Contenido Técnico', icon: BookOpen },
];

function linkClass({ isActive }) {
  return [
    'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-[#CC0000]/30 text-[#C9A84C] border border-[#C9A84C]/40'
      : 'text-white/75 hover:bg-white/5 hover:text-[#C9A84C]',
  ].join(' ');
}

export default function KaratecaLayout() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#111111] text-white">
      <header className="sticky top-0 z-40 border-b border-[#C9A84C]/25 bg-[#0a0a0a]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A84C]">
              BUDOKAN SKIF
            </p>
            <p className="text-sm text-white/60">El Carmen de Viboral</p>
            <p className="mt-1 text-base font-medium text-white">
              {user?.nombre ?? 'Karateca'}
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-1 md:justify-end">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={linkClass} end={to.endsWith('dashboard')}>
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white/75 transition-colors hover:bg-[#CC0000]/20 hover:text-white"
            >
              <LogOut className="h-4 w-4 text-[#CC0000]" aria-hidden />
              Salir
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}
