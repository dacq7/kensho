import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export function Modal({ open, onClose, title, children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();

      if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const previouslyFocused = document.activeElement;
    dialogRef.current?.querySelector('button')?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={dialogRef}
        className={[
          'relative z-10 flex flex-col',
          'w-full sm:max-w-lg',
          'max-h-[90dvh] sm:max-h-[80dvh]',
          'rounded-t-2xl sm:rounded-2xl',
          'bg-dojo-surface border border-dojo-dorado/20',
          'overflow-hidden',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sticky top-0 bg-dojo-surface">
          <h2 id="modal-title" className="text-base font-semibold text-dojo-dorado">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-white/50 hover:text-dojo-dorado hover:bg-dojo-dorado/10 transition-colors"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
