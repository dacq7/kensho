export function Input({ id, label, error, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-white/80">
          {label}
        </label>
      )}
      <input
        id={id}
        className={[
          'w-full rounded-md bg-dojo-surface px-3 py-2 text-sm text-white',
          'border placeholder:text-white/30',
          'outline-none transition-colors',
          'focus:border-dojo-dorado focus:ring-2 focus:ring-dojo-dorado/30',
          error ? 'border-dojo-rojo' : 'border-white/20',
        ].join(' ')}
        {...props}
      />
      {error && <p className="text-xs text-dojo-rojo">{error}</p>}
    </div>
  );
}
