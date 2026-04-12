import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { Badge, Button, Card, Modal, SkeletonCard } from '../../components/ui';

function colorAsistenciaClass(p) {
  if (p >= 80) return 'text-emerald-400 font-bold';
  if (p >= 50) return 'text-amber-400 font-bold';
  return 'text-dojo-rojo font-bold';
}

function promedioGeneral(list) {
  if (!list.length) return 0;
  const sum = list.reduce((a, x) => a + x.promedio, 0);
  return Math.round(sum / list.length);
}

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
      <div className="min-h-full bg-dojo-negro p-3 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-full bg-dojo-negro p-3 md:p-6 lg:p-8">
        <div
          className="rounded-lg border border-dojo-rojo/50 bg-dojo-rojo/20 px-4 py-3 text-sm text-red-200"
          role="alert"
        >
          {error || 'Sin datos'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-dojo-negro p-3 text-white/90 md:p-6 lg:p-8">
      <h1 className="mb-4 text-lg font-semibold text-dojo-dorado md:mb-5 md:text-xl lg:text-2xl">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* 1. Karatecas */}
        <Card onClick={() => navigate('/sensei/karatecas')}>
          <p className="mb-1.5 text-sm text-white/60">Karatecas activos</p>
          <p className="text-4xl font-extrabold leading-tight text-dojo-dorado">
            {data.karatecas.total}
          </p>
          <p className="mt-2 text-sm text-white/65">
            {data.karatecas.preExamenAprobado} con pre-examen aprobado
          </p>
        </Card>

        {/* 2. Asistencia */}
        <Card onClick={() => navigate('/sensei/asistencia')}>
          <p className="mb-1.5 text-sm text-white/60">Asistencia general</p>
          <p className="mb-2.5 text-4xl font-extrabold text-dojo-dorado">{promedioDojo}%</p>
          <p className="mb-2 text-xs text-white/50">Promedio del dojo</p>
          <ul className="m-0 list-none p-0">
            {top5.map((row) => (
              <li
                key={row.karatecaId}
                className="flex items-center justify-between border-b border-white/10 py-1.5 text-sm last:border-0"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/sensei/asistencia');
                  }}
                  className="cursor-pointer border-0 bg-transparent p-0 text-left font-semibold text-dojo-dorado"
                >
                  {row.nombre}
                </button>
                <span className={colorAsistenciaClass(row.promedio)}>{row.promedio}%</span>
              </li>
            ))}
          </ul>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2.5 w-full"
            onClick={(e) => {
              e.stopPropagation();
              setModalAsistencia(true);
            }}
          >
            Ver todos
          </Button>
        </Card>

        {/* 3. Mensualidades */}
        <Card>
          <p className="mb-2.5 text-sm text-white/60">Mensualidades</p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setModalMensTipo('alDia')}
              className="min-h-[44px] w-full cursor-pointer rounded-lg bg-emerald-900/50 px-3 py-2 text-sm font-bold text-emerald-300 transition-colors hover:bg-emerald-900/70"
            >
              {data.mensualidades.alDia.length} al día
            </button>
            <button
              type="button"
              onClick={() => setModalMensTipo('unMes')}
              className="min-h-[44px] w-full cursor-pointer rounded-lg bg-amber-900/50 px-3 py-2 text-sm font-bold text-amber-300 transition-colors hover:bg-amber-900/70"
            >
              {data.mensualidades.unMes.length} deben 1 mes
            </button>
            <button
              type="button"
              onClick={() => setModalMensTipo('masDe1Mes')}
              className="min-h-[44px] w-full cursor-pointer rounded-lg bg-dojo-rojo/30 px-3 py-2 text-sm font-bold text-red-300 transition-colors hover:bg-dojo-rojo/40"
            >
              {data.mensualidades.masDe1Mes.length} deben +1 mes
            </button>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3 w-full"
            onClick={() => navigate('/sensei/mensualidades')}
          >
            Ir a mensualidades
          </Button>
        </Card>

        {/* 4. Pólizas */}
        <Card onClick={() => navigate('/sensei/polizas')}>
          <p className="mb-2.5 text-sm text-white/60">Pólizas</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="success">{data.polizas.activas} activas</Badge>
            <Badge variant="warning">{data.polizas.porVencer} por vencer</Badge>
            <Badge variant="danger">{data.polizas.vencidas} vencidas</Badge>
          </div>
        </Card>

        {/* 5. Inventario */}
        <Card onClick={() => navigate('/sensei/inventario')}>
          <p className="mb-2.5 text-sm text-white/60">Inventario</p>
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge variant="success">{data.inventario.bueno} bueno</Badge>
            <Badge variant="warning">{data.inventario.regular} regular</Badge>
            <Badge variant="danger">{data.inventario.malo} malo</Badge>
          </div>
          {data.inventario.malo > 0 && (
            <p className="text-sm font-bold text-dojo-rojo">
              ⚠ {data.inventario.malo} ítems en mal estado
            </p>
          )}
        </Card>
      </div>

      <Modal
        open={modalAsistencia}
        onClose={() => setModalAsistencia(false)}
        title="Asistencia — todos"
      >
        <ul className="m-0 list-none p-0">
          {asistenciaOrdenada.map((row) => (
            <li
              key={row.karatecaId}
              className="flex items-center justify-between border-b border-white/10 py-2 text-sm last:border-0"
            >
              <button
                type="button"
                onClick={() => {
                  setModalAsistencia(false);
                  navigate('/sensei/asistencia');
                }}
                className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-dojo-dorado"
              >
                {row.nombre}
              </button>
              <span className={colorAsistenciaClass(row.promedio)}>{row.promedio}%</span>
            </li>
          ))}
        </ul>
      </Modal>

      <Modal
        open={!!modalMensTipo}
        onClose={() => setModalMensTipo(null)}
        title={
          modalMensTipo === 'alDia'
            ? 'Al día'
            : modalMensTipo === 'unMes'
              ? 'Deben 1 mes'
              : 'Deben +1 mes'
        }
      >
        <ul className="m-0 list-none p-0">
          {mensList(modalMensTipo).map((row) => (
            <li
              key={row.karatecaId}
              className="flex items-center justify-between border-b border-white/10 py-2.5 text-sm last:border-0"
            >
              <button
                type="button"
                onClick={() => {
                  setModalMensTipo(null);
                  navigate('/sensei/mensualidades');
                }}
                className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-dojo-dorado"
              >
                {row.nombre}
              </button>
              <span className="text-white/60">{row.kyu}</span>
            </li>
          ))}
        </ul>
        {mensList(modalMensTipo).length === 0 && (
          <p className="mt-2 text-sm text-white/50">No hay karatecas en esta categoría.</p>
        )}
      </Modal>
    </div>
  );
}
