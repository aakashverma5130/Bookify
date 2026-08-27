import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import useReducedMotion from '../hooks/useReducedMotion';

/**
 * StatCounter — animated count-up number card for dashboards.
 * @param {number}  value     - Final number to count up to
 * @param {string}  label     - Card label
 * @param {node}    icon      - Lucide icon component
 * @param {string}  prefix    - e.g. "Rs. "
 * @param {string}  suffix    - e.g. " books"
 * @param {string}  color     - Tailwind text color class for the value
 */
const StatCounter = ({ value = 0, label, icon: Icon, prefix = '', suffix = '', color = 'text-primary-400', delay = 0 }) => {
  const reduced = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(0);
  const animationRef = useRef(null);

  useEffect(() => {
    if (reduced) { setDisplayValue(value); return; }

    const duration = 1200;
    const startTime = performance.now() + delay * 1000;
    let started = false;

    const animate = (currentTime) => {
      if (currentTime < startTime) { animationRef.current = requestAnimationFrame(animate); return; }
      if (!started) started = true;

      const elapsed   = currentTime - startTime;
      const progress  = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased     = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * value));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [value, reduced, delay]);

  return (
    <motion.div
      className="card card-hover"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 font-medium mb-2">{label}</p>
          <p className={`text-3xl font-bold font-display ${color}`}>
            {prefix}{displayValue.toLocaleString()}{suffix}
          </p>
        </div>
        {Icon && (
          <div className="p-3 rounded-xl bg-bg-600">
            <Icon size={22} className={color} />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatCounter;
