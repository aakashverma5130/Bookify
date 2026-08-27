import { useState, useEffect } from 'react';

/**
 * useReducedMotion — respects the OS/browser `prefers-reduced-motion` media query.
 * Pass the result to Framer Motion's `animate` or use it to skip GSAP animations.
 *
 * @returns {boolean} true if the user prefers reduced motion
 */
const useReducedMotion = () => {
  const [prefersReduced, setPrefersReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
};

export default useReducedMotion;
