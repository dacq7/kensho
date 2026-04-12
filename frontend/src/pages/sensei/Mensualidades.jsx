import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../lib/api';
import { KyuBadge } from '../../lib/kyuUtils';
import { Badge, Button, Card, Input, Modal, Skeleton } from '../../components/ui';

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

  return (
    <div className="min-h-full p-3 text-white/90 md:p-6 lg:p-8">
      {/* ── Header ── */}
      <header className="mb-4 border-b border-dojo-dorado/25 pb-4 md:mb-5">
        <h1 className="mb-3 text-lg font-semibold tracking-tight text-dojo-dorado md:text-xl lg:text-2xl">
          Mensualidades
        </h1>
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
          <Input
            id="valor-global"
            label="Valor global de la mensualidad"
            type="text"
            inputMode="decimal"
            value={valorGlobal}
            onChange={(e) => setValorGlobal(e.target.value)}
            disabled={configLoading}
            className="w-40"
          />
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={guardarConfig}
            disabled={configSaving || configLoading}
          >
            {configSaving ? 'Guardando…' : 'Guardar'}
          </Button>

          <div className="ml-auto flex items-center gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              aria-label="Mes anterior"
              onClick={() => setMes((m) => addMonthsYm(m, -1))}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </Button>
            <span className="min-w-[11rem] text-center font-semibold capitalize text-dojo-dorado">
              {mesTituloEs(mes)}
            </span>
            <Button
              type="button"
              variant="primary"
              size="sm"
              aria-label="Mes siguiente"
              onClick={() => setMes((m) => addMonthsYm(m, 1))}
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      </header>

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

      {/* ── Table / Cards section ── */}
      <Card className="mb-4 md:mb-5">
        {listaLoading ? (
          <div className="space-y-3 py-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-4/5" />
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-3 lg:hidden">
              {filas.map((row) => {
                const pagado = row.mensualidad?.pagado === true;
                const enMora = row.enMora === true && !pagado;
                return (
                  <div
                    key={row.karatecaId}
                    className="rounded-lg border border-dojo-dorado/20 bg-dojo-negro p-4"
                  >
                    <div className="mb-2 font-semibold text-white">
                      {row.user?.nombre ?? `#${row.karatecaId}`}
                    </div>
                    <div className="mb-2">
                      <KyuBadge kyu={gradoValue(row)} />
                    </div>
                    <div className="mb-2 flex flex-wrap gap-2">
                      {pagado
                        ? <Badge variant="success">✓ Pagado</Badge>
                        : <Badge variant="danger">✗ Pendiente</Badge>}
                      {enMora && <Badge variant="warning">⚠ En mora</Badge>}
                    </div>
                    <p className="mb-1 text-sm text-white/70">
                      Monto: {row.mensualidad?.monto ?? '—'}
                    </p>
                    <p className="mb-3 text-xs text-white/40">
                      {formatFechaPago(row.mensualidad?.fechaPago)}
                    </p>
                    {!pagado ? (
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        className="w-full"
                        onClick={() => abrirModalPago(row)}
                      >
                        Registrar pago
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full text-red-400 hover:text-red-300"
                        onClick={() => setAnularId(row.mensualidad.id)}
                      >
                        Anular pago
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-dojo-dorado">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dojo-dorado/70">Nombre</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dojo-dorado/70">Kyu</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dojo-dorado/70">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dojo-dorado/70">Monto</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dojo-dorado/70">Fecha de pago</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dojo-dorado/70">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((row) => {
                    const pagado = row.mensualidad?.pagado === true;
                    const enMora = row.enMora === true && !pagado;
                    return (
                      <tr key={row.karatecaId} className="border-b border-white/5 transition-colors hover:bg-white/[0.02]">
                        <td className="px-4 py-3 font-semibold text-white/90">
                          {row.user?.nombre ?? `#${row.karatecaId}`}
                        </td>
                        <td className="px-4 py-3">
                          <KyuBadge kyu={gradoValue(row)} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {pagado
                              ? <Badge variant="success">✓ Pagado</Badge>
                              : <Badge variant="danger">✗ Pendiente</Badge>}
                            {enMora && <Badge variant="warning">⚠ En mora</Badge>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-white/70">
                          {row.mensualidad?.monto ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-white/70">
                          {formatFechaPago(row.mensualidad?.fechaPago)}
                        </td>
                        <td className="px-4 py-3">
                          {!pagado ? (
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              onClick={() => abrirModalPago(row)}
                            >
                              Registrar pago
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300"
                              onClick={() => setAnularId(row.mensualidad.id)}
                            >
                              Anular pago
                            </Button>
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
      </Card>

      {/* ── Resumen ── */}
      <div className="flex flex-wrap gap-4">
        <Card className="flex-1 basis-40">
          <p className="text-xs uppercase tracking-wider text-white/40">Total pagados</p>
          <p className="mt-1 text-2xl font-bold text-dojo-dorado">{resumen.pagados}</p>
        </Card>
        <Card className="flex-1 basis-40">
          <p className="text-xs uppercase tracking-wider text-white/40">Total pendientes</p>
          <p className="mt-1 text-2xl font-bold text-red-400">{resumen.pendientes}</p>
        </Card>
        <Card className="flex-1 basis-40">
          <p className="text-xs uppercase tracking-wider text-white/40">Total recaudado</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">
            {resumen.recaudado.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </Card>
      </div>

      {/* ── Modal: Registrar pago ── */}
      <Modal
        open={Boolean(modalRow)}
        onClose={cerrarModal}
        title="Registrar pago"
      >
        <p className="mb-4 text-sm text-white/50">
          {modalRow?.user?.nombre ?? `Karateca #${modalRow?.karatecaId}`}
        </p>
        <div className="space-y-4">
          <Input
            id="modal-monto"
            label="Monto"
            type="text"
            inputMode="decimal"
            value={modalMonto}
            onChange={(e) => setModalMonto(e.target.value)}
          />
          <Input
            id="modal-fecha-pago"
            label="Fecha de pago"
            type="date"
            value={modalFecha}
            onChange={(e) => setModalFecha(e.target.value)}
          />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={modalSubmitting}
            onClick={cerrarModal}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={modalSubmitting}
            onClick={confirmarPago}
          >
            {modalSubmitting ? 'Guardando…' : 'Confirmar'}
          </Button>
        </div>
      </Modal>

      {/* ── Modal: Confirmar anular ── */}
      <Modal
        open={anularId != null}
        onClose={() => { if (!anularSubmitting) setAnularId(null); }}
        title="¿Anular pago?"
      >
        <p className="mb-5 text-sm text-white/70">
          La mensualidad quedará marcada como pendiente.
        </p>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={anularSubmitting}
            onClick={() => setAnularId(null)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={anularSubmitting}
            onClick={confirmarAnular}
          >
            {anularSubmitting ? '…' : 'Anular'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
