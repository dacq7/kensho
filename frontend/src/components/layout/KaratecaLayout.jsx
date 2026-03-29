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
    'inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors md:justify-start',
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
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-3 py-2 md:flex-row md:items-center md:justify-between md:gap-4 md:px-4 md:py-3 lg:px-4 lg:py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C9A84C] md:text-xs">
              BUDOKAN SKIF
            </p>
            <p className="text-xs text-white/60 md:text-sm">El Carmen de Viboral</p>
            <p className="mt-0.5 truncate text-sm font-medium text-white md:mt-1 md:text-base">
              {user?.nombre ?? 'Karateca'}
            </p>
          </div>

          <nav className="-mx-1 flex max-w-full items-center gap-1 overflow-x-auto pb-1 md:mx-0 md:flex-wrap md:justify-end md:overflow-visible md:pb-0">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={linkClass}
                end={to.endsWith('dashboard')}
                aria-label={label}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="hidden md:inline">{label}</span>
              </NavLink>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white/75 transition-colors hover:bg-[#CC0000]/20 hover:text-white md:justify-start"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-4 w-4 text-[#CC0000]" aria-hidden />
              <span className="hidden md:inline">Salir</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-4 md:px-6 md:py-6 lg:px-6 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
