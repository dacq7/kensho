import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import api from '../../lib/api';
import { KyuBadge } from '../../lib/kyuUtils';

const DOJO = { negro: '#111111', rojo: '#CC0000', dorado: '#C9A84C' };

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

function badgeEstado(estado) {
  if (estado === 'activa') return { label: 'Activa', bg: '#1a4d2e', color: '#9af7b8' };
  if (estado === 'por_vencer') return { label: '⚠ Por vencer', bg: '#7a4b00', color: '#ffd08a' };
  if (estado === 'vencida') return { label: 'Vencida', bg: 'rgba(204,0,0,0.35)', color: '#ffaaaa' };
  return { label: 'Sin póliza', bg: '#444', color: '#ddd' };
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

  const cardStyle = {
    flex: '1 1 180px',
    borderRadius: 8,
    padding: '0.85rem 1rem',
    border: `1px solid ${DOJO.dorado}`,
    background: '#1a1a1a',
  };

  const modalVisible = Boolean(createTarget || editTarget);

  return (
    <div className="p-3 text-[#eee] md:p-6 lg:p-8" style={{ minHeight: '100%', background: DOJO.negro }}>
      <header className="mb-4 border-b pb-3 md:mb-5 md:pb-4" style={{ borderColor: DOJO.dorado }}>
        <h1 className="text-lg font-semibold md:text-xl lg:text-2xl" style={{ margin: 0, color: DOJO.dorado }}>
          Pólizas
        </h1>
      </header>

      <section style={{ display: 'flex', flexWrap: 'wrap', gap: '0.9rem', marginBottom: '1.2rem' }}>
        <article style={cardStyle}><div style={{ fontSize: '0.75rem', color: '#999' }}>Activas</div><div style={{ fontSize: '1.5rem', color: '#9af7b8', fontWeight: 700 }}>{resumen.activas}</div></article>
        <article style={cardStyle}><div style={{ fontSize: '0.75rem', color: '#999' }}>Por vencer (30 días)</div><div style={{ fontSize: '1.5rem', color: '#ffd08a', fontWeight: 700 }}>{resumen.porVencer}</div></article>
        <article style={cardStyle}><div style={{ fontSize: '0.75rem', color: '#999' }}>Vencidas</div><div style={{ fontSize: '1.5rem', color: '#ffaaaa', fontWeight: 700 }}>{resumen.vencidas}</div></article>
      </section>

      {error && <div style={{ background: 'rgba(204,0,0,0.2)', border: `1px solid ${DOJO.rojo}`, color: '#ffd0d0', padding: '0.65rem 1rem', borderRadius: 6, marginBottom: '1rem' }}>{error}</div>}
      {success && <div style={{ background: 'rgba(201,168,76,0.12)', border: `1px solid ${DOJO.dorado}`, color: DOJO.dorado, padding: '0.65rem 1rem', borderRadius: 6, marginBottom: '1rem' }}>{success}</div>}

      <section style={{ background: '#1a1a1a', border: `1px solid ${DOJO.dorado}`, borderRadius: 8, padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', gap: '0.75rem', flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', color: DOJO.dorado }}>Karatecas y pólizas</h2>
          <label style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#bbb' }}>Filtrar estado</span>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={{ background: '#0f0f0f', color: '#eee', border: `1px solid ${DOJO.rojo}`, borderRadius: 6, padding: '0.35rem 0.45rem', fontSize: '0.85rem' }}>
              <option value="todos">Todos</option>
              <option value="activa">Activas</option>
              <option value="por_vencer">Por vencer</option>
              <option value="vencida">Vencidas</option>
              <option value="sin_poliza">Sin póliza</option>
            </select>
          </label>
        </div>

        {loading ? (
          <p style={{ color: '#888' }}>Cargando…</p>
        ) : (
          <>
            <div className="space-y-3 lg:hidden">
              {filteredRows.map((row) => {
                const b = badgeEstado(row.estado);
                return (
                  <div
                    key={row.karatecaId}
                    className="rounded-lg border border-[#C9A84C]/25 bg-[#141414] p-4"
                  >
                    <button
                      type="button"
                      onClick={() => openHistory(row)}
                      className="mb-2 min-h-[44px] w-full text-left font-bold"
                      style={{ background: 'transparent', border: 'none', color: DOJO.dorado }}
                    >
                      {row.user?.nombre ?? `#${row.karatecaId}`}
                    </button>
                    <div className="mb-2">
                      <KyuBadge kyu={gradoValue(row)} />
                    </div>
                    <p className="mb-1 text-sm text-[#ddd]">{row.poliza?.aseguradora || '—'}</p>
                    <p className="mb-2 text-xs text-[#aaa]">
                      {formatFecha(row.poliza?.fechaInicio)} → {formatFecha(row.poliza?.fechaVencimiento)}
                    </p>
                    <span
                      className="mb-3 inline-block rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{ background: b.bg, color: b.color }}
                    >
                      {b.label}
                    </span>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => openCreate(row)}
                        className="min-h-[44px] w-full rounded-md border-0 font-semibold text-white"
                        style={{ background: DOJO.rojo, fontSize: '0.85rem' }}
                      >
                        Registrar / Actualizar póliza
                      </button>
                      {row.poliza?.id && (
                        <button
                          type="button"
                          onClick={() => removeByKarateca(row)}
                          disabled={deletingId === `k-${row.karatecaId}`}
                          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md border border-[#8a1f1f] font-medium text-[#ffb0b0]"
                          style={{
                            background: 'rgba(204,0,0,0.25)',
                            cursor: deletingId === `k-${row.karatecaId}` ? 'not-allowed' : 'pointer',
                            opacity: deletingId === `k-${row.karatecaId}` ? 0.6 : 1,
                          }}
                        >
                          <Trash2 size={16} />
                          Quitar póliza
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="hidden overflow-x-auto lg:block">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${DOJO.dorado}`, color: DOJO.dorado, textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem' }}>Nombre</th><th style={{ padding: '0.5rem' }}>Kyu</th><th style={{ padding: '0.5rem' }}>Aseguradora</th><th style={{ padding: '0.5rem' }}>N° Póliza</th><th style={{ padding: '0.5rem' }}>Fecha inicio</th><th style={{ padding: '0.5rem' }}>Fecha vencimiento</th><th style={{ padding: '0.5rem' }}>Estado</th><th style={{ padding: '0.5rem' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const b = badgeEstado(row.estado);
                  return (
                    <tr key={row.karatecaId} style={{ borderBottom: '1px solid #333' }}>
                      <td style={{ padding: '0.55rem 0.5rem', fontWeight: 600 }}>
                        <button type="button" onClick={() => openHistory(row)} style={{ background: 'transparent', border: 'none', color: DOJO.dorado, cursor: 'pointer', padding: 0, fontWeight: 700 }}>{row.user?.nombre ?? `#${row.karatecaId}`}</button>
                      </td>
                      <td style={{ padding: '0.55rem 0.5rem' }}><KyuBadge kyu={gradoValue(row)} /></td>
                      <td style={{ padding: '0.55rem 0.5rem', color: '#ddd' }}>{row.poliza?.aseguradora || '—'}</td>
                      <td style={{ padding: '0.55rem 0.5rem', color: '#ddd' }}>{row.poliza?.numeroPoliza || '—'}</td>
                      <td style={{ padding: '0.55rem 0.5rem', color: '#ccc' }}>{formatFecha(row.poliza?.fechaInicio)}</td>
                      <td style={{ padding: '0.55rem 0.5rem', color: '#ccc' }}>{formatFecha(row.poliza?.fechaVencimiento)}</td>
                      <td style={{ padding: '0.55rem 0.5rem' }}><span style={{ background: b.bg, color: b.color, padding: '0.2rem 0.5rem', borderRadius: 999, fontSize: '0.74rem', fontWeight: 600 }}>{b.label}</span></td>
                      <td style={{ padding: '0.55rem 0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <button type="button" onClick={() => openCreate(row)} style={{ border: 'none', borderRadius: 6, background: DOJO.rojo, color: '#fff', padding: '0.35rem 0.65rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                            Registrar / Actualizar póliza
                          </button>
                          {row.poliza?.id && (
                            <button type="button" onClick={() => removeByKarateca(row)} disabled={deletingId === `k-${row.karatecaId}`} title="Quitar póliza" style={{ border: '1px solid #8a1f1f', borderRadius: 6, background: 'rgba(204,0,0,0.25)', color: '#ffb0b0', padding: '0.28rem 0.45rem', cursor: deletingId === `k-${row.karatecaId}` ? 'not-allowed' : 'pointer', opacity: deletingId === `k-${row.karatecaId}` ? 0.6 : 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Trash2 size={14} />
                            </button>
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
      </section>

      {modalVisible && (
        <div
          role="presentation"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-0 md:p-4"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-labelledby="modal-poliza-title"
            onClick={(e) => e.stopPropagation()}
            className="h-full max-h-[100dvh] w-full overflow-y-auto rounded-none border-0 p-4 md:h-auto md:max-h-[90vh] md:max-w-[26rem] md:rounded-[10px] md:border-2 md:p-[1.1rem]"
            style={{ background: DOJO.negro, borderColor: DOJO.dorado }}
          >
            <h3 id="modal-poliza-title" style={{ margin: '0 0 0.75rem', color: DOJO.dorado, fontSize: '1.05rem' }}>{editTarget ? 'Editar póliza' : 'Registrar nueva póliza'}</h3>
            <p style={{ margin: '0 0 1rem', color: '#aaa', fontSize: '0.85rem' }}>{editTarget ? 'Editando ítem del historial' : (createTarget?.user?.nombre ?? '')}</p>
            <label style={{ display: 'block', marginBottom: '0.7rem' }}><span style={{ display: 'block', fontSize: '0.8rem', color: '#bbb', marginBottom: '0.25rem' }}>Aseguradora</span><input type="text" value={aseguradora} onChange={(e) => setAseguradora(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '0.45rem', borderRadius: 6, border: `1px solid ${DOJO.rojo}`, background: '#0f0f0f', color: '#fff' }} /></label>
            <label style={{ display: 'block', marginBottom: '0.7rem' }}><span style={{ display: 'block', fontSize: '0.8rem', color: '#bbb', marginBottom: '0.25rem' }}>Número de póliza</span><input type="text" value={numeroPoliza} onChange={(e) => setNumeroPoliza(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '0.45rem', borderRadius: 6, border: `1px solid ${DOJO.rojo}`, background: '#0f0f0f', color: '#fff' }} /></label>
            <label style={{ display: 'block', marginBottom: '0.7rem' }}><span style={{ display: 'block', fontSize: '0.8rem', color: '#bbb', marginBottom: '0.25rem' }}>Fecha inicio</span><input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '0.45rem', borderRadius: 6, border: `1px solid ${DOJO.rojo}`, background: '#0f0f0f', color: '#fff' }} /></label>
            <label style={{ display: 'block', marginBottom: '1rem' }}><span style={{ display: 'block', fontSize: '0.8rem', color: '#bbb', marginBottom: '0.25rem' }}>Fecha vencimiento</span><input type="date" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '0.45rem', borderRadius: 6, border: `1px solid ${DOJO.rojo}`, background: '#0f0f0f', color: '#fff' }} /></label>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-2">
              <button type="button" onClick={closeModal} disabled={savingModal} className="min-h-[44px] w-full rounded-md border border-[#555] bg-transparent px-4 text-[#ccc] sm:w-auto" style={{ cursor: savingModal ? 'not-allowed' : 'pointer' }}>Cancelar</button>
              <button type="button" onClick={saveForm} disabled={savingModal} className="min-h-[44px] w-full rounded-md border-0 px-4 font-bold text-white sm:w-auto" style={{ background: DOJO.rojo, cursor: savingModal ? 'not-allowed' : 'pointer', opacity: savingModal ? 0.7 : 1 }}>{savingModal ? 'Guardando…' : (editTarget ? 'Actualizar' : 'Guardar')}</button>
            </div>
          </div>
        </div>
      )}

      {historyOpen && (
        <div role="presentation" className="fixed inset-0 z-[55] bg-black/60" onClick={() => setHistoryOpen(false)}>
          <aside
            role="dialog"
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 h-full w-full overflow-auto border-l-2 border-[#C9A84C] p-4 md:max-w-[680px]"
            style={{ background: '#171717' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
              <h3 style={{ margin: 0, color: DOJO.dorado }}>Historial de pólizas — {historyKarateca?.user?.nombre}</h3>
              <button type="button" onClick={() => setHistoryOpen(false)} className="min-h-[44px] min-w-[44px] cursor-pointer rounded-md border border-[#555] bg-transparent px-3 text-[#ccc]">Cerrar</button>
            </div>
            {historyLoading ? <p style={{ color: '#888' }}>Cargando historial…</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead><tr style={{ borderBottom: `2px solid ${DOJO.dorado}`, color: DOJO.dorado, textAlign: 'left' }}><th style={{ padding: '0.45rem' }}>Aseguradora</th><th style={{ padding: '0.45rem' }}>N° Póliza</th><th style={{ padding: '0.45rem' }}>Fecha inicio</th><th style={{ padding: '0.45rem' }}>Fecha vencimiento</th><th style={{ padding: '0.45rem' }}>Estado</th><th style={{ padding: '0.45rem' }}>Acciones</th></tr></thead>
                <tbody>
                  {historyRows.map((item) => {
                    const b = badgeEstado(item.estado);
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid #333' }}>
                        <td style={{ padding: '0.45rem' }}>{item.aseguradora}</td>
                        <td style={{ padding: '0.45rem' }}>{item.numeroPoliza}</td>
                        <td style={{ padding: '0.45rem' }}>{formatFecha(item.fechaInicio)}</td>
                        <td style={{ padding: '0.45rem' }}>{formatFecha(item.fechaVencimiento)}</td>
                        <td style={{ padding: '0.45rem' }}><span style={{ background: b.bg, color: b.color, padding: '0.2rem 0.45rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600 }}>{b.label}</span></td>
                        <td style={{ padding: '0.45rem' }}>
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button type="button" onClick={() => openEdit(item)} style={{ border: '1px solid #666', borderRadius: 6, background: '#262626', color: '#ddd', padding: '0.25rem 0.5rem', cursor: 'pointer' }}><Pencil size={13} /></button>
                            <button type="button" onClick={() => removeSingle(item)} disabled={deletingId === `p-${item.id}`} style={{ border: '1px solid #8a1f1f', borderRadius: 6, background: 'rgba(204,0,0,0.25)', color: '#ffb0b0', padding: '0.25rem 0.5rem', cursor: deletingId === `p-${item.id}` ? 'not-allowed' : 'pointer' }}><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
