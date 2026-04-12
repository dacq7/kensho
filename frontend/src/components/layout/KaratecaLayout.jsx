import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { User, CalendarCheck, DollarSign, Shield, BookOpen, LogOut, Menu, X } from 'lucide-react';
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

function drawerLinkClass({ isActive }) {
  return [
    'group relative flex min-h-[44px] w-full items-center gap-3 overflow-hidden rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
    isActive
      ? 'bg-dojo-rojo/20 text-dojo-dorado'
      : 'text-white/70 hover:bg-white/5 hover:text-dojo-dorado',
  ].join(' ');
}

export default function KaratecaLayout() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const closeDrawer = () => setMobileOpen(false);

  return (
    <div className="min-h-screen flex flex-col bg-dojo-negro text-white">

      {/* ── Mobile backdrop ── */}
      {mobileOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-30 bg-black/70 lg:hidden"
          onClick={closeDrawer}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-dojo-dorado/25 bg-dojo-subtle lg:hidden',
          'transition-transform duration-200 ease-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Drawer header */}
        <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-5">
          <div className="flex items-center gap-3">
            <div
              className="relative flex shrink-0 items-center justify-center"
              style={{ width: 32, height: 32 }}
            >
              <div
                className="absolute border-2 border-dojo-dorado"
                style={{ width: 32, height: 32, transform: 'rotate(45deg)' }}
              />
              <span className="relative z-10 text-sm font-black leading-none text-dojo-dorado">B</span>
            </div>
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-dojo-dorado">BUDOKAN SKIF</p>
              <p className="text-[10px] uppercase tracking-wider text-white/40">El Carmen de Viboral</p>
            </div>
          </div>
          <button
            type="button"
            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-md text-white/80 hover:bg-white/10"
            onClick={closeDrawer}
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5 text-dojo-dorado" aria-hidden />
          </button>
        </div>

        {/* Drawer separator */}
        <div className="mx-4 h-px bg-dojo-dorado/20" />

        {/* Drawer nav */}
        <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-4">
          <p className="mb-2 px-3 text-[10px] uppercase tracking-[0.2em] text-white/25">
            NAVEGACIÓN
          </p>
          <div className="space-y-0.5">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to.endsWith('dashboard')}
                onClick={closeDrawer}
                className={drawerLinkClass}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-dojo-dorado" />
                    )}
                    <Icon
                      className={[
                        'h-5 w-5 shrink-0 transition-colors',
                        isActive ? 'text-dojo-dorado' : 'text-dojo-dorado/60',
                      ].join(' ')}
                      aria-hidden
                    />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Drawer bottom: user + logout */}
        <div className="shrink-0 border-t border-dojo-dorado/15 bg-dojo-subtle p-3">
          {user && (
            <div className="mb-2 flex items-center gap-3 px-1 py-1">
              <div
                className="flex shrink-0 items-center justify-center rounded-full border border-dojo-rojo/50 bg-dojo-rojo/30 text-xs font-bold text-dojo-dorado"
                style={{ width: 36, height: 36 }}
              >
                {getInitials(user.nombre)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white/90">{user.nombre}</p>
                <p className="text-xs text-white/40">Karateca</p>
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

      {/* ── Mobile top bar ── */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-dojo-dorado/20 bg-dojo-subtle px-3 backdrop-blur-sm lg:hidden">
        <button
          type="button"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-dojo-dorado/30 text-dojo-dorado transition-colors hover:bg-dojo-dorado/10"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>

        <span className="text-xs font-bold tracking-[0.2em] text-dojo-dorado">BUDOKAN SKIF</span>

        {user ? (
          <div
            className="flex shrink-0 items-center justify-center rounded-full border border-dojo-rojo/50 bg-dojo-rojo/30 text-xs font-bold text-dojo-dorado"
            style={{ width: 32, height: 32 }}
          >
            {getInitials(user.nombre)}
          </div>
        ) : (
          <div style={{ width: 32, height: 32 }} />
        )}
      </header>

      {/* ── Desktop top navbar ── */}
      <header className="sticky top-0 z-40 hidden border-b border-dojo-dorado/20 bg-dojo-subtle backdrop-blur-sm lg:block">
        <div className="flex items-center justify-between gap-4 px-4 py-3">

          {/* Left: diamond emblem + brand */}
          <div className="flex shrink-0 items-center gap-3">
            <div
              className="relative flex shrink-0 items-center justify-center"
              style={{ width: 32, height: 32 }}
            >
              <div
                className="absolute border-2 border-dojo-dorado"
                style={{ width: 32, height: 32, transform: 'rotate(45deg)' }}
              />
              <span className="relative z-10 text-sm font-black leading-none text-dojo-dorado">B</span>
            </div>
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-dojo-dorado">BUDOKAN SKIF</p>
              <p className="text-[10px] uppercase tracking-wider text-white/40">El Carmen de Viboral</p>
            </div>
          </div>

          {/* Right: nav + avatar + logout */}
          <div className="flex items-center gap-1">
            <nav className="flex items-center gap-0.5">
              {nav.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={linkClass}
                  end={to.endsWith('dashboard')}
                  aria-label={label}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>

            {user && (
              <div
                className="ml-2 flex shrink-0 items-center justify-center rounded-full border border-dojo-rojo/50 bg-dojo-rojo/30 text-xs font-bold text-dojo-dorado"
                style={{ width: 32, height: 32 }}
              >
                {getInitials(user.nombre)}
              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white/75 transition-colors hover:bg-dojo-rojo/10 hover:text-dojo-rojo"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-4 w-4 text-dojo-rojo" aria-hidden />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="w-full flex-1 pt-14 lg:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
