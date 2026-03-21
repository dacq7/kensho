/** Orden de grados para ascensos y filtros */
export const KYU_ORDER = [
  '8kyu',
  'pinta_7kyu',
  '7kyu',
  'pinta_6kyu',
  '6kyu',
  'pinta_5kyu',
  '5kyu',
  'pinta_4kyu',
  '4kyu',
  'pinta_3kyu',
  '3kyu',
  '2kyu',
  '1kyu',
  ...Array.from({ length: 10 }, (_, i) => `${i + 1}dan`),
];

export function normalizeKyu(kyu) {
  return String(kyu ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

export function kyuLabel(kyu) {
  const n = normalizeKyu(kyu);
  if (!n) return '—';
  if (n.includes('pinta')) return n.replace(/_/g, ' ');
  if (/^\d+kyu$/.test(n)) return n;
  if (/^\d+dan$/.test(n)) return n.replace('dan', ' dan');
  return kyu;
}

/** Opciones de grado estrictamente superiores al actual */
export function getHigherKyuOptions(current) {
  const n = normalizeKyu(current);
  const idx = KYU_ORDER.indexOf(n);
  if (idx === -1) return [...KYU_ORDER];
  return KYU_ORDER.slice(idx + 1);
}

const beltBase = 'inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold border';

export function kyuBadgeProps(kyu, dan) {
  const n = normalizeKyu(kyu);
  const danNum = typeof dan === 'number' ? dan : null;

  if (danNum != null && danNum >= 1) {
    return {
      className: `${beltBase} bg-[#111111] text-[#C9A84C] border-[#C9A84C]/50`,
      label: `${danNum} dan`,
      style: undefined,
    };
  }

  if (/^\d+dan$/.test(n)) {
    const d = parseInt(n, 10);
    return {
      className: `${beltBase} bg-[#111111] text-[#C9A84C] border-[#C9A84C]/50`,
      label: `${d} dan`,
      style: undefined,
    };
  }

  const map = {
    '8kyu': {
      className: `${beltBase} bg-white text-gray-900 border-gray-400`,
    },
    pinta_7kyu: {
      className: `${beltBase} text-gray-900 border-gray-400`,
      style: { background: 'linear-gradient(to right, #ffffff 50%, #ADD8E6 50%)' },
    },
    '7kyu': { className: `${beltBase} bg-[#ADD8E6] text-gray-900 border-[#87CEEB]` },
    pinta_6kyu: {
      className: `${beltBase} text-gray-900 border-gray-400`,
      style: { background: 'linear-gradient(to right, #ADD8E6 50%, #FFD700 50%)' },
    },
    '6kyu': { className: `${beltBase} bg-[#FFD700] text-gray-900 border-amber-600` },
    pinta_5kyu: {
      className: `${beltBase} text-gray-900 border-gray-400`,
      style: { background: 'linear-gradient(to right, #FFD700 50%, #FFA500 50%)' },
    },
    '5kyu': { className: `${beltBase} bg-[#FFA500] text-gray-900 border-orange-600` },
    pinta_4kyu: {
      className: `${beltBase} text-gray-900 border-gray-400`,
      style: { background: 'linear-gradient(to right, #FFA500 50%, #32CD32 50%)' },
    },
    '4kyu': { className: `${beltBase} bg-[#32CD32] text-gray-900 border-green-700` },
    pinta_3kyu: {
      className: `${beltBase} text-gray-900 border-gray-400`,
      style: { background: 'linear-gradient(to right, #32CD32 50%, #4169E1 50%)' },
    },
    '3kyu': { className: `${beltBase} bg-[#4169E1] text-white border-blue-800` },
    '2kyu': { className: `${beltBase} bg-[#8A2BE2] text-white border-violet-900` },
    '1kyu': { className: `${beltBase} bg-[#8B4513] text-white border-amber-900` },
  };

  const def = map[n];
  if (def) {
    return {
      ...def,
      label: kyuLabel(kyu),
    };
  }

  return {
    className: `${beltBase} bg-white/10 text-white/80 border-white/20`,
    label: kyu || '—',
    style: undefined,
  };
}
