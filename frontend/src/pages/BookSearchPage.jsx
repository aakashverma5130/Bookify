import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AppShell from '../components/AppShell';
import BookCard from '../components/BookCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { bookApi } from '../services/apiServices';
import toast from 'react-hot-toast';

const BookSearchPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery]           = useState(searchParams.get('q') || '');
  const [books, setBooks]           = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [page, setPage]             = useState(1);
  const [pagination, setPagination] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('');
  const [availableOnly, setAvailableOnly]       = useState(false);

  useEffect(() => {
    bookApi.getCategories().then(r => setCategories(r.data)).catch(() => {});
  }, []);

  const fetchBooks = useCallback(async (q, cat, avail, p = 1) => {
    setLoading(true);
    try {
      let res;
      if (q && q.trim().length >= 2) {
        res = await bookApi.search({ q, category: cat || undefined, available: avail || undefined, page: p });
      } else {
        res = await bookApi.getBooks({ category: cat || undefined, available: avail || undefined, page: p });
      }
      setBooks(p === 1 ? res.data.books : prev => [...prev, ...res.data.books]);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to fetch books');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial and search-change fetch
  useEffect(() => {
    setPage(1);
    fetchBooks(query, selectedCategory, availableOnly, 1);
  }, [query, selectedCategory, availableOnly, fetchBooks]);

  // Sync URL
  useEffect(() => {
    if (query) { setSearchParams({ q: query }); }
    else { setSearchParams({}); }
  }, [query, setSearchParams]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchBooks(query, selectedCategory, availableOnly, next);
  };

  return (
    <AppShell title={query ? `Search: "${query}"` : 'Book Catalog'}>
      {/* Search bar */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search books, authors, ISBN…"
            className="input pl-11 py-3"
          />
          {query && (
            <button onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className={`btn-secondary btn flex items-center gap-2 px-4 ${showFilters ? 'bg-primary-900 border-primary-500' : ''}`}
        >
          <SlidersHorizontal size={15} />
          Filters
        </button>
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            className="card mb-6 flex flex-wrap gap-4"
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Category</label>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="input py-2 text-xs min-w-40"
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c.category_id} value={c.category_id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={e => setAvailableOnly(e.target.checked)}
                  className="accent-primary-500"
                />
                Available copies only
              </label>
            </div>
            <button
              onClick={() => { setSelectedCategory(''); setAvailableOnly(false); }}
              className="btn-ghost btn text-xs self-end"
            >
              Clear Filters
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results count */}
      {pagination && !loading && (
        <p className="text-xs text-slate-500 mb-4">
          {pagination.total} book{pagination.total !== 1 ? 's' : ''} found
          {query && ` for "${query}"`}
        </p>
      )}

      {/* Grid */}
      {loading && page === 1 ? (
        <SkeletonLoader variant="book-card" count={12} />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {books.map((book, i) => (
              <BookCard
                key={book.book_id}
                book={book}
                delay={i * 0.05}
                onClick={() => navigate(`/books/${book.book_id}`)}
              />
            ))}
          </div>

          {/* Load more */}
          {pagination && page < pagination.pages && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="btn-secondary btn"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : 'Load More'}
              </button>
            </div>
          )}

          {books.length === 0 && !loading && (
            <div className="flex flex-col items-center py-20 gap-3 text-slate-400">
              <Search size={48} className="text-slate-600" />
              <p>No books found. Try a different search.</p>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
};

export default BookSearchPage;
