import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import useReducedMotion from '../hooks/useReducedMotion';

/**
 * BookCard — book display card with 3D tilt effect on hover.
 * Used in Search, Home recommendations, and catalog.
 */
const BookCard = ({ book, onClick, delay = 0 }) => {
  const reduced = useReducedMotion();
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), { stiffness: 300, damping: 30 });

  const handleMouseMove = (e) => {
    if (reduced || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top)  / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  const availabilityBadge = () => {
    if (book.available_copies > 0) return <span className="badge badge-available">Available</span>;
    if (book.has_ebook)            return <span className="badge badge-issued">E-Book</span>;
    return <span className="badge badge-overdue">Unavailable</span>;
  };

  return (
    <motion.div
      ref={cardRef}
      className="cursor-pointer"
      style={{ perspective: 800 }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0, 0, 0.2, 1] }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      <motion.div
        className="card card-hover h-full flex flex-col"
        style={reduced ? {} : { rotateX, rotateY, transformStyle: 'preserve-3d' }}
      >
        {/* Cover */}
        <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-4 bg-bg-600">
          {book.cover_image_url ? (
            <img
              src={book.cover_image_url}
              alt={book.title}
              className="w-full h-full object-cover transition-transform duration-500"
              style={{ transform: isHovered && !reduced ? 'scale(1.05)' : 'scale(1)' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl">📚</span>
            </div>
          )}
          <div className="absolute top-2 right-2">{availabilityBadge()}</div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2 mb-1">
            {book.title}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-1">{book.author_name || 'Unknown Author'}</p>
          {book.category_name && (
            <p className="text-xs text-primary-400 mt-1">{book.category_name}</p>
          )}
        </div>

        {/* Copies */}
        {book.total_copies !== undefined && (
          <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-xs text-slate-500">
            <span>{book.available_copies} / {book.total_copies} available</span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default BookCard;
