import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';
import { GRADO_INFO, GRADO_ORDER } from '../../lib/kyuUtils';
import { Button } from '../../components/ui';
import KaratecasTable from '../../components/karatecas/KaratecasTable';
import KaratecasCards from '../../components/karatecas/KaratecasCards';
import NuevoKaratecaModal from '../../components/karatecas/modals/NuevoKaratecaModal';
import EditarKaratecaModal from '../../components/karatecas/modals/EditarKaratecaModal';

function gradoValue(row) {
  if (typeof row.dan === 'number' && row.dan >= 1) return `${row.dan}dan`;
  return row.kyuActual;
}

function gradoLabel(grado) {
  return GRADO_INFO[grado]?.label || grado;
}

function isActiveRow(row) {
  return row.activo !== false;
}

function polizaEstado(polizas) {
  if (!polizas?.length) return 'sin';
  const latest = [...polizas].sort(
    (a, b) => new Date(b.fechaInicio) - new Date(a.fechaInicio),
  )[0];
  const v = new Date(latest.fechaVencimiento);
  const end = new Date(v.getFullYear(), v.getMonth(), v.getDate());
  const t = new Date();
  const today = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  return end >= today ? 'activa' : 'vencida';
}

export default function SenseiKaratecasPage() {
  const token = useAuthStore((s) => s.token);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterKyu, setFilterKyu] = useState('all');
  const [filterPoliza, setFilterPoliza] = useState('all');
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const { data } = await api.get('/karatecas?incluirInactivos=true');
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo cargar la lista');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, token]);

  const filtered = useMemo(() =>
    rows.filter((r) => {
      if (filterKyu !== 'all' && gradoValue(r) !== filterKyu) return false;
      const pe = polizaEstado(r.polizas);
      if (filterPoliza === 'all') return true;
      if (filterPoliza === 'sin') return pe === 'sin';
      return pe === filterPoliza;
    }),
  [rows, filterKyu, filterPoliza]);

  const closeModals = () => { setModal(null); setEditing(null); };

  const toggleActivo = async (row) => {
    setError(null);
    try {
      await api.patch(`/karatecas/${row.id}/activo`, { activo: !isActiveRow(row) });
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo cambiar el estado');
    }
  };

  const eliminarKarateca = async (row) => {
    if (!window.confirm('¿Estás seguro? Esta acción no se puede deshacer')) return;
    setError(null);
    try {
      await api.delete(`/karatecas/${row.id}`);
      if (editing?.id === row.id) closeModals();
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo eliminar el karateca');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-dojo-dorado md:text-xl lg:text-2xl">
            Karatecas
          </h1>
          <p className="mt-1 text-sm text-white/55">Gestión de alumnos del dojo</p>
        </div>
        <Button
          variant="primary"
          onClick={() => { setError(null); setModal('new'); }}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Nuevo Karateca
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-dojo-rojo/50 bg-dojo-rojo/20 px-4 py-3 text-sm text-red-200" role="alert">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-lg border border-dojo-dorado/20 bg-dojo-surface p-3 sm:flex-row sm:flex-wrap sm:items-end md:p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-dojo-dorado/90">Filtrar por kyu</label>
          <select
            value={filterKyu}
            onChange={(e) => setFilterKyu(e.target.value)}
            className="rounded-md border border-white/15 bg-dojo-negro px-3 py-2 text-sm text-white outline-none focus:border-dojo-dorado focus:ring-1 focus:ring-dojo-dorado"
          >
            <option value="all">Todos</option>
            {GRADO_ORDER.map((k) => <option key={k} value={k}>{gradoLabel(k)}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-dojo-dorado/90">Póliza</label>
          <select
            value={filterPoliza}
            onChange={(e) => setFilterPoliza(e.target.value)}
            className="rounded-md border border-white/15 bg-dojo-negro px-3 py-2 text-sm text-white outline-none focus:border-dojo-dorado focus:ring-1 focus:ring-dojo-dorado"
          >
            <option value="all">Todas</option>
            <option value="activa">Activa</option>
            <option value="vencida">Vencida</option>
            <option value="sin">Sin póliza</option>
          </select>
        </div>
      </div>

      <KaratecasCards
        rows={filtered} loading={loading}
        onEdit={(row) => { setError(null); setEditing(row); setModal('edit'); }}
        onToggleActivo={toggleActivo}
        onEliminar={eliminarKarateca}
      />
      <KaratecasTable
        rows={filtered} loading={loading}
        onEdit={(row) => { setError(null); setEditing(row); setModal('edit'); }}
        onToggleActivo={toggleActivo}
        onEliminar={eliminarKarateca}
      />

      <NuevoKaratecaModal open={modal === 'new'} onClose={() => setModal(null)} onSuccess={load} />
      <EditarKaratecaModal karateca={modal === 'edit' ? editing : null} onClose={closeModals} onSuccess={load} />
    </div>
  );
}
