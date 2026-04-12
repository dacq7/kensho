import { Pencil, ToggleLeft, ToggleRight, Trash2, Users } from 'lucide-react';
import { GRADO_INFO } from '../../lib/kyuUtils';
import { Badge, Button, EmptyState } from '../ui';

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

function formatoDocumento(user) {
  if (!user?.numeroDocumento) return '—';
  return [user.tipoDocumento, user.numeroDocumento].filter(Boolean).join(' ');
}

export default function KaratecasCards({ rows, loading, onEdit, onToggleActivo, onEliminar }) {
  if (loading) {
    return (
      <div className="space-y-3 lg:hidden">
        <p className="py-8 text-center text-white/50">Cargando…</p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="lg:hidden">
        <EmptyState
          icon={Users}
          title="No hay karatecas"
          description="Ajusta los filtros o registra un nuevo alumno"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3 lg:hidden">
      {rows.map((row) => {
        const pe = polizaEstado(row.polizas);
        return (
          <div
            key={row.id}
            className="rounded-lg border border-dojo-dorado/25 bg-dojo-surface p-4 shadow-sm"
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={isActiveRow(row) ? 'font-medium text-white' : 'text-white/70'}>
                {row.user?.nombre}
              </span>
              {!isActiveRow(row) && <Badge variant="muted">Inactivo</Badge>}
            </div>

            <p className="mb-2 text-sm text-white/65">
              <span className="text-white/45">Documento: </span>
              {formatoDocumento(row.user)}
            </p>

            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="gold">{gradoLabel(gradoValue(row))}</Badge>
              {row.preExamenAprobado ? (
                <Badge variant="gold">Pre-examen ✓</Badge>
              ) : (
                <Badge variant="muted">Sin pre-examen</Badge>
              )}
            </div>

            <div className="mb-3 text-sm">
              {pe === 'sin' && <span className="text-white/40">Sin póliza</span>}
              {pe === 'activa' && <Badge variant="success">Póliza activa</Badge>}
              {pe === 'vencida' && <Badge variant="danger">Póliza vencida</Badge>}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 sm:flex-initial"
                onClick={() => onEdit(row)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 sm:flex-initial"
                onClick={() => onToggleActivo(row)}
                title={isActiveRow(row) ? 'Desactivar' : 'Activar'}
              >
                {isActiveRow(row) ? (
                  <ToggleLeft className="h-3.5 w-3.5 text-white/50" />
                ) : (
                  <ToggleRight className="h-3.5 w-3.5 text-emerald-400" />
                )}
                {isActiveRow(row) ? 'Desactivar' : 'Activar'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-1 sm:flex-initial"
                onClick={() => onEliminar(row)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
