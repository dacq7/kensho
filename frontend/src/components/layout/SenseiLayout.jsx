import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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

function linkClass({ isActive }) {
  return [
    'flex min-h-[44px] items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
    isActive
      ? 'bg-[#CC0000]/25 text-[#C9A84C] border border-[#C9A84C]/40'
      : 'text-white/80 hover:bg-white/5 hover:text-[#C9A84C]',
  ].join(' ');
}

export default function SenseiLayout() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const closeDrawer = () => setMobileOpen(false);

  return (
    <div className="min-h-screen flex bg-[#111111] text-white">
      {mobileOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-30 bg-black/70 lg:hidden"
          onClick={closeDrawer}
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex min-h-0 w-60 flex-col border-r border-[#C9A84C]/25 bg-[#0a0a0a]',
          'transition-transform duration-200 ease-out',
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        <div className="flex shrink-0 items-start justify-between gap-2 border-b border-[#C9A84C]/20 px-4 py-4 md:py-6">
          <div>
            <p className="text-base font-bold tracking-widest text-[#C9A84C] md:text-lg">
              BUDOKAN SKIF
            </p>
            <p className="mt-1 text-xs text-white/60">El Carmen de Viboral</p>
          </div>
          <button
            type="button"
            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-md text-white/80 hover:bg-white/10 lg:hidden"
            onClick={closeDrawer}
            aria-label="Cerrar menú"
          >
            <X className="h-6 w-6 text-[#C9A84C]" aria-hidden />
          </button>
        </div>

        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 py-4">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={linkClass}
              end={to.endsWith('dashboard')}
              onClick={closeDrawer}
            >
              <Icon className="h-5 w-5 shrink-0 text-[#C9A84C]/90" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto shrink-0 border-t border-[#C9A84C]/20 bg-[#0a0a0a] p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-[44px] w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-[#CC0000]/20 hover:text-white"
          >
            <LogOut className="h-5 w-5 shrink-0 text-[#CC0000]" aria-hidden />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="min-h-screen w-full flex-1 bg-[#111111] lg:ml-60">
        <button
          type="button"
          className="fixed left-3 top-3 z-50 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-[#C9A84C]/40 bg-[#0a0a0a] text-[#C9A84C] shadow-md lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
        >
          <Menu className="h-6 w-6" aria-hidden />
        </button>
        <div className="min-h-full p-3 pt-14 md:p-6 md:pt-16 lg:p-8 lg:pt-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
