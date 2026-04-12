import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarCheck, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import api from '../../lib/api';
import { KyuBadge } from '../../lib/kyuUtils';
import { Button, Card, EmptyState, Input, Skeleton, SkeletonCard } from '../../components/ui';

function pad2(n) {
  return String(n).padStart(2, '0');
}

function toYmd(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
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

function gradoValue(row) {
  if (typeof row.dan === 'number' && row.dan >= 1) return `${row.dan}dan`;
  return row.kyuActual;
}

function mesLabelEs(ym) {
  const d = parseYm(ym);
  return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}

function fechaLabelEs(ymd) {
  const [y, m, day] = ymd.split('-').map(Number);
  const d = new Date(y, m - 1, day);
  const s = d.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function SenseiAsistenciaPage() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => toYmd(new Date()));
  const [mesHistorial, setMesHistorial] = useState(() => toYm(new Date()));

  const [loadingLista, setLoadingLista] = useState(true);
  const [loadingHistorial, setLoadingHistorial] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [karatecas, setKaratecas] = useState([]);
  const [draft, setDraft] = useState({});
  const [fechasHistorial, setFechasHistorial] = useState([]);

  const loadPorFecha = useCallback(async (fecha) => {
    setError(null);
    setLoadingLista(true);
    try {
      const { data } = await api.get('/asistencias/fecha', { params: { fecha } });
      const list = Array.isArray(data) ? data : [];
      setKaratecas(list);
      const d = {};
      list.forEach((k) => {
        d[k.id] = k.presente === null || k.presente === undefined ? false : Boolean(k.presente);
      });
      setDraft(d);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo cargar la asistencia de esa fecha');
      setKaratecas([]);
      setDraft({});
    } finally {
      setLoadingLista(false);
    }
  }, []);

  const loadFechas = useCallback(async (mes) => {
    setLoadingHistorial(true);
    try {
      const { data } = await api.get('/asistencias/fechas', { params: { mes } });
      setFechasHistorial(Array.isArray(data) ? data : []);
    } catch {
      setFechasHistorial([]);
    } finally {
      setLoadingHistorial(false);
    }
  }, []);

  useEffect(() => {
    loadPorFecha(fechaSeleccionada);
  }, [fechaSeleccionada, loadPorFecha]);

  useEffect(() => {
    loadFechas(mesHistorial);
  }, [mesHistorial, loadFechas]);

  const onTogglePresente = (karatecaId, checked) => {
    setDraft((prev) => ({ ...prev, [karatecaId]: checked }));
  };

  const guardar = async () => {
    setError(null);
    setSuccess(null);
    setSaving(true);
    const registros = karatecas.map((k) => ({
      karatecaId: k.id,
      presente: Boolean(draft[k.id]),
    }));
    try {
      await api.post('/asistencias', { fecha: fechaSeleccionada, registros });
      setSuccess('Asistencia guardada correctamente');
      await loadPorFecha(fechaSeleccionada);
      await loadFechas(mesHistorial);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo guardar la asistencia');
    } finally {
      setSaving(false);
    }
  };

  const seleccionarFechaHistorial = (ymd) => {
    setFechaSeleccionada(ymd);
    const ym = ymd.slice(0, 7);
    if (ym !== mesHistorial) setMesHistorial(ym);
  };

  const tituloFecha = useMemo(
    () => fechaLabelEs(fechaSeleccionada),
    [fechaSeleccionada],
  );

  return (
    <div className="min-h-full p-3 text-white/90 md:p-6 lg:p-8">
      <header className="mb-4 border-b border-dojo-dorado/25 pb-3 md:mb-6 md:pb-4">
        <h1 className="text-lg font-semibold tracking-tight text-dojo-dorado md:text-xl lg:text-2xl">
          Asistencia
        </h1>
        <p className="mt-1 text-sm text-white/50 md:text-base">{tituloFecha}</p>
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

      {/* ── Filter card ── */}
      <Card className="mb-4 md:mb-5">
        <h2 className="mb-3 text-sm font-semibold text-dojo-dorado md:text-base">
          Fecha y filtro del historial
        </h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:gap-5">
          <Input
            id="fecha-asistencia"
            label="Día de asistencia"
            type="date"
            value={fechaSeleccionada}
            onChange={(e) => setFechaSeleccionada(e.target.value)}
          />

          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-white/80">Mes del historial</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setMesHistorial((m) => addMonthsYm(m, -1))}
                aria-label="Mes anterior"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </Button>
              <span className="min-w-[11rem] text-center font-semibold capitalize text-dojo-dorado">
                {mesLabelEs(mesHistorial)}
              </span>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setMesHistorial((m) => addMonthsYm(m, 1))}
                aria-label="Mes siguiente"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Attendance list card ── */}
      <Card className="mb-4 md:mb-5">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-dojo-dorado md:text-base">
            Lista del día
          </h2>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={guardar}
            disabled={saving || loadingLista || karatecas.length === 0}
            className="w-full sm:w-auto"
          >
            {saving ? 'Guardando…' : 'Guardar asistencia'}
          </Button>
        </div>

        {loadingLista ? (
          <div className="space-y-3 py-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-4/5" />
          </div>
        ) : karatecas.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No hay karatecas activos"
            description="Registra alumnos para poder tomar asistencia"
          />
        ) : (
          <ul className="m-0 list-none p-0">
            {karatecas.map((row) => (
              <li
                key={row.id}
                className="flex min-h-[44px] flex-col gap-2 border-b border-white/10 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="flex flex-1 min-w-0 items-center gap-3">
                  <span className="font-semibold text-white/90">
                    {row.user?.nombre ?? `#${row.id}`}
                  </span>
                  <KyuBadge kyu={gradoValue(row)} />
                  {row.presente !== null && row.presente !== undefined && (
                    <span className="text-xs text-white/40">(registrado)</span>
                  )}
                </div>
                <label className="flex min-h-[44px] shrink-0 cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(draft[row.id])}
                    onChange={(e) => onTogglePresente(row.id, e.target.checked)}
                    className="h-5 w-5 accent-dojo-rojo"
                  />
                  <span className="text-sm text-white/70">Presente</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* ── History card ── */}
      <Card>
        <h2 className="mb-3 text-sm font-semibold text-dojo-dorado md:text-base">
          Historial de fechas con registro
        </h2>

        {loadingHistorial ? (
          <div className="space-y-3 py-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
          </div>
        ) : fechasHistorial.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="Sin historial"
            description="No se han registrado clases aún"
          />
        ) : (
          <div className="-mx-1 overflow-x-auto md:mx-0">
            <table className="w-full min-w-[280px] border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-dojo-dorado">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dojo-dorado/70">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dojo-dorado/70">
                    Presentes
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-dojo-dorado/70">
                    Ausentes
                  </th>
                </tr>
              </thead>
              <tbody>
                {fechasHistorial.map((f) => (
                  <tr
                    key={f.fecha}
                    onClick={() => seleccionarFechaHistorial(f.fecha)}
                    className="cursor-pointer border-b border-white/5 transition-colors hover:bg-dojo-dorado/5"
                  >
                    <td className="px-3 py-2.5 text-sm text-white/85">{fechaLabelEs(f.fecha)}</td>
                    <td className="px-3 py-2.5 text-sm font-semibold text-emerald-400">{f.presentes}</td>
                    <td className="px-3 py-2.5 text-sm font-semibold text-red-400">{f.ausentes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
