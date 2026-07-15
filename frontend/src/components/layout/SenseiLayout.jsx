import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  DollarSign,
  Shield,
  Package,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

const nav = [
  { to: '/sensei/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/sensei/karatecas', label: 'Karatecas', icon: Users },
  { to: '/sensei/asistencia', label: 'Asistencia', icon: CalendarCheck },
  { to: '/sensei/mensualidades', label: 'Mensualidades', icon: DollarSign },
  { to: '/sensei/polizas', label: 'Pólizas', icon: Shield },
  { to: '/sensei/inventario', label: 'Inventario', icon: Package },
];

function getInitials(nombre) {
  if (!nombre) return 'U';
  const words = nombre.trim().split(/\s+/);
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export default function SenseiLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const closeDrawer = () => setMobileOpen(false);

  const currentPage =
    nav.find(({ to }) =>
      to.endsWith('dashboard')
        ? location.pathname === to
        : location.pathname.startsWith(to)
    )?.label ?? 'Kensho';

  return (
    <div className="min-h-screen flex bg-dojo-negro text-white">
      {/* Backdrop */}
      {mobileOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-30 bg-black/70 lg:hidden"
          onClick={closeDrawer}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex min-h-0 w-64 flex-col border-r border-dojo-dorado/20 bg-dojo-subtle',
          'transition-transform duration-200 ease-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-5">
          {/* Diamond emblem */}
          <div className="flex items-center gap-3">
            <div className="relative flex shrink-0 items-center justify-center" style={{ width: 40, height: 40 }}>
              <div
                className="absolute border-2 border-dojo-dorado"
                style={{ width: 40, height: 40, transform: 'rotate(45deg)' }}
              />
              <span className="relative z-10 text-lg font-black leading-none text-dojo-dorado">
                K
              </span>
            </div>

            <p className="text-sm font-bold tracking-[0.2em] text-dojo-dorado">
              KENSHO
            </p>
          </div>

          {/* Close button (mobile) */}
          <button
            type="button"
            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-md text-white/80 hover:bg-white/10 lg:hidden"
            onClick={closeDrawer}
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5 text-dojo-dorado" aria-hidden />
          </button>
        </div>

        {/* Header separator */}
        <div className="mx-4 h-px bg-dojo-dorado/20" />

        {/* Nav */}
        <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-4">
          <p className="mb-2 px-3 text-[10px] tracking-[0.2em] text-white/25 uppercase">
            NAVEGACIÓN
          </p>

          <div className="space-y-0.5">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to.endsWith('dashboard')}
                onClick={closeDrawer}
                className="group relative block overflow-hidden rounded-md"
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-dojo-dorado" />
                    )}
                    <span
                      className={[
                        'flex min-h-[44px] items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-dojo-rojo/20 text-dojo-dorado'
                          : 'text-white/70 hover:bg-white/5 hover:text-dojo-dorado',
                      ].join(' ')}
                    >
                      <Icon
                        className={[
                          'h-5 w-5 shrink-0 transition-colors',
                          isActive ? 'text-dojo-dorado' : 'text-dojo-dorado/60',
                        ].join(' ')}
                        aria-hidden
                      />
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* ── User section ── */}
        <div className="shrink-0 border-t border-dojo-dorado/15 bg-dojo-subtle p-3">
          {user && (
            <div className="mb-2 flex items-center gap-3 px-1 py-1">
              {/* Avatar */}
              <div
                className="flex shrink-0 items-center justify-center rounded-full border border-dojo-rojo/50 bg-dojo-rojo/30 text-xs font-bold text-dojo-dorado"
                style={{ width: 36, height: 36 }}
              >
                {getInitials(user.nombre)}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white/90">
                  {user.nombre}
                </p>
                <p className="text-xs text-white/40">
                  {user.rol === 'SENSEI' ? 'Sensei' : 'Karateca'}
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-[40px] w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white/50 transition-colors hover:bg-dojo-rojo/10 hover:text-dojo-rojo"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex min-h-screen w-full flex-1 flex-col lg:ml-64">
        {/* Top bar */}
        <header className="fixed left-0 right-0 top-0 z-20 flex h-14 items-center justify-between border-b border-dojo-dorado/10 bg-dojo-subtle/80 px-4 backdrop-blur-sm lg:left-64">
          {/* Hamburger (mobile) */}
          <button
            type="button"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-dojo-dorado/30 text-dojo-dorado transition-colors hover:bg-dojo-dorado/10 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>

          {/* Spacer on desktop */}
          <div className="hidden lg:block" />

          {/* Current page label */}
          <p className="text-sm font-medium tracking-wide text-white/50">
            {currentPage}
          </p>
        </header>

        {/* Content */}
        <main className="min-h-full flex-1 bg-dojo-negro p-3 pt-[calc(3.5rem+0.75rem)] md:p-6 md:pt-[calc(3.5rem+1.5rem)] lg:p-8 lg:pt-[calc(3.5rem+2rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
