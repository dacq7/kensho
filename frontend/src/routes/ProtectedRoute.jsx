import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function ProtectedRoute({ requiredRole }) {
  const { isAuthenticated, user, hydrated } = useAuthStore();

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111111] text-[#C9A84C]">
        Cargando…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.rol !== requiredRole) {
    const fallback =
      user?.rol === 'SENSEI' ? '/sensei/dashboard' : '/karateca/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
