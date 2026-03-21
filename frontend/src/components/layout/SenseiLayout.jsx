import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  DollarSign,
  Shield,
  Package,
  LogOut,
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
    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
    isActive
      ? 'bg-[#CC0000]/25 text-[#C9A84C] border border-[#C9A84C]/40'
      : 'text-white/80 hover:bg-white/5 hover:text-[#C9A84C]',
  ].join(' ');
}

export default function SenseiLayout() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-[#111111] text-white">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-[#C9A84C]/25 bg-[#0a0a0a]">
        <div className="border-b border-[#C9A84C]/20 px-4 py-6">
          <p className="text-lg font-bold tracking-widest text-[#C9A84C]">
            BUDOKAN SKIF
          </p>
          <p className="mt-1 text-xs text-white/60">El Carmen de Viboral</p>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-4">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClass} end={to.endsWith('dashboard')}>
              <Icon className="h-5 w-5 shrink-0 text-[#C9A84C]/90" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-[#C9A84C]/20 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-[#CC0000]/20 hover:text-white"
          >
            <LogOut className="h-5 w-5 shrink-0 text-[#CC0000]" aria-hidden />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="ml-60 min-h-screen flex-1 bg-[#111111]">
        <div className="min-h-full p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
