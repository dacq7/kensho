import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarCheck, Users } from 'lucide-react';
import api from '../../lib/api';
import { KyuBadge } from '../../lib/kyuUtils';
import { EmptyState } from '../../components/ui';

const DOJO = {
  negro: '#111111',
  rojo: '#CC0000',
  dorado: '#C9A84C',
};

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
    <div
      className="p-3 md:p-6 lg:p-8"
      style={{
        minHeight: '100%',
        background: DOJO.negro,
        color: '#f5f5f5',
      }}
    >
      <header
        className="mb-4 border-b pb-3 md:mb-6 md:pb-4"
        style={{ borderColor: DOJO.dorado }}
      >
        <h1 className="text-lg font-semibold md:text-xl lg:text-2xl" style={{ margin: 0, color: DOJO.dorado, letterSpacing: '0.02em' }}>
          Asistencia
        </h1>
        <p className="mt-1 text-sm text-[#aaa] md:text-base">{tituloFecha}</p>
      </header>

      <section
        className="mb-4 md:mb-5"
        style={{
          background: '#1a1a1a',
          border: `1px solid ${DOJO.dorado}`,
          borderRadius: '8px',
          padding: '1rem 1.25rem',
        }}
      >
        <h2 className="mb-3 text-sm md:text-base" style={{ color: DOJO.dorado }}>
          Fecha y filtro del historial
        </h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:gap-5">
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#bbb' }}>Día de asistencia</span>
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              style={{
                background: DOJO.negro,
                color: '#eee',
                border: `1px solid ${DOJO.rojo}`,
                borderRadius: '6px',
                padding: '0.5rem 0.65rem',
                fontSize: '0.95rem',
              }}
            />
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#bbb' }}>Mes del historial</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setMesHistorial((m) => addMonthsYm(m, -1))}
                className="min-h-[44px] min-w-[44px] cursor-pointer rounded-md border-0 font-bold text-white"
                style={{
                  background: DOJO.rojo,
                  padding: '0.45rem 0.65rem',
                }}
                aria-label="Mes anterior"
              >
                ←
              </button>
              <span
                style={{
                  minWidth: '11rem',
                  textAlign: 'center',
                  textTransform: 'capitalize',
                  color: DOJO.dorado,
                  fontWeight: '600',
                }}
              >
                {mesLabelEs(mesHistorial)}
              </span>
              <button
                type="button"
                onClick={() => setMesHistorial((m) => addMonthsYm(m, 1))}
                className="min-h-[44px] min-w-[44px] cursor-pointer rounded-md border-0 font-bold text-white"
                style={{
                  background: DOJO.rojo,
                  padding: '0.45rem 0.65rem',
                }}
                aria-label="Mes siguiente"
              >
                →
              </button>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div
          style={{
            background: 'rgba(204,0,0,0.15)',
            border: `1px solid ${DOJO.rojo}`,
            color: '#ffb3b3',
            padding: '0.65rem 1rem',
            borderRadius: '6px',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          style={{
            background: 'rgba(201,168,76,0.12)',
            border: `1px solid ${DOJO.dorado}`,
            color: DOJO.dorado,
            padding: '0.65rem 1rem',
            borderRadius: '6px',
            marginBottom: '1rem',
          }}
        >
          {success}
        </div>
      )}

      <section
        style={{
          background: '#1a1a1a',
          border: `1px solid ${DOJO.dorado}`,
          borderRadius: '8px',
          padding: '1rem 1.25rem',
          marginBottom: '1.25rem',
        }}
      >
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm md:text-base" style={{ margin: 0, color: DOJO.dorado }}>
            Lista del día
          </h2>
          <button
            type="button"
            onClick={guardar}
            disabled={saving || loadingLista || karatecas.length === 0}
            className="min-h-[44px] w-full rounded-md border-0 font-bold text-white sm:w-auto md:px-4"
            style={{
              background: DOJO.rojo,
              padding: '0.55rem 1.1rem',
              cursor: saving || loadingLista || karatecas.length === 0 ? 'not-allowed' : 'pointer',
              opacity: saving || loadingLista || karatecas.length === 0 ? 0.6 : 1,
            }}
          >
            {saving ? 'Guardando…' : 'Guardar asistencia'}
          </button>
        </div>

        {loadingLista ? (
          <p style={{ color: '#888' }}>Cargando…</p>
        ) : karatecas.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No hay karatecas activos"
            description="Registra alumnos para poder tomar asistencia"
          />
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {karatecas.map((row) => (
              <li
                key={row.id}
                className="flex min-h-[44px] flex-col gap-2 border-b border-[#333] py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: '600', color: '#eee' }}>{row.user?.nombre ?? `#${row.id}`}</span>
                  <KyuBadge kyu={gradoValue(row)} />
                  {row.presente !== null && row.presente !== undefined && (
                    <span style={{ fontSize: '0.7rem', color: '#888' }}>(registrado)</span>
                  )}
                </div>
                <label className="flex min-h-[44px] shrink-0 cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(draft[row.id])}
                    onChange={(e) => onTogglePresente(row.id, e.target.checked)}
                    className="h-5 w-5"
                    style={{ accentColor: DOJO.rojo }}
                  />
                  <span className="text-sm text-[#ccc]">Presente</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        style={{
          background: '#1a1a1a',
          border: `1px solid ${DOJO.dorado}`,
          borderRadius: '8px',
          padding: '1rem 1.25rem',
        }}
      >
        <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: DOJO.dorado }}>Historial de fechas con registro</h2>
        {loadingHistorial ? (
          <p style={{ color: '#888' }}>Cargando historial…</p>
        ) : fechasHistorial.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="Sin historial"
            description="No se han registrado clases aún"
          />
        ) : (
          <div className="-mx-1 overflow-x-auto md:mx-0">
            <table className="w-full min-w-[280px] border-collapse text-sm md:text-base" style={{ fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${DOJO.dorado}`, color: DOJO.dorado, textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Fecha</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Presentes</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Ausentes</th>
                </tr>
              </thead>
              <tbody>
                {fechasHistorial.map((f) => (
                  <tr
                    key={f.fecha}
                    onClick={() => seleccionarFechaHistorial(f.fecha)}
                    style={{
                      borderBottom: '1px solid #333',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(201,168,76,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <td style={{ padding: '0.55rem 0.75rem', color: '#eee' }}>{fechaLabelEs(f.fecha)}</td>
                    <td style={{ padding: '0.55rem 0.75rem', color: '#8fdf8f' }}>{f.presentes}</td>
                    <td style={{ padding: '0.55rem 0.75rem', color: '#f0a0a0' }}>{f.ausentes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
