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

export default function KaratecasTable({ rows, loading, onEdit, onToggleActivo, onEliminar }) {
  return (
    <div className="hidden overflow-hidden rounded-lg border border-dojo-dorado/20 bg-dojo-surface lg:block">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead>
            <tr className="border-b border-dojo-dorado/25 bg-dojo-negro text-dojo-dorado">
              <th className="px-4 py-3 font-semibold">Nombre</th>
              <th className="px-4 py-3 font-semibold">Documento</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Teléfono</th>
              <th className="px-4 py-3 font-semibold">Kyu actual</th>
              <th className="px-4 py-3 font-semibold">Pre-examen</th>
              <th className="px-4 py-3 font-semibold">Póliza</th>
              <th className="px-4 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-white/50">
                  Cargando…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState
                    icon={Users}
                    title="No hay karatecas"
                    description="Ajusta los filtros o registra un nuevo alumno"
                  />
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const pe = polizaEstado(row.polizas);
                return (
                  <tr
                    key={row.id}
                    className={[
                      'hover:bg-white/[0.03]',
                      isActiveRow(row) ? '' : 'bg-white/[0.04] text-white/50',
                    ].join(' ')}
                  >
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        <span className={isActiveRow(row) ? 'text-white' : 'text-white/70'}>
                          {row.user?.nombre}
                        </span>
                        {!isActiveRow(row) && (
                          <Badge variant="muted">Inactivo</Badge>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-white/75">
                      {formatoDocumento(row.user)}
                    </td>
                    <td className="px-4 py-3 text-white/75">{row.user?.email}</td>
                    <td className="px-4 py-3 text-white/75">{row.user?.telefono || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant="gold">{gradoLabel(gradoValue(row))}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {row.preExamenAprobado ? (
                        <Badge variant="gold">Sí</Badge>
                      ) : (
                        <Badge variant="muted">No</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {pe === 'sin' && <span className="text-sm text-white/40">Sin póliza</span>}
                      {pe === 'activa' && <Badge variant="success">Activa</Badge>}
                      {pe === 'vencida' && <Badge variant="danger">Vencida</Badge>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => onEdit(row)}>
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
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
                        <Button variant="primary" size="sm" onClick={() => onEliminar(row)}>
                          <Trash2 className="h-3.5 w-3.5" />
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
