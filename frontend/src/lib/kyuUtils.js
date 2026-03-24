import { createElement } from 'react';

export const GRADO_ORDER = [
  '8kyu', 'pinta_7kyu', '7kyu', 'pinta_6kyu', '6kyu',
  'pinta_5kyu', '5kyu', 'pinta_4kyu', '4kyu', 'pinta_3kyu',
  '3kyu', '2kyu', '1kyu', '1dan', '2dan', '3dan',
  '4dan', '5dan', '6dan', '7dan', '8dan', '9dan'
];

export const GRADO_INFO = {
  '8kyu':      { label: 'Blanco',        color: '#FFFFFF', textColor: '#333333', border: '#cccccc' },
  'pinta_7kyu':{ label: 'Pinta Celeste', color: '#ADD8E6', textColor: '#333333', mitad: '#FFFFFF' },
  '7kyu':      { label: 'Celeste',       color: '#ADD8E6', textColor: '#333333' },
  'pinta_6kyu':{ label: 'Pinta Amarillo',color: '#FFD700', textColor: '#333333', mitad: '#ADD8E6' },
  '6kyu':      { label: 'Amarillo',      color: '#FFD700', textColor: '#333333' },
  'pinta_5kyu':{ label: 'Pinta Naranja', color: '#FFA500', textColor: '#FFFFFF', mitad: '#FFD700' },
  '5kyu':      { label: 'Naranja',       color: '#FFA500', textColor: '#FFFFFF' },
  'pinta_4kyu':{ label: 'Pinta Verde',   color: '#32CD32', textColor: '#FFFFFF', mitad: '#FFA500' },
  '4kyu':      { label: 'Verde',         color: '#32CD32', textColor: '#FFFFFF' },
  'pinta_3kyu':{ label: 'Pinta Azul',    color: '#4169E1', textColor: '#FFFFFF', mitad: '#32CD32' },
  '3kyu':      { label: 'Azul',          color: '#4169E1', textColor: '#FFFFFF' },
  '2kyu':      { label: 'Violeta',       color: '#8A2BE2', textColor: '#FFFFFF' },
  '1kyu':      { label: 'Marrón',        color: '#8B4513', textColor: '#FFFFFF' },
  '1dan':      { label: 'Negro 1° Dan',  color: '#111111', textColor: '#C9A84C' },
  '2dan':      { label: 'Negro 2° Dan',  color: '#111111', textColor: '#C9A84C' },
  '3dan':      { label: 'Negro 3° Dan',  color: '#111111', textColor: '#C9A84C' },
  '4dan':      { label: 'Negro 4° Dan',  color: '#111111', textColor: '#C9A84C' },
  '5dan':      { label: 'Negro 5° Dan',  color: '#111111', textColor: '#C9A84C' },
  '6dan':      { label: 'Negro 6° Dan',  color: '#111111', textColor: '#C9A84C' },
  '7dan':      { label: 'Negro 7° Dan',  color: '#111111', textColor: '#C9A84C' },
  '8dan':      { label: 'Negro 8° Dan',  color: '#111111', textColor: '#C9A84C' },
  '9dan':      { label: 'Negro 9° Dan',  color: '#111111', textColor: '#C9A84C' },
};

export const KyuBadge = ({ kyu }) => {
  const info = GRADO_INFO[kyu] || GRADO_INFO['8kyu'];
  if (info.mitad) {
    return createElement('span', {
      style: {
        background: `linear-gradient(to right, ${info.mitad} 50%, ${info.color} 50%)`,
        color: '#333333',
        border: '1px solid #ccc',
        padding: '2px 10px',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600',
        display: 'inline-block'
      }
    }, info.label);
  }
  return createElement('span', {
    style: {
      backgroundColor: info.color,
      color: info.textColor,
      border: `1px solid ${info.border || info.color}`,
      padding: '2px 10px',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '600',
      display: 'inline-block'
    }
  }, info.label);
};
