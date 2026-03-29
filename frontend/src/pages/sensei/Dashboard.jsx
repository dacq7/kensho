import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

const DOJO = { negro: '#111111', rojo: '#CC0000', dorado: '#C9A84C' };

function colorAsistencia(p) {
  if (p >= 80) return '#6ecf7a';
  if (p >= 50) return '#e6c84c';
  return '#e85c5c';
}

function promedioGeneral(list) {
  if (!list.length) return 0;
  const sum = list.reduce((a, x) => a + x.promedio, 0);
  return Math.round(sum / list.length);
}

const cardBase = {
  background: '#1a1a1a',
  border: `1px solid ${DOJO.dorado}`,
  borderRadius: 12,
  padding: '1.1rem',
  cursor: 'pointer',
  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
};

export default function SenseiDashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalAsistencia, setModalAsistencia] = useState(false);
  const [modalMensTipo, setModalMensTipo] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: d } = await api.get('/dashboard/resumen');
      setData(d);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo cargar el resumen');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const asistenciaOrdenada = useMemo(() => {
    const list = data?.asistenciaPromedio ?? [];
    return [...list].sort((a, b) => b.promedio - a.promedio);
  }, [data]);

  const promedioDojo = useMemo(() => promedioGeneral(data?.asistenciaPromedio ?? []), [data]);

  const top5 = useMemo(() => asistenciaOrdenada.slice(0, 5), [asistenciaOrdenada]);

  const mensList = (tipo) => {
    if (!data?.mensualidades) return [];
    if (tipo === 'alDia') return data.mensualidades.alDia ?? [];
    if (tipo === 'unMes') return data.mensualidades.unMes ?? [];
    if (tipo === 'masDe1Mes') return data.mensualidades.masDe1Mes ?? [];
    return [];
  };

  if (loading) {
    return (
      <div style={{ padding: '1.5rem', background: DOJO.negro, color: '#ccc', minHeight: '100%' }}>
        Cargando…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '1.5rem', background: DOJO.negro, color: '#f88', minHeight: '100%' }}>
        {error || 'Sin datos'}
      </div>
    );
  }

  return (
    <div
      className="p-3 text-[#eee] md:p-6 lg:p-8"
      style={{ minHeight: '100%', background: DOJO.negro }}
    >
      <h1 className="mb-4 text-lg font-semibold md:mb-5 md:text-xl lg:text-2xl" style={{ color: DOJO.dorado }}>
        Dashboard
      </h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* 1. Karatecas */}
        <button
          type="button"
          onClick={() => navigate('/sensei/karatecas')}
          style={{
            ...cardBase,
            textAlign: 'left',
            borderColor: DOJO.dorado,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = `0 8px 24px rgba(201,168,76,0.15)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '0.35rem' }}>Karatecas activos</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: DOJO.dorado, lineHeight: 1.1 }}>
            {data.karatecas.total}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#bbb', marginTop: '0.5rem' }}>
            {data.karatecas.preExamenAprobado} con pre-examen aprobado
          </div>
        </button>

        {/* 2. Asistencia */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/sensei/asistencia')}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/sensei/asistencia')}
          style={{
            ...cardBase,
            cursor: 'pointer',
            gridColumn: 'span 1',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = `0 8px 24px rgba(201,168,76,0.12)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '0.35rem' }}>Asistencia general</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: DOJO.dorado, marginBottom: '0.65rem' }}>
            {promedioDojo}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.5rem' }}>Promedio del dojo</div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {top5.map((row) => (
              <li
                key={row.karatecaId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.25rem 0',
                  fontSize: '0.85rem',
                  borderBottom: '1px solid #2a2a2a',
                }}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/sensei/asistencia');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: DOJO.dorado,
                    cursor: 'pointer',
                    padding: 0,
                    textAlign: 'left',
                    fontWeight: 600,
                  }}
                >
                  {row.nombre}
                </button>
                <span style={{ color: colorAsistencia(row.promedio), fontWeight: 700 }}>{row.promedio}%</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setModalAsistencia(true);
            }}
            style={{
              marginTop: '0.65rem',
              width: '100%',
              border: `1px solid ${DOJO.dorado}`,
              background: 'transparent',
              color: DOJO.dorado,
              borderRadius: 8,
              padding: '0.35rem',
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            Ver todos
          </button>
        </div>

        {/* 3. Mensualidades */}
        <div
          style={{
            ...cardBase,
            cursor: 'default',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = `0 8px 24px rgba(201,168,76,0.12)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '0.65rem' }}>Mensualidades</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <button
              type="button"
              onClick={() => setModalMensTipo('alDia')}
              style={{
                border: 'none',
                borderRadius: 8,
                background: '#1a4d2e',
                color: '#b8f5c8',
                padding: '0.45rem 0.65rem',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              {data.mensualidades.alDia.length} al día
            </button>
            <button
              type="button"
              onClick={() => setModalMensTipo('unMes')}
              style={{
                border: 'none',
                borderRadius: 8,
                background: '#6b5a00',
                color: '#ffe9a0',
                padding: '0.45rem 0.65rem',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              {data.mensualidades.unMes.length} deben 1 mes
            </button>
            <button
              type="button"
              onClick={() => setModalMensTipo('masDe1Mes')}
              style={{
                border: 'none',
                borderRadius: 8,
                background: 'rgba(204,0,0,0.35)',
                color: '#ffc8c8',
                padding: '0.45rem 0.65rem',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              {data.mensualidades.masDe1Mes.length} deben +1 mes
            </button>
          </div>
          <button
            type="button"
            onClick={() => navigate('/sensei/mensualidades')}
            style={{
              marginTop: '0.75rem',
              width: '100%',
              border: `1px solid ${DOJO.rojo}`,
              background: 'transparent',
              color: '#faa',
              borderRadius: 8,
              padding: '0.35rem',
              fontSize: '0.78rem',
              cursor: 'pointer',
            }}
          >
            Ir a mensualidades
          </button>
        </div>

        {/* 4. Pólizas */}
        <button
          type="button"
          onClick={() => navigate('/sensei/polizas')}
          style={{ ...cardBase, textAlign: 'left' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = `0 8px 24px rgba(201,168,76,0.12)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '0.65rem' }}>Pólizas</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            <span style={{ background: '#1a4d2e', color: '#9f9', padding: '0.3rem 0.55rem', borderRadius: 999, fontSize: '0.78rem', fontWeight: 700 }}>
              {data.polizas.activas} activas
            </span>
            <span style={{ background: '#7a4b00', color: '#ffd08a', padding: '0.3rem 0.55rem', borderRadius: 999, fontSize: '0.78rem', fontWeight: 700 }}>
              {data.polizas.porVencer} por vencer
            </span>
            <span style={{ background: 'rgba(204,0,0,0.35)', color: '#faa', padding: '0.3rem 0.55rem', borderRadius: 999, fontSize: '0.78rem', fontWeight: 700 }}>
              {data.polizas.vencidas} vencidas
            </span>
          </div>
        </button>

        {/* 5. Inventario */}
        <button
          type="button"
          onClick={() => navigate('/sensei/inventario')}
          style={{ ...cardBase, textAlign: 'left' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = `0 8px 24px rgba(201,168,76,0.12)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '0.65rem' }}>Inventario</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <span style={{ background: '#1a4d2e', color: '#9f9', padding: '0.3rem 0.55rem', borderRadius: 999, fontSize: '0.78rem', fontWeight: 700 }}>
              {data.inventario.bueno} bueno
            </span>
            <span style={{ background: '#7a4b00', color: '#ffd08a', padding: '0.3rem 0.55rem', borderRadius: 999, fontSize: '0.78rem', fontWeight: 700 }}>
              {data.inventario.regular} regular
            </span>
            <span style={{ background: 'rgba(204,0,0,0.35)', color: '#faa', padding: '0.3rem 0.55rem', borderRadius: 999, fontSize: '0.78rem', fontWeight: 700 }}>
              {data.inventario.malo} malo
            </span>
          </div>
          {data.inventario.malo > 0 && (
            <div style={{ color: '#ff6b6b', fontSize: '0.82rem', fontWeight: 700 }}>
              ⚠ {data.inventario.malo} ítems en mal estado
            </div>
          )}
        </button>
      </div>

      {modalAsistencia && (
        <div
          role="presentation"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-0 md:p-4"
          onClick={() => setModalAsistencia(false)}
        >
          <div
            role="dialog"
            onClick={(e) => e.stopPropagation()}
            className="h-full max-h-[100dvh] w-full overflow-auto rounded-none border-0 border-[#C9A84C] p-4 md:max-h-[80vh] md:max-w-[28rem] md:rounded-xl md:border-2 md:p-[1.1rem]"
            style={{ background: DOJO.negro, borderColor: DOJO.dorado }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 style={{ margin: 0, color: DOJO.dorado, fontSize: '1.1rem' }}>Asistencia — todos</h2>
              <button
                type="button"
                onClick={() => setModalAsistencia(false)}
                className="min-h-[44px] min-w-[44px] cursor-pointer rounded-md border border-[#555] bg-transparent px-3 text-[#ccc]"
              >
                Cerrar
              </button>
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {asistenciaOrdenada.map((row) => (
                <li
                  key={row.karatecaId}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.4rem 0',
                    borderBottom: '1px solid #333',
                    fontSize: '0.88rem',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setModalAsistencia(false);
                      navigate('/sensei/asistencia');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: DOJO.dorado,
                      cursor: 'pointer',
                      fontWeight: 600,
                      padding: 0,
                    }}
                  >
                    {row.nombre}
                  </button>
                  <span style={{ color: colorAsistencia(row.promedio), fontWeight: 700 }}>{row.promedio}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {modalMensTipo && (
        <div
          role="presentation"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-0 md:p-4"
          onClick={() => setModalMensTipo(null)}
        >
          <div
            role="dialog"
            onClick={(e) => e.stopPropagation()}
            className="h-full max-h-[100dvh] w-full overflow-auto rounded-none border-0 border-[#C9A84C] p-4 md:max-h-[80vh] md:max-w-[26rem] md:rounded-xl md:border-2 md:p-[1.1rem]"
            style={{ background: DOJO.negro, borderColor: DOJO.dorado }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 style={{ margin: 0, color: DOJO.dorado, fontSize: '1.05rem' }}>
                {modalMensTipo === 'alDia' && 'Al día'}
                {modalMensTipo === 'unMes' && 'Deben 1 mes'}
                {modalMensTipo === 'masDe1Mes' && 'Deben +1 mes'}
              </h2>
              <button
                type="button"
                onClick={() => setModalMensTipo(null)}
                className="min-h-[44px] min-w-[44px] cursor-pointer rounded-md border border-[#555] bg-transparent px-3 text-[#ccc]"
              >
                Cerrar
              </button>
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {mensList(modalMensTipo).map((row) => (
                <li
                  key={row.karatecaId}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.45rem 0',
                    borderBottom: '1px solid #333',
                    fontSize: '0.88rem',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setModalMensTipo(null);
                      navigate('/sensei/mensualidades');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: DOJO.dorado,
                      cursor: 'pointer',
                      fontWeight: 600,
                      padding: 0,
                    }}
                  >
                    {row.nombre}
                  </button>
                  <span style={{ color: '#aaa' }}>{row.kyu}</span>
                </li>
              ))}
            </ul>
            {mensList(modalMensTipo).length === 0 && (
              <p style={{ color: '#888', margin: '0.5rem 0 0' }}>No hay karatecas en esta categoría.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
