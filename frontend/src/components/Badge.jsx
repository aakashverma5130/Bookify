/**
 * Badge — status badge with color variants.
 * Variants: available, issued, due-soon, overdue, warning, info, neutral
 */
const Badge = ({ children, variant = 'neutral', className = '' }) => {
  const classes = {
    available: 'badge badge-available',
    issued:    'badge badge-issued',
    'due-soon': 'badge badge-due-soon',
    overdue:   'badge badge-overdue',
    warning:   'badge bg-orange-500/15 text-orange-400 border border-orange-500/30',
    info:      'badge bg-accent-cyan/15 text-accent-cyan border border-cyan-500/30',
    neutral:   'badge bg-slate-500/15 text-slate-400 border border-slate-500/30',
    high:      'badge bg-danger-500/20 text-danger-400 border border-danger-400/30',
    medium:    'badge bg-warning-500/20 text-warning-400 border border-warning-400/30',
    low:       'badge bg-success-500/20 text-success-400 border border-success-400/30',
  }[variant] || 'badge bg-slate-500/15 text-slate-400';

  return <span className={`${classes} ${className}`}>{children}</span>;
};

export default Badge;
