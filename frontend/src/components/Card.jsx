import { motion } from 'framer-motion';
import useReducedMotion from '../hooks/useReducedMotion';

const cardVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

/**
 * Card — glassmorphic container with optional hover animation.
 * @param {boolean} hoverable - Enables scale/glow on hover
 * @param {number}  delay     - Stagger delay for list entrances
 */
const Card = ({ children, className = '', hoverable = false, delay = 0, onClick, ...props }) => {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={`card ${hoverable ? 'card-hover cursor-pointer' : ''} ${className}`}
      variants={reduced ? {} : cardVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.4, delay, ease: [0, 0, 0.2, 1] }}
      whileHover={hoverable && !reduced ? { y: -2 } : {}}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;
