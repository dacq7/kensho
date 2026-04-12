import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import api from '../../lib/api';
import { KyuBadge } from '../../lib/kyuUtils';
import { Badge, Button, Card, Input, Modal, Skeleton, SkeletonCard } from '../../components/ui';

function gradoValue(row) {
  if (typeof row.dan === 'number' && row.dan >= 1) return `${row.dan}dan`;
  return row.kyuActual;
}

function ymd(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatFecha(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function polizaEstadoBadge(estado) {
  if (estado === 'activa') return { variant: 'success', label: 'Activa' };
  if (estado === 'por_vencer') return { variant: 'warning', label: '⚠ Por vencer' };
  if (estado === 'vencida') return { variant: 'danger', label: 'Vencida' };
  return { variant: 'muted', label: 'Sin póliza' };
}

export default function SenseiPolizasPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');

  const [createTarget, setCreateTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [aseguradora, setAseguradora] = useState('');
  const [numeroPoliza, setNumeroPoliza] = useState('');
  const [fechaInicio, setFechaInicio] = useState(() => ymd(new Date()));
  const [fechaVencimiento, setFechaVencimiento] = useState(() => ymd(new Date()));
  const [savingModal, setSavingModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyKarateca, setHistoryKarateca] = useState(null);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/polizas');
      const list = Array.isArray(data) ? data : [];
      setRows(
        list.map((row) => ({
          karatecaId: row.karatecaId,
          user: row.karateca?.user || null,
          kyuActual: row.karateca?.kyuActual,
          dan: row.karateca?.dan,
          poliza: row.poliza,
          estado: row.poliza?.estado || 'sin_poliza',
        })),
      );
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudieron cargar las pólizas');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async (karatecaId) => {
    setHistoryLoading(true);
    try {
      const { data } = await api.get(`/polizas/karateca/${karatecaId}`);
      setHistoryRows(Array.isArray(data) ? data : []);
    } catch {
      setHistoryRows([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resumen = useMemo(() => {
    let activas = 0;
    let porVencer = 0;
    let vencidas = 0;
    for (const r of rows) {
      if (r.estado === 'activa') activas += 1;
      else if (r.estado === 'por_vencer') porVencer += 1;
      else if (r.estado === 'vencida') vencidas += 1;
    }
    return { activas, porVencer, vencidas };
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (filtroEstado === 'todos') return rows;
    if (filtroEstado === 'sin_poliza') return rows.filter((r) => r.estado === 'sin_poliza');
    return rows.filter((r) => r.estado === filtroEstado);
  }, [rows, filtroEstado]);

  const resetForm = () => {
    setAseguradora('');
    setNumeroPoliza('');
    setFechaInicio(ymd(new Date()));
    setFechaVencimiento(ymd(new Date()));
  };

  const openCreate = (row) => {
    setError(null);
    setSuccess(null);
    setEditTarget(null);
    setCreateTarget(row);
    resetForm();
  };

  const openEdit = (item) => {
    setError(null);
    setSuccess(null);
    setCreateTarget(null);
    setEditTarget(item);
    setAseguradora(item.aseguradora || '');
    setNumeroPoliza(item.numeroPoliza || '');
    setFechaInicio(item.fechaInicio ? ymd(item.fechaInicio) : ymd(new Date()));
    setFechaVencimiento(item.fechaVencimiento ? ymd(item.fechaVencimiento) : ymd(new Date()));
  };

  const closeModal = () => {
    if (savingModal) return;
    setCreateTarget(null);
    setEditTarget(null);
  };

  const saveForm = async () => {
    setSavingModal(true);
    setError(null);
    setSuccess(null);
    try {
      if (editTarget) {
        await api.put(`/polizas/${editTarget.id}`, {
          aseguradora,
          numeroPoliza,
          fechaInicio,
          fechaVencimiento,
        });
        setSuccess('Póliza actualizada');
      } else if (createTarget) {
        await api.post('/polizas', {
          karatecaId: createTarget.karatecaId,
          aseguradora,
          numeroPoliza,
          fechaInicio,
          fechaVencimiento,
        });
        setSuccess('Póliza registrada');
      }
      closeModal();
      await loadData();
      if (historyKarateca) await loadHistory(historyKarateca.karatecaId);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo guardar');
    } finally {
      setSavingModal(false);
    }
  };

  const removeByKarateca = async (row) => {
    const ok = window.confirm(
      '¿Eliminar todas las pólizas de este karateca? Esta acción no se puede deshacer.',
    );
    if (!ok) return;
    setDeletingId(`k-${row.karatecaId}`);
    setError(null);
    setSuccess(null);
    try {
      await api.delete(`/polizas/karateca/${row.karatecaId}`);
      setSuccess('Historial de pólizas eliminado');
      await loadData();
      if (historyKarateca?.karatecaId === row.karatecaId) setHistoryRows([]);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  const removeSingle = async (item) => {
    const ok = window.confirm('¿Eliminar esta póliza?');
    if (!ok) return;
    setDeletingId(`p-${item.id}`);
    setError(null);
    setSuccess(null);
    try {
      await api.delete(`/polizas/${item.id}`);
      setSuccess('Póliza eliminada');
      await loadData();
      if (historyKarateca) await loadHistory(historyKarateca.karatecaId);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  const openHistory = async (row) => {
    setHistoryKarateca(row);
    setHistoryOpen(true);
    await loadHistory(row.karatecaId);
  };

  const modalVisible = Boolean(createTarget || editTarget);

  return (
    <div className="min-h-full p-3 text-white/90 md:p-6 lg:p-8">
      {/* ── Header ── */}
      <header className="mb-4 border-b border-dojo-dorado/25 pb-3 md:mb-5 md:pb-4">
        <h1 className="text-lg font-semibold tracking-tight text-dojo-dorado md:text-xl lg:text-2xl">
          Pólizas
        </h1>
      </header>

      {/* ── Resumen stat cards ── */}
      <div className="mb-5 flex flex-wrap gap-4">
        <Card className="flex-1 basis-40">
          <p className="text-xs uppercase tracking-wider text-white/40">Activas</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{resumen.activas}</p>
        </Card>
        <Card className="flex-1 basis-40">
          <p className="text-xs uppercase tracking-wider text-white/40">Por vencer (30 días)</p>
          <p className="mt-1 text-2xl font-bold text-amber-400">{resumen.porVencer}</p>
        </Card>
        <Card className="flex-1 basis-40">
          <p className="text-xs uppercase tracking-wider text-white/40">Vencidas</p>
          <p className="mt-1 text-2xl font-bold text-red-400">{resumen.vencidas}</p>
        </Card>
      </div>

      {/* ── Alerts ── */}
      {error && (
        <div className="mb-4 rounded-r-md border-l-4 border-dojo-rojo bg-dojo-rojo/10 px-4 py-3 text-sm text-red-200" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-r-md border-l-4 border-dojo-dorado bg-dojo-dorado/10 px-4 py-3 text-sm text-dojo-dorado" role="status">
          {success}
        </div>
      )}

      {/* ── Table section ── */}
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-dojo-dorado md:text-base">
            Karatecas y pólizas
          </h2>
          <label className="flex items-center gap-2">
            <span className="text-xs text-white/50">Filtrar estado</span>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="rounded-md border border-white/15 bg-dojo-negro px-3 py-2 text-sm text-white focus:border-dojo-dorado focus:outline-none"
            >
              <option value="todos">Todos</option>
              <option value="activa">Activas</option>
              <option value="por_vencer">Por vencer</option>
              <option value="vencida">Vencidas</option>
              <option value="sin_poliza">Sin póliza</option>
            </select>
          </label>
        </div>

        {loading ? (
          <div className="space-y-3 py-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-4/5" />
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-3 lg:hidden">
              {filteredRows.map((row) => {
                const { variant, label } = polizaEstadoBadge(row.estado);
                return (
                  <div
                    key={row.karatecaId}
                    className="rounded-lg border border-dojo-dorado/20 bg-dojo-negro p-4"
                  >
                    <button
                      type="button"
                      onClick={() => openHistory(row)}
                      className="mb-2 min-h-[44px] w-full cursor-pointer border-0 bg-transparent p-0 text-left font-bold text-dojo-dorado"
                    >
                      {row.user?.nombre ?? `#${row.karatecaId}`}
                    </button>
                    <div className="mb-2">
                      <KyuBadge kyu={gradoValue(row)} />
                    </div>
                    <p className="mb-1 text-sm text-white/75">{row.poliza?.aseguradora || '—'}</p>
                    <p className="mb-2 text-xs text-white/45">
                      {formatFecha(row.poliza?.fechaInicio)} → {formatFecha(row.poliza?.fechaVencimiento)}
                    </p>
                    <div className="mb-3">
                      <Badge variant={variant}>{label}</Badge>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        className="w-full"
                        onClick={() => openCreate(row)}
                      >
                        Registrar / Actualizar póliza
                      </Button>
                      {row.poliza?.id && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-full text-red-400 hover:text-red-300"
                          disabled={deletingId === `k-${row.karatecaId}`}
                          onClick={() => removeByKarateca(row)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                          Quitar póliza
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-dojo-dorado">
                    {['Nombre', 'Kyu', 'Aseguradora', 'N° Póliza', 'Fecha inicio', 'Fecha vencimiento', 'Estado', 'Acciones'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dojo-dorado/70">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => {
                    const { variant, label } = polizaEstadoBadge(row.estado);
                    return (
                      <tr key={row.karatecaId} className="border-b border-white/5 transition-colors hover:bg-white/[0.02]">
                        <td className="px-4 py-3 font-semibold">
                          <button
                            type="button"
                            onClick={() => openHistory(row)}
                            className="cursor-pointer border-0 bg-transparent p-0 font-bold text-dojo-dorado hover:text-dojo-dorado/80"
                          >
                            {row.user?.nombre ?? `#${row.karatecaId}`}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <KyuBadge kyu={gradoValue(row)} />
                        </td>
                        <td className="px-4 py-3 text-white/75">{row.poliza?.aseguradora || '—'}</td>
                        <td className="px-4 py-3 text-white/75">{row.poliza?.numeroPoliza || '—'}</td>
                        <td className="px-4 py-3 text-white/60">{formatFecha(row.poliza?.fechaInicio)}</td>
                        <td className="px-4 py-3 text-white/60">{formatFecha(row.poliza?.fechaVencimiento)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={variant}>{label}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              onClick={() => openCreate(row)}
                            >
                              Registrar / Actualizar póliza
                            </Button>
                            {row.poliza?.id && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={deletingId === `k-${row.karatecaId}`}
                                title="Quitar póliza"
                                onClick={() => removeByKarateca(row)}
                              >
                                <Trash2 className="h-4 w-4 text-red-400" aria-hidden />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* ── Modal: Registrar / Editar póliza ── */}
      <Modal
        open={modalVisible}
        onClose={closeModal}
        title={editTarget ? 'Editar póliza' : 'Registrar nueva póliza'}
      >
        <p className="mb-4 text-sm text-white/50">
          {editTarget ? 'Editando ítem del historial' : (createTarget?.user?.nombre ?? '')}
        </p>
        <div className="space-y-4">
          <Input
            id="pol-aseguradora"
            label="Aseguradora"
            type="text"
            value={aseguradora}
            onChange={(e) => setAseguradora(e.target.value)}
          />
          <Input
            id="pol-numero"
            label="Número de póliza"
            type="text"
            value={numeroPoliza}
            onChange={(e) => setNumeroPoliza(e.target.value)}
          />
          <Input
            id="pol-fecha-inicio"
            label="Fecha inicio"
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
          <Input
            id="pol-fecha-vencimiento"
            label="Fecha vencimiento"
            type="date"
            value={fechaVencimiento}
            onChange={(e) => setFechaVencimiento(e.target.value)}
          />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={savingModal}
            onClick={closeModal}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={savingModal}
            onClick={saveForm}
          >
            {savingModal ? 'Guardando…' : (editTarget ? 'Actualizar' : 'Guardar')}
          </Button>
        </div>
      </Modal>

      {/* ── History side panel ── */}
      {historyOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-[55] bg-black/60"
          onClick={() => setHistoryOpen(false)}
        >
          <aside
            role="dialog"
            aria-label="Historial de pólizas"
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 h-full w-full overflow-auto border-l-2 border-dojo-dorado bg-dojo-surface p-4 md:max-w-[680px]"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-dojo-dorado">
                Historial de pólizas — {historyKarateca?.user?.nombre}
              </h3>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setHistoryOpen(false)}
              >
                Cerrar
              </Button>
            </div>

            {historyLoading ? (
              <div className="space-y-3 py-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-3/4" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b-2 border-dojo-dorado">
                      {['Aseguradora', 'N° Póliza', 'Fecha inicio', 'Fecha vencimiento', 'Estado', 'Acciones'].map((h) => (
                        <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-dojo-dorado/70">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historyRows.map((item) => {
                      const { variant, label } = polizaEstadoBadge(item.estado);
                      return (
                        <tr key={item.id} className="border-b border-white/5 transition-colors hover:bg-white/[0.02]">
                          <td className="px-3 py-2.5 text-white/85">{item.aseguradora}</td>
                          <td className="px-3 py-2.5 text-white/85">{item.numeroPoliza}</td>
                          <td className="px-3 py-2.5 text-white/60">{formatFecha(item.fechaInicio)}</td>
                          <td className="px-3 py-2.5 text-white/60">{formatFecha(item.fechaVencimiento)}</td>
                          <td className="px-3 py-2.5">
                            <Badge variant={variant}>{label}</Badge>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(item)}
                                title="Editar"
                              >
                                <Pencil className="h-3.5 w-3.5" aria-hidden />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={deletingId === `p-${item.id}`}
                                onClick={() => removeSingle(item)}
                                title="Eliminar"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-400" aria-hidden />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
