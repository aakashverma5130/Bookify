/**
 * Badge — status badge with color variants.
 * Variants: available, issued, due-soon, overdue, warning, info, neutral, high, medium, low
 */
const Badge = ({ children, variant = 'neutral', className = '' }) => {
  const classes = {
    available: 'badge badge-available',
    issued:    'badge badge-issued',
    'due-soon': 'badge badge-due-soon',
    overdue:   'badge badge-overdue',
    warning:   'badge',
    info:      'badge',
    neutral:   'badge',
    high:      'badge',
    medium:    'badge',
    low:       'badge',
  }[variant] || 'badge';

  const inlineStyles = {
    warning: { background: 'var(--color-warning-container)', color: 'var(--color-warning)', border: '1px solid color-mix(in srgb, var(--color-warning) 30%, transparent)' },
    info:    { background: 'var(--color-secondary-container)', color: 'var(--color-secondary)', border: '1px solid color-mix(in srgb, var(--color-secondary) 30%, transparent)' },
    neutral: { background: 'var(--color-surface-container)', color: 'var(--color-on-surface-variant)', border: '1px solid var(--color-outline-variant)' },
    high:    { background: 'var(--color-danger-container)', color: 'var(--color-danger)', border: '1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)' },
    medium:  { background: 'var(--color-warning-container)', color: 'var(--color-warning)', border: '1px solid color-mix(in srgb, var(--color-warning) 30%, transparent)' },
    low:     { background: 'var(--color-success-container)', color: 'var(--color-success)', border: '1px solid color-mix(in srgb, var(--color-success) 30%, transparent)' },
  }[variant];

  return (
    <span
      className={`${classes} ${className}`}
      style={inlineStyles || undefined}
    >
      {children}
    </span>
  );
};

export default Badge;
