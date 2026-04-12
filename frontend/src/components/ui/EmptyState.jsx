import { Link } from 'react-router-dom';
import { Button } from './Button';

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {Icon && (
        <Icon className="mb-4 h-12 w-12 text-dojo-dorado/30" aria-hidden />
      )}
      <p className="mb-1 text-base font-semibold text-white/50">{title}</p>
      {description && (
        <p className="mx-auto max-w-xs text-sm text-white/30">{description}</p>
      )}
      {action && (
        <div className="mt-4">
          {action.to ? (
            <Link to={action.to}>
              <Button variant="ghost" size="sm">{action.label}</Button>
            </Link>
          ) : (
            <Button variant="ghost" size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
