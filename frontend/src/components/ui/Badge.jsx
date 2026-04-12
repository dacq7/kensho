const variantClasses = {
  gold: 'bg-dojo-dorado/20 text-dojo-dorado border-dojo-dorado/30',
  success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  danger: 'bg-dojo-rojo/20 text-dojo-rojo border-dojo-rojo/30',
  warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  muted: 'bg-white/10 text-white/40 border-white/10',
};

export function Badge({ variant = 'muted', className = '', children }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant] ?? variantClasses.muted,
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
