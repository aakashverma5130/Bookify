import { motion } from 'framer-motion';

/**
 * ProgressRing — animated SVG ring showing days remaining for a borrowed book.
 * Green when safe, yellow when due soon, red when overdue.
 */
const ProgressRing = ({ daysRemaining, totalDays = 15, size = 64, strokeWidth = 5 }) => {
  const radius   = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress  = Math.max(0, Math.min(1, daysRemaining / totalDays));
  const dashOffset = circumference * (1 - progress);

  const color =
    daysRemaining <= 0 ? 'var(--color-danger)' :
    daysRemaining <= 3 ? 'var(--color-danger)' :
    daysRemaining <= 7 ? 'var(--color-warning)' :
    'var(--color-success)';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-outline-variant)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        />
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-bold" style={{ color }}>
          {daysRemaining <= 0 ? 'DUE' : daysRemaining}
        </span>
        {daysRemaining > 0 && (
          <span className="text-[9px]" style={{ color: 'var(--color-on-surface-muted)' }}>days</span>
        )}
      </div>
    </div>
  );
};

export default ProgressRing;
