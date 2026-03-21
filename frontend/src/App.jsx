import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import ProtectedRoute from './routes/ProtectedRoute';
import SenseiLayout from './components/layout/SenseiLayout';
import KaratecaLayout from './components/layout/KaratecaLayout';
import Login from './pages/Login';

import SenseiDashboard from './pages/sensei/Dashboard';
import SenseiKaratecas from './pages/sensei/Karatecas';
import SenseiAsistencia from './pages/sensei/Asistencia';
import SenseiMensualidades from './pages/sensei/Mensualidades';
import SenseiPolizas from './pages/sensei/Polizas';
import SenseiInventario from './pages/sensei/Inventario';

import KaratecaDashboard from './pages/karateca/Dashboard';
import KaratecaAsistencia from './pages/karateca/Asistencia';
import KaratecaMensualidades from './pages/karateca/Mensualidades';
import KaratecaPoliza from './pages/karateca/Poliza';
import KaratecaTecnico from './pages/karateca/Tecnico';

export default function App() {
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/sensei" element={<ProtectedRoute requiredRole="SENSEI" />}>
          <Route element={<SenseiLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<SenseiDashboard />} />
            <Route path="karatecas" element={<SenseiKaratecas />} />
            <Route path="asistencia" element={<SenseiAsistencia />} />
            <Route path="mensualidades" element={<SenseiMensualidades />} />
            <Route path="polizas" element={<SenseiPolizas />} />
            <Route path="inventario" element={<SenseiInventario />} />
          </Route>
        </Route>

        <Route path="/karateca" element={<ProtectedRoute requiredRole="KARATECA" />}>
          <Route element={<KaratecaLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<KaratecaDashboard />} />
            <Route path="asistencia" element={<KaratecaAsistencia />} />
            <Route path="mensualidades" element={<KaratecaMensualidades />} />
            <Route path="poliza" element={<KaratecaPoliza />} />
            <Route path="tecnico" element={<KaratecaTecnico />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
