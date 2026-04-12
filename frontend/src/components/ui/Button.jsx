const variantClasses = {
  primary: 'bg-dojo-rojo text-white hover:bg-dojo-rojo/90 border-transparent',
  secondary: 'bg-transparent text-white border-white/20 hover:bg-white/10',
  ghost: 'bg-transparent text-dojo-dorado border-dojo-dorado/50 hover:bg-dojo-dorado/10',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2 text-sm',
};

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center gap-2',
        'rounded-md border font-medium',
        'min-h-[44px] cursor-pointer',
        'transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant] ?? variantClasses.primary,
        sizeClasses[size] ?? sizeClasses.md,
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}
