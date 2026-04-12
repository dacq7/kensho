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

function getInitials(nombre) {
  if (!nombre) return 'U';
  const words = nombre.trim().split(/\s+/);
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function linkClass({ isActive }) {
  return [
    'inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors md:justify-start',
    isActive
      ? 'bg-dojo-rojo/25 text-dojo-dorado border border-dojo-dorado/40'
      : 'text-white/75 hover:bg-white/5 hover:text-dojo-dorado',
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
    <div className="min-h-screen flex flex-col bg-dojo-negro text-white">
      <header className="sticky top-0 z-40 border-b border-dojo-dorado/20 bg-dojo-subtle backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4 px-3 py-2 md:px-4 md:py-3">

          {/* ── Left: diamond emblem + brand ── */}
          <div className="flex shrink-0 items-center gap-3">
            <div
              className="relative flex shrink-0 items-center justify-center"
              style={{ width: 32, height: 32 }}
            >
              <div
                className="absolute border-2 border-dojo-dorado"
                style={{ width: 32, height: 32, transform: 'rotate(45deg)' }}
              />
              <span className="relative z-10 text-sm font-black leading-none text-dojo-dorado">
                B
              </span>
            </div>
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-dojo-dorado">BUDOKAN SKIF</p>
              <p className="text-[10px] uppercase tracking-wider text-white/40">El Carmen de Viboral</p>
            </div>
          </div>

          {/* ── Right: nav + avatar + logout ── */}
          <div className="flex min-w-0 items-center gap-1">
            <nav className="-mx-1 flex items-center gap-0.5 overflow-x-auto md:mx-0 md:overflow-visible">
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
            </nav>

            {/* Avatar — desktop only */}
            {user && (
              <div
                className="ml-2 hidden shrink-0 items-center justify-center rounded-full border border-dojo-rojo/50 bg-dojo-rojo/30 text-xs font-bold text-dojo-dorado md:flex"
                style={{ width: 32, height: 32 }}
              >
                {getInitials(user.nombre)}
              </div>
            )}

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white/75 transition-colors hover:bg-dojo-rojo/10 hover:text-dojo-rojo md:justify-start"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-4 w-4 text-dojo-rojo" aria-hidden />
              <span className="hidden md:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Decorative line — mobile only */}
      <div className="h-px w-full bg-dojo-dorado/10 md:hidden" />

      <main className="w-full flex-1">
        <Outlet />
      </main>
    </div>
  );
}
