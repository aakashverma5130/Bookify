import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, LayoutGrid, List } from 'lucide-react';
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
  const [viewMode, setViewMode]     = useState('grid'); // grid | list

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
    } catch {
      toast.error('Failed to fetch books');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    fetchBooks(query, selectedCategory, availableOnly, 1);
  }, [query, selectedCategory, availableOnly, fetchBooks]);

  useEffect(() => {
    if (query) setSearchParams({ q: query });
    else setSearchParams({});
  }, [query, setSearchParams]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchBooks(query, selectedCategory, availableOnly, next);
  };

  const handleReset = () => {
    setSelectedCategory('');
    setAvailableOnly(false);
    setQuery('');
  };

  return (
    <AppShell title={query ? `"${query}"` : 'Library Catalog'}>
      <div className="flex flex-col md:flex-row gap-6 max-w-screen-2xl">

        {/* ── Left Filter Sidebar (Stitch-style) ─────────────────── */}
        <aside className="w-full md:w-60 flex-shrink-0">
          <div
            className="sticky top-20 rounded-xl p-5"
            style={{
              background: 'var(--color-surface-container-lowest)',
              border: '1px solid var(--color-outline-variant)',
              boxShadow: '0 4px 20px rgba(26,43,75,0.04)',
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>Filters</h2>
              <button
                onClick={handleReset}
                className="text-xs font-bold transition-opacity"
                style={{ color: 'var(--color-primary)' }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.7'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              >
                Reset
              </button>
            </div>

            {/* Category filter */}
            <div className="mb-5 pb-5" style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
              <h3
                className="text-xs font-bold uppercase tracking-wider mb-3"
                style={{ color: 'var(--color-on-surface-variant)' }}
              >
                Category
              </h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer group text-sm">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === ''}
                    onChange={() => setSelectedCategory('')}
                    className="h-4 w-4"
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <span style={{ color: 'var(--color-on-surface)' }}>All Categories</span>
                </label>
                {categories.map(c => (
                  <label key={c.category_id} className="flex items-center gap-2.5 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === String(c.category_id)}
                      onChange={() => setSelectedCategory(String(c.category_id))}
                      className="h-4 w-4"
                      style={{ accentColor: 'var(--color-primary)' }}
                    />
                    <span style={{ color: 'var(--color-on-surface)' }}>{c.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Availability filter */}
            <div>
              <h3
                className="text-xs font-bold uppercase tracking-wider mb-3"
                style={{ color: 'var(--color-on-surface-variant)' }}
              >
                Availability
              </h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="availability"
                    checked={!availableOnly}
                    onChange={() => setAvailableOnly(false)}
                    className="h-4 w-4"
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <span style={{ color: 'var(--color-on-surface)' }}>All Materials</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="availability"
                    checked={availableOnly}
                    onChange={() => setAvailableOnly(true)}
                    className="h-4 w-4"
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <span style={{ color: 'var(--color-on-surface)' }}>In Stock Only</span>
                </label>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main Content ────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Search + Sort bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1 group">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--color-on-surface-variant)' }}
              />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search title, author, ISBN or subject..."
                className="input pl-12 pr-10 py-3 rounded-xl"
                style={{ fontSize: '0.9375rem' }}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--color-on-surface-muted)' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className="p-2.5 rounded-lg transition-colors"
                style={{
                  background: viewMode === 'grid' ? 'var(--color-surface-container-low)' : 'transparent',
                  color: viewMode === 'grid' ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
                }}
                title="Grid view"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className="p-2.5 rounded-lg transition-colors"
                style={{
                  background: viewMode === 'list' ? 'var(--color-surface-container-low)' : 'transparent',
                  color: viewMode === 'list' ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
                }}
                title="List view"
              >
                <List size={16} />
              </button>
            </div>
          </div>

          {/* Results header */}
          {pagination && !loading && (
            <div
              className="flex justify-between items-center mb-5 pb-4"
              style={{ borderBottom: '1px solid var(--color-outline-variant)' }}
            >
              <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                Showing <strong style={{ color: 'var(--color-on-surface)' }}>{books.length}</strong> of{' '}
                <strong style={{ color: 'var(--color-on-surface)' }}>{pagination.total}</strong> results
                {query && <> for <em>"{query}"</em></>}
              </p>
            </div>
          )}

          {/* Grid */}
          {loading && page === 1 ? (
            <SkeletonLoader variant="book-card" count={12} />
          ) : (
            <>
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
                  : 'flex flex-col gap-3'
              }>
                {books.map((book, i) => (
                  <BookCard
                    key={book.book_id}
                    book={book}
                    delay={i * 0.04}
                    onClick={() => navigate(`/books/${book.book_id}`)}
                    compact={viewMode === 'list'}
                  />
                ))}
              </div>

              {/* Load more */}
              {pagination && page < pagination.pages && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="px-8 py-2.5 rounded-full text-sm font-semibold transition-opacity"
                    style={{
                      background: 'transparent',
                      color: 'var(--color-primary)',
                      border: '1px solid var(--color-outline-variant)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.background = 'var(--color-surface-container-low)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-outline-variant)'; e.currentTarget.style.background = 'transparent'; }}
                  >
                    {loading
                      ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                      : 'Load more'}
                  </button>
                </div>
              )}

              {books.length === 0 && !loading && (
                <div className="flex flex-col items-center py-20 gap-3" style={{ color: 'var(--color-on-surface-muted)' }}>
                  <Search size={48} style={{ color: 'var(--color-outline-variant)' }} />
                  <p className="text-sm">No books found{query && ` for "${query}"`}. Try a different search.</p>
                  {query && (
                    <button onClick={() => setQuery('')} className="btn-secondary btn text-xs mt-1">
                      Clear search
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default BookSearchPage;
