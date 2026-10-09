import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  /** Override full icon className (position + size + color). Defaults to variant-appropriate slate-300 style. */
  iconClassName?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** standalone: white card with border (customer pages) | inline: centered inside existing container (admin tables) | plain: no border/bg */
  variant?: 'standalone' | 'inline' | 'plain';
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  iconClassName,
  title,
  description,
  action,
  variant = 'standalone',
  className,
}: EmptyStateProps) {
  const wrapClass =
    variant === 'standalone'
      ? 'rounded-2xl border bg-white p-8 text-center'
      : variant === 'inline'
      ? 'flex min-h-52 flex-col items-center justify-center px-5 py-10 text-center'
      : 'p-8 text-center';

  const iconClass = iconClassName ?? (
    variant === 'inline'
      ? 'mb-3 h-8 w-8 text-slate-300'
      : 'mx-auto mb-4 h-11 w-11 text-slate-300'
  );

  return (
    <div className={`${wrapClass}${className ? ` ${className}` : ''}`}>
      {Icon && <Icon className={iconClass} aria-hidden="true" />}
      <p className="text-sm text-slate-600">{title}</p>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
