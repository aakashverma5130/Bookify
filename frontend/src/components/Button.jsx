import { motion } from 'framer-motion';
import useReducedMotion from '../hooks/useReducedMotion';

/**
 * Button — unified button component. Variants: primary, secondary, danger, ghost.
 * Automatically respects prefers-reduced-motion.
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  icon: Icon,
  ...props
}) => {
  const reduced = useReducedMotion();

  const baseClass = {
    primary:   'btn-primary',
    secondary: 'btn-secondary',
    danger:    'btn-danger',
    ghost:     'btn-ghost',
  }[variant] || 'btn-primary';

  const sizeClass = { sm: 'btn-sm', md: '', lg: 'btn-lg' }[size] || '';

  return (
    <motion.button
      className={`${baseClass} ${sizeClass} ${className} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled || loading}
      whileHover={reduced ? {} : { scale: 1.02 }}
      whileTap={reduced ? {} : { scale: 0.97 }}
      transition={{ duration: 0.15 }}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon size={size === 'sm' ? 14 : 16} />
      ) : null}
      {children}
    </motion.button>
  );
};

export default Button;
