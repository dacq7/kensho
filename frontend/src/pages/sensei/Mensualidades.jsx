import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../lib/api';
import { KyuBadge } from '../../lib/kyuUtils';

const DOJO = { negro: '#111111', rojo: '#CC0000', dorado: '#C9A84C' };
const CONFIG_CLAVE = 'mensualidad_valor';

function pad2(n) {
  return String(n).padStart(2, '0');
}

function toYm(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

function parseYm(ym) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1);
}

function addMonthsYm(ym, delta) {
  const d = parseYm(ym);
  d.setMonth(d.getMonth() + delta);
  return toYm(d);
}

function mesTituloEs(ym) {
  const d = parseYm(ym);
  return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}

function toYmd(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function gradoValue(row) {
  if (typeof row.dan === 'number' && row.dan >= 1) return `${row.dan}dan`;
  return row.kyuActual;
}

function formatFechaPago(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SenseiMensualidadesPage() {
  const [mes, setMes] = useState(() => toYm(new Date()));
  const [valorGlobal, setValorGlobal] = useState('');
  const [configLoading, setConfigLoading] = useState(true);
  const [configSaving, setConfigSaving] = useState(false);

  const [filas, setFilas] = useState([]);
  const [listaLoading, setListaLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [modalRow, setModalRow] = useState(null);
  const [modalMonto, setModalMonto] = useState('');
  const [modalFecha, setModalFecha] = useState(() => toYmd(new Date()));
  const [modalSubmitting, setModalSubmitting] = useState(false);

  const [anularId, setAnularId] = useState(null);
  const [anularSubmitting, setAnularSubmitting] = useState(false);

  const loadConfig = useCallback(async () => {
    setConfigLoading(true);
    try {
      const { data } = await api.get(`/config/${CONFIG_CLAVE}`);
      setValorGlobal(data?.valor != null ? String(data.valor) : '');
    } catch (e) {
      if (e.response?.status === 404) setValorGlobal('');
    } finally {
      setConfigLoading(false);
    }
  }, []);

  const loadMes = useCallback(async (mesParam) => {
    setListaLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/mensualidades/mes', { params: { mes: mesParam } });
      setFilas(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo cargar el mes');
      setFilas([]);
    } finally {
      setListaLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    loadMes(mes);
  }, [mes, loadMes]);

  const guardarConfig = async () => {
    setConfigSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post('/config', { clave: CONFIG_CLAVE, valor: valorGlobal });
      setSuccess('Valor guardado');
      await loadConfig();
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo guardar');
    } finally {
      setConfigSaving(false);
    }
  };

  const abrirModalPago = (row) => {
    setError(null);
    setSuccess(null);
    setModalRow(row);
    setModalMonto(valorGlobal || row.mensualidad?.monto || '0');
    setModalFecha(toYmd(new Date()));
  };

  const cerrarModal = () => {
    if (modalSubmitting) return;
    setModalRow(null);
  };

  const confirmarPago = async () => {
    if (!modalRow) return;
    setModalSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post('/mensualidades/pago', {
        karatecaId: modalRow.karatecaId,
        mes,
        monto: modalMonto,
        fechaPago: modalFecha,
      });
      setSuccess('Pago registrado');
      setModalRow(null);
      await loadMes(mes);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo registrar el pago');
    } finally {
      setModalSubmitting(false);
    }
  };

  const confirmarAnular = async () => {
    if (anularId == null) return;
    setAnularSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await api.patch(`/mensualidades/${anularId}/anular`);
      setSuccess('Pago anulado');
      setAnularId(null);
      await loadMes(mes);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo anular');
    } finally {
      setAnularSubmitting(false);
    }
  };

  const resumen = useMemo(() => {
    let pagados = 0;
    let pendientes = 0;
    let recaudado = 0;
    for (const row of filas) {
      const p = row.mensualidad?.pagado === true;
      if (p) {
        pagados += 1;
        const m = parseFloat(String(row.mensualidad?.monto ?? '0'));
        if (!Number.isNaN(m)) recaudado += m;
      } else {
        pendientes += 1;
      }
    }
    return { pagados, pendientes, recaudado };
  }, [filas]);

  const badge = (children, bg, color) => (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color,
        padding: '0.2rem 0.5rem',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  );

  return (
    <div className="p-3 text-[#eee] md:p-6 lg:p-8" style={{ minHeight: '100%', background: DOJO.negro }}>
      {/* Parte 1 — Header */}
      <header className="mb-4 border-b pb-4 md:mb-5" style={{ borderColor: DOJO.dorado }}>
        <h1 className="mb-3 text-lg font-semibold md:text-xl lg:text-2xl" style={{ color: DOJO.dorado }}>
          Mensualidades
        </h1>
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#aaa' }}>Valor global de la mensualidad</span>
            <input
              type="text"
              inputMode="decimal"
              value={valorGlobal}
              onChange={(e) => setValorGlobal(e.target.value)}
              disabled={configLoading}
              style={{
                width: '10rem',
                padding: '0.45rem 0.6rem',
                borderRadius: 6,
                border: `1px solid ${DOJO.rojo}`,
                background: '#0d0d0d',
                color: '#fff',
              }}
            />
          </label>
          <button
            type="button"
            onClick={guardarConfig}
            disabled={configSaving || configLoading}
            className="min-h-[44px] w-full rounded-md border-0 font-bold text-white sm:w-auto sm:px-4"
            style={{
              background: DOJO.rojo,
              cursor: configSaving || configLoading ? 'not-allowed' : 'pointer',
              opacity: configSaving || configLoading ? 0.6 : 1,
            }}
          >
            {configSaving ? 'Guardando…' : 'Guardar'}
          </button>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              aria-label="Mes anterior"
              onClick={() => setMes((m) => addMonthsYm(m, -1))}
              style={{
                padding: '0.4rem 0.65rem',
                borderRadius: 6,
                border: 'none',
                background: DOJO.rojo,
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ←
            </button>
            <span style={{ minWidth: '11rem', textAlign: 'center', textTransform: 'capitalize', color: DOJO.dorado, fontWeight: 600 }}>
              {mesTituloEs(mes)}
            </span>
            <button
              type="button"
              aria-label="Mes siguiente"
              onClick={() => setMes((m) => addMonthsYm(m, 1))}
              style={{
                padding: '0.4rem 0.65rem',
                borderRadius: 6,
                border: 'none',
                background: DOJO.rojo,
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              →
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div style={{ background: 'rgba(204,0,0,0.2)', border: `1px solid ${DOJO.rojo}`, color: '#fcc', padding: '0.6rem 1rem', borderRadius: 6, marginBottom: '1rem' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: 'rgba(201,168,76,0.12)', border: `1px solid ${DOJO.dorado}`, color: DOJO.dorado, padding: '0.6rem 1rem', borderRadius: 6, marginBottom: '1rem' }}>
          {success}
        </div>
      )}

      {/* Parte 2 — Cards móvil / Tabla desktop */}
      <section
        className="mb-4 md:mb-5"
        style={{
          background: '#1a1a1a',
          border: `1px solid ${DOJO.dorado}`,
          borderRadius: 8,
          padding: '1rem',
        }}
      >
        {listaLoading ? (
          <p style={{ color: '#888', margin: 0 }}>Cargando…</p>
        ) : (
          <>
            <div className="space-y-3 lg:hidden">
              {filas.map((row) => {
                const pagado = row.mensualidad?.pagado === true;
                const enMora = row.enMora === true && !pagado;
                return (
                  <div
                    key={row.karatecaId}
                    className="rounded-lg border border-[#333] bg-[#141414] p-4"
                  >
                    <div className="mb-2 font-semibold text-white">
                      {row.user?.nombre ?? `#${row.karatecaId}`}
                    </div>
                    <div className="mb-2">
                      <KyuBadge kyu={gradoValue(row)} />
                    </div>
                    <div className="mb-2 flex flex-wrap gap-2">
                      {pagado
                        ? badge('✓ Pagado', '#1a4d2e', '#9f9')
                        : badge('✗ Pendiente', 'rgba(204,0,0,0.35)', '#faa')}
                      {enMora && badge('⚠ En mora', '#b35900', '#fff')}
                    </div>
                    <p className="mb-1 text-sm text-[#ccc]">Monto: {row.mensualidad?.monto ?? '—'}</p>
                    <p className="mb-3 text-xs text-[#888]">{formatFechaPago(row.mensualidad?.fechaPago)}</p>
                    {!pagado ? (
                      <button
                        type="button"
                        onClick={() => abrirModalPago(row)}
                        className="min-h-[44px] w-full rounded-md border-0 font-semibold text-white"
                        style={{ background: DOJO.rojo, fontSize: '0.85rem' }}
                      >
                        Registrar pago
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAnularId(row.mensualidad.id)}
                        className="min-h-[44px] w-full rounded-md border-0 font-semibold"
                        style={{ background: '#333', color: '#f99', fontSize: '0.85rem' }}
                      >
                        Anular pago
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[640px] border-collapse text-sm" style={{ fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${DOJO.dorado}`, color: DOJO.dorado, textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem' }}>Nombre</th>
                  <th style={{ padding: '0.5rem' }}>Kyu</th>
                  <th style={{ padding: '0.5rem' }}>Estado</th>
                  <th style={{ padding: '0.5rem' }}>Monto</th>
                  <th style={{ padding: '0.5rem' }}>Fecha de pago</th>
                  <th style={{ padding: '0.5rem' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((row) => {
                  const pagado = row.mensualidad?.pagado === true;
                  const enMora = row.enMora === true && !pagado;
                  return (
                    <tr key={row.karatecaId} style={{ borderBottom: '1px solid #333' }}>
                      <td style={{ padding: '0.55rem 0.5rem', fontWeight: 600 }}>{row.user?.nombre ?? `#${row.karatecaId}`}</td>
                      <td style={{ padding: '0.55rem 0.5rem' }}>
                        <KyuBadge kyu={gradoValue(row)} />
                      </td>
                      <td style={{ padding: '0.55rem 0.5rem' }}>
                        <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                          {pagado
                            ? badge('✓ Pagado', '#1a4d2e', '#9f9')
                            : badge('✗ Pendiente', 'rgba(204,0,0,0.35)', '#faa')}
                          {enMora && badge('⚠ En mora', '#b35900', '#fff')}
                        </span>
                      </td>
                      <td style={{ padding: '0.55rem 0.5rem', color: '#ccc' }}>{row.mensualidad?.monto ?? '—'}</td>
                      <td style={{ padding: '0.55rem 0.5rem', color: '#ccc' }}>{formatFechaPago(row.mensualidad?.fechaPago)}</td>
                      <td style={{ padding: '0.55rem 0.5rem' }}>
                        {!pagado ? (
                          <button
                            type="button"
                            onClick={() => abrirModalPago(row)}
                            style={{
                              padding: '0.35rem 0.65rem',
                              borderRadius: 6,
                              border: 'none',
                              background: DOJO.rojo,
                              color: '#fff',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                            }}
                          >
                            Registrar pago
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setAnularId(row.mensualidad.id)}
                            style={{
                              padding: '0.35rem 0.65rem',
                              borderRadius: 6,
                              border: 'none',
                              background: '#333',
                              color: '#f99',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                            }}
                          >
                            Anular pago
                          </button>
                        )}
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

      {/* Parte 3 — Resumen */}
      <section
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1.25rem',
          background: '#1a1a1a',
          border: `1px solid ${DOJO.dorado}`,
          borderRadius: 8,
          padding: '1rem 1.25rem',
        }}
      >
        <div>
          <div style={{ fontSize: '0.75rem', color: '#999' }}>Total pagados</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: DOJO.dorado }}>{resumen.pagados}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#999' }}>Total pendientes</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#faa' }}>{resumen.pendientes}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#999' }}>Total recaudado</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#9f9' }}>
            {resumen.recaudado.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </section>

      {/* Modal registrar pago */}
      {modalRow && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-0 md:p-4"
          onClick={cerrarModal}
        >
          <div
            role="dialog"
            aria-labelledby="modal-pago-title"
            className="h-full max-h-[100dvh] w-full overflow-y-auto rounded-none border-0 p-4 md:h-auto md:max-h-[90vh] md:max-w-[22rem] md:rounded-[10px] md:border-2 md:p-[1.25rem]"
            style={{ background: DOJO.negro, borderColor: DOJO.dorado }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="modal-pago-title" style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: DOJO.dorado }}>
              Registrar pago
            </h2>
            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#aaa' }}>
              {modalRow.user?.nombre ?? `Karateca #${modalRow.karatecaId}`}
            </p>
            <label style={{ display: 'block', marginBottom: '0.75rem' }}>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.25rem' }}>Monto</span>
              <input
                type="text"
                inputMode="decimal"
                value={modalMonto}
                onChange={(e) => setModalMonto(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0.45rem',
                  borderRadius: 6,
                  border: `1px solid ${DOJO.rojo}`,
                  background: '#0d0d0d',
                  color: '#fff',
                }}
              />
            </label>
            <label style={{ display: 'block', marginBottom: '1rem' }}>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.25rem' }}>Fecha de pago</span>
              <input
                type="date"
                value={modalFecha}
                onChange={(e) => setModalFecha(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0.45rem',
                  borderRadius: 6,
                  border: `1px solid ${DOJO.rojo}`,
                  background: '#0d0d0d',
                  color: '#fff',
                }}
              />
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-2">
              <button
                type="button"
                onClick={cerrarModal}
                disabled={modalSubmitting}
                className="min-h-[44px] w-full rounded-md border border-[#555] bg-transparent px-4 text-[#ccc] sm:w-auto"
                style={{ cursor: modalSubmitting ? 'not-allowed' : 'pointer' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarPago}
                disabled={modalSubmitting}
                className="min-h-[44px] w-full rounded-md border-0 bg-[#CC0000] px-4 font-bold text-white sm:w-auto"
                style={{
                  background: DOJO.rojo,
                  cursor: modalSubmitting ? 'not-allowed' : 'pointer',
                  opacity: modalSubmitting ? 0.7 : 1,
                }}
              >
                {modalSubmitting ? 'Guardando…' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación anular */}
      {anularId != null && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-0 md:p-4"
          onClick={() => !anularSubmitting && setAnularId(null)}
        >
          <div
            role="dialog"
            className="h-full max-h-[100dvh] w-full overflow-y-auto rounded-none border-0 p-4 md:h-auto md:max-w-[20rem] md:rounded-[10px] md:border-2 md:p-[1.25rem]"
            style={{ background: DOJO.negro, borderColor: DOJO.rojo }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ margin: '0 0 1rem', color: '#eee' }}>¿Anular este pago? La mensualidad quedará pendiente.</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-2">
              <button
                type="button"
                onClick={() => setAnularId(null)}
                disabled={anularSubmitting}
                className="min-h-[44px] w-full rounded-md border border-[#555] bg-transparent px-4 text-[#ccc] sm:w-auto"
                style={{ cursor: anularSubmitting ? 'not-allowed' : 'pointer' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarAnular}
                disabled={anularSubmitting}
                className="min-h-[44px] w-full rounded-md border-0 px-4 font-bold text-white sm:w-auto"
                style={{
                  background: DOJO.rojo,
                  cursor: anularSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {anularSubmitting ? '…' : 'Anular'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
