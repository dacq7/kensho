export function Card({ children, onClick, className = '' }) {
  const interactive = typeof onClick === 'function';

  return (
    <div
      onClick={onClick}
      className={[
        'rounded-xl border border-dojo-dorado/20 bg-dojo-surface p-4',
        'transition-all duration-200',
        interactive
          ? 'cursor-pointer hover:-translate-y-0.5 hover:border-dojo-dorado/50 hover:shadow-lg hover:shadow-dojo-dorado/10'
          : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}
