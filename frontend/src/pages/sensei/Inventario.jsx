import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import api from '../../lib/api';

const DOJO = { negro: '#111111', rojo: '#CC0000', dorado: '#C9A84C' };

const CAT = {
  PROTECCION: { label: 'Protección', bg: '#1e3a5f', color: '#a8d4ff' },
  INSTRUMENTO: { label: 'Instrumento', bg: '#4a1e5f', color: '#e0b8ff' },
};

const EST = {
  BUENO: { label: 'Bueno', bg: '#1a4d2e', color: '#9af7b8' },
  REGULAR: { label: 'Regular', bg: '#7a4b00', color: '#ffd08a' },
  MALO: { label: 'Malo', bg: 'rgba(204,0,0,0.45)', color: '#ffcccc' },
};

function badgeCat(categoria) {
  const c = CAT[categoria] || { label: categoria, bg: '#444', color: '#ddd' };
  return (
    <span
      style={{
        background: c.bg,
        color: c.color,
        padding: '0.2rem 0.55rem',
        borderRadius: 999,
        fontSize: '0.74rem',
        fontWeight: 600,
      }}
    >
      {c.label}
    </span>
  );
}

function badgeEst(estado) {
  const e = EST[estado] || { label: estado, bg: '#444', color: '#ddd' };
  return (
    <span
      style={{
        background: e.bg,
        color: e.color,
        padding: '0.2rem 0.55rem',
        borderRadius: 999,
        fontSize: '0.74rem',
        fontWeight: 600,
      }}
    >
      {e.label}
    </span>
  );
}

const emptyForm = {
  nombre: '',
  categoria: 'PROTECCION',
  cantidad: '',
  estado: 'BUENO',
  notas: '',
};

export default function SenseiInventarioPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/inventario');
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo cargar el inventario');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resumen = useMemo(() => {
    const total = items.length;
    const malos = items.filter((i) => i.estado === 'MALO').length;
    return { total, malos };
  }, [items]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
    setError(null);
    setSuccess(null);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      nombre: row.nombre ?? '',
      categoria: row.categoria ?? 'PROTECCION',
      cantidad: String(row.cantidad ?? ''),
      estado: row.estado ?? 'BUENO',
      notas: row.notas ?? '',
    });
    setModalOpen(true);
    setError(null);
    setSuccess(null);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const guardar = async () => {
    const cantidadNum = Number.parseInt(String(form.cantidad), 10);
    if (!form.nombre?.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    if (Number.isNaN(cantidadNum) || cantidadNum < 0) {
      setError('La cantidad debe ser un número entero válido');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        categoria: form.categoria,
        cantidad: cantidadNum,
        estado: form.estado,
        notas: form.notas?.trim() || undefined,
      };
      if (editingId != null) {
        await api.put(`/inventario/${editingId}`, payload);
        setSuccess('Ítem actualizado');
      } else {
        await api.post('/inventario', payload);
        setSuccess('Ítem creado');
      }
      closeModal();
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (row) => {
    const ok = window.confirm('¿Eliminar este ítem del inventario?');
    if (!ok) return;
    setDeletingId(row.id);
    setError(null);
    setSuccess(null);
    try {
      await api.delete(`/inventario/${row.id}`);
      setSuccess('Ítem eliminado');
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ minHeight: '100%', background: DOJO.negro, color: '#eee', padding: '1.5rem' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          borderBottom: `2px solid ${DOJO.dorado}`,
          paddingBottom: '0.85rem',
          marginBottom: '1.25rem',
        }}
      >
        <h1 style={{ margin: 0, color: DOJO.dorado, fontSize: '1.5rem' }}>Inventario del Dojo</h1>
        <button
          type="button"
          onClick={openCreate}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            border: 'none',
            borderRadius: 8,
            background: DOJO.rojo,
            color: '#fff',
            fontWeight: 700,
            padding: '0.45rem 0.9rem',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          <Plus size={18} />
          Agregar ítem
        </button>
      </header>

      {error && (
        <div
          style={{
            background: 'rgba(204,0,0,0.2)',
            border: `1px solid ${DOJO.rojo}`,
            color: '#ffd0d0',
            padding: '0.65rem 1rem',
            borderRadius: 6,
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
            borderRadius: 6,
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
          borderRadius: 8,
          padding: '1rem',
          marginBottom: '1rem',
        }}
      >
        {loading ? (
          <p style={{ color: '#888', margin: 0 }}>Cargando…</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${DOJO.dorado}`, color: DOJO.dorado, textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem' }}>Nombre</th>
                  <th style={{ padding: '0.5rem' }}>Categoría</th>
                  <th style={{ padding: '0.5rem' }}>Cantidad</th>
                  <th style={{ padding: '0.5rem' }}>Estado</th>
                  <th style={{ padding: '0.5rem' }}>Notas</th>
                  <th style={{ padding: '0.5rem' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #333' }}>
                    <td style={{ padding: '0.55rem 0.5rem', fontWeight: 600 }}>{row.nombre}</td>
                    <td style={{ padding: '0.55rem 0.5rem' }}>{badgeCat(row.categoria)}</td>
                    <td style={{ padding: '0.55rem 0.5rem', color: '#ccc' }}>{row.cantidad}</td>
                    <td style={{ padding: '0.55rem 0.5rem' }}>{badgeEst(row.estado)}</td>
                    <td style={{ padding: '0.55rem 0.5rem', color: '#aaa', maxWidth: '14rem' }}>
                      {row.notas || '—'}
                    </td>
                    <td style={{ padding: '0.55rem 0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          title="Editar"
                          style={{
                            border: '1px solid #555',
                            borderRadius: 6,
                            background: '#262626',
                            color: '#ddd',
                            padding: '0.3rem 0.5rem',
                            cursor: 'pointer',
                          }}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminar(row)}
                          disabled={deletingId === row.id}
                          title="Eliminar"
                          style={{
                            border: '1px solid #8a1f1f',
                            borderRadius: 6,
                            background: 'rgba(204,0,0,0.25)',
                            color: '#ffb0b0',
                            padding: '0.3rem 0.5rem',
                            cursor: deletingId === row.id ? 'not-allowed' : 'pointer',
                            opacity: deletingId === row.id ? 0.6 : 1,
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1.25rem',
          alignItems: 'center',
          background: '#1a1a1a',
          border: `1px solid ${DOJO.dorado}`,
          borderRadius: 8,
          padding: '0.85rem 1.1rem',
        }}
      >
        <div>
          <div style={{ fontSize: '0.75rem', color: '#999' }}>Total de ítems</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: DOJO.dorado }}>{resumen.total}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#999' }}>Total en estado malo</div>
          <div
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: resumen.malos > 0 ? '#ff6b6b' : '#ccc',
              background: resumen.malos > 0 ? 'rgba(204,0,0,0.15)' : 'transparent',
              borderRadius: 6,
              padding: resumen.malos > 0 ? '0.2rem 0.5rem' : 0,
              display: 'inline-block',
            }}
          >
            {resumen.malos}
            {resumen.malos > 0 && (
              <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>⚠ Hay ítems en mal estado</span>
            )}
          </div>
        </div>
      </section>

      {modalOpen && (
        <div
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '1rem',
          }}
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-labelledby="inv-modal-title"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '26rem',
              background: DOJO.negro,
              border: `2px solid ${DOJO.dorado}`,
              borderRadius: 10,
              padding: '1.1rem',
            }}
          >
            <h2 id="inv-modal-title" style={{ margin: '0 0 1rem', color: DOJO.dorado, fontSize: '1.1rem' }}>
              {editingId != null ? 'Editar ítem' : 'Agregar ítem'}
            </h2>

            <label style={{ display: 'block', marginBottom: '0.65rem' }}>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#bbb', marginBottom: '0.25rem' }}>
                Nombre *
              </span>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0.45rem',
                  borderRadius: 6,
                  border: `1px solid ${DOJO.rojo}`,
                  background: '#0f0f0f',
                  color: '#fff',
                }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: '0.65rem' }}>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#bbb', marginBottom: '0.25rem' }}>
                Categoría
              </span>
              <select
                value={form.categoria}
                onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0.45rem',
                  borderRadius: 6,
                  border: `1px solid ${DOJO.rojo}`,
                  background: '#0f0f0f',
                  color: '#fff',
                }}
              >
                <option value="PROTECCION">Protección</option>
                <option value="INSTRUMENTO">Instrumento</option>
              </select>
            </label>

            <label style={{ display: 'block', marginBottom: '0.65rem' }}>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#bbb', marginBottom: '0.25rem' }}>
                Cantidad * (entero ≥ 0)
              </span>
              <input
                type="number"
                min={0}
                step={1}
                value={form.cantidad}
                onChange={(e) => setForm((f) => ({ ...f, cantidad: e.target.value }))}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0.45rem',
                  borderRadius: 6,
                  border: `1px solid ${DOJO.rojo}`,
                  background: '#0f0f0f',
                  color: '#fff',
                }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: '0.65rem' }}>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#bbb', marginBottom: '0.25rem' }}>
                Estado
              </span>
              <select
                value={form.estado}
                onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0.45rem',
                  borderRadius: 6,
                  border: `1px solid ${DOJO.rojo}`,
                  background: '#0f0f0f',
                  color: '#fff',
                }}
              >
                <option value="BUENO">Bueno</option>
                <option value="REGULAR">Regular</option>
                <option value="MALO">Malo</option>
              </select>
            </label>

            <label style={{ display: 'block', marginBottom: '1rem' }}>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#bbb', marginBottom: '0.25rem' }}>
                Notas
              </span>
              <textarea
                value={form.notas}
                onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
                rows={3}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0.45rem',
                  borderRadius: 6,
                  border: `1px solid ${DOJO.rojo}`,
                  background: '#0f0f0f',
                  color: '#fff',
                  resize: 'vertical',
                }}
              />
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 6,
                  border: '1px solid #555',
                  background: 'transparent',
                  color: '#ccc',
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardar}
                disabled={saving}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 6,
                  border: 'none',
                  background: DOJO.rojo,
                  color: '#fff',
                  fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.75 : 1,
                }}
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
