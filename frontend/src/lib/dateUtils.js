export function parseLocalDate(iso) {
  if (!iso) return null;
  // Parse YYYY-MM-DD without timezone conversion
  const str = typeof iso === 'string' ? iso : iso.toISOString();
  const [y, m, d] = str.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatFecha(iso, options = { day: 'numeric', month: 'long', year: 'numeric' }) {
  const d = parseLocalDate(iso);
  if (!d) return '—';
  return d.toLocaleDateString('es-ES', options);
}

export function formatFechaCorta(iso) {
  return formatFecha(iso, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatFechaHora(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}
