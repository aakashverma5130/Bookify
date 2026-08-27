/**
 * SkeletonLoader — skeleton that matches the layout of real content.
 * Variants: card, book-card, table-row, list-item
 */
const SkeletonLoader = ({ variant = 'card', count = 1 }) => {
  const items = Array.from({ length: count });

  if (variant === 'book-card') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {items.map((_, i) => (
          <div key={i} className="card">
            <div className="skeleton aspect-[3/4] rounded-xl mb-4" />
            <div className="skeleton h-4 w-3/4 rounded mb-2" />
            <div className="skeleton h-3 w-1/2 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table-row') {
    return (
      <div className="space-y-3">
        {items.map((_, i) => (
          <div key={i} className="card flex gap-4 items-center py-4">
            <div className="skeleton h-10 w-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-2/3 rounded" />
              <div className="skeleton h-3 w-1/3 rounded" />
            </div>
            <div className="skeleton h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'stat') {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((_, i) => (
          <div key={i} className="card">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <div className="skeleton h-3 w-2/3 rounded" />
                <div className="skeleton h-8 w-1/2 rounded" />
              </div>
              <div className="skeleton h-10 w-10 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default: card
  return (
    <div className="space-y-4">
      {items.map((_, i) => (
        <div key={i} className="card space-y-3">
          <div className="skeleton h-5 w-1/2 rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-3/4 rounded" />
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
