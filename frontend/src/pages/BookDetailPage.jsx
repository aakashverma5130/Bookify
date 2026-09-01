import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BookMarked,
  Download,
  MapPin,
  Library,
  Tag,
  ChevronRight,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import Button from '../components/Button';
import SkeletonLoader from '../components/SkeletonLoader';
import { bookApi, reservationApi } from '../services/apiServices';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const BookDetailPage = () => {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const { isStudent } = useAuth();

  const [book, setBook]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [reserving, setReserving] = useState(false);
  const [showEbook, setShowEbook] = useState(false);

  useEffect(() => {
    bookApi.getById(id)
      .then(r => setBook(r.data))
      .catch(() => toast.error('Book not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleReserve = async () => {
    setReserving(true);
    try {
      const res = await reservationApi.create({ bookId: id });
      toast.success(`Added to waitlist â€” position #${res.data.queuePosition}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reserve');
    } finally {
      setReserving(false);
    }
  };

  if (loading) return <AppShell><SkeletonLoader variant="card" count={3} /></AppShell>;
  if (!book)   return <AppShell><p style={{ color: 'var(--color-on-surface-variant)' }}>Book not found</p></AppShell>;

  const available = book.available_copies > 0;

  // Find the primary shelf location from the first available copy
  const primaryCopy = book.copies?.find(c => c.shelf_block) || book.copies?.[0];
  const shelfLocation = primaryCopy?.shelf_block
    ? `Block ${primaryCopy.shelf_block} Â· Rack ${primaryCopy.shelf_rack} Â· Shelf ${primaryCopy.shelf_shelf}`
    : null;

  // Bibliographic rows
  const bibRows = [
    ['ISBN', book.isbn],
    ['Publisher', book.publisher],
    ['Year', book.publication_year],
    ['Category', book.category_name],
    ['Total Copies', book.total_copies],
  ].filter(([, v]) => v);

  return (
    <AppShell title={book.title}>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 hover:underline transition-colors"
          style={{ color: 'var(--color-primary)' }}
        >
          <ArrowLeft size={14} />
          Catalog
        </button>
        {book.category_name && (
          <>
            <ChevronRight size={13} style={{ color: 'var(--color-on-surface-muted)' }} />
            <span style={{ color: 'var(--color-on-surface-variant)' }}>{book.category_name}</span>
          </>
        )}
        <ChevronRight size={13} style={{ color: 'var(--color-on-surface-muted)' }} />
        <span style={{ color: 'var(--color-on-surface)' }}>{book.title}</span>
      </nav>

      {/* Main 2-column layout: 4/8 split matching Stitch design */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

        {/* Left column â€” Cover + Actions */}
        <motion.div
          className="lg:col-span-4 flex flex-col gap-5"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Book cover */}
          <div
            className="aspect-[2/3] w-full rounded-xl overflow-hidden relative group"
            style={{
              background: 'var(--color-surface-container-low)',
              border: '1px solid var(--color-outline-variant)',
              boxShadow: '0 4px 24px rgba(26,43,75,0.06)',
            }}
          >
            {book.cover_image_url
              ? (
                <img
                  src={book.cover_image_url}
                  alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                />
              )
              : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <span className="text-7xl">ðŸ“š</span>
                  <span className="text-xs font-semibold px-4 text-center" style={{ color: 'var(--color-on-surface-variant)' }}>
                    {book.title}
                  </span>
                </div>
              )
            }
          </div>

          {/* Student action buttons */}
          {isStudent && (
            <div className="flex flex-col gap-2">
              {available ? (
                <>
                  <p
                    className="text-xs text-center px-2 py-2.5 rounded-lg"
                    style={{ background: 'color-mix(in srgb, var(--color-success) 8%, transparent)', color: 'var(--color-success)', border: '1px solid color-mix(in srgb, var(--color-success) 25%, transparent)' }}
                  >
                    âœ“ Available â€” visit the library counter to borrow
                  </p>
                </>
              ) : (
                <Button
                  className="w-full justify-center"
                  icon={BookMarked}
                  loading={reserving}
                  onClick={handleReserve}
                >
                  Join Waitlist
                </Button>
              )}

              {/* E-book fallback when no physical copies */}
              {book.ebookFallback && !available && (
                <Button
                  variant="secondary"
                  className="w-full justify-center"
                  icon={Download}
                  onClick={() => setShowEbook(true)}
                >
                  Read E-Book
                </Button>
              )}
            </div>
          )}

          {/* Availability quick stat */}
          <div
            className="rounded-xl p-4"
            style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Library size={15} style={{ color: 'var(--color-primary)' }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-on-surface-variant)' }}>
                Availability
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold font-display" style={{ color: 'var(--color-primary)' }}>
                {book.available_copies ?? 0}
              </span>
              <span className="text-base" style={{ color: 'var(--color-on-surface-variant)' }}>
                / {book.total_copies ?? 0} copies available
              </span>
            </div>
            {shelfLocation && (
              <div className="flex items-center gap-1.5 mt-3 text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
                <MapPin size={12} style={{ color: 'var(--color-on-surface-muted)', flexShrink: 0 }} />
                {shelfLocation}
              </div>
            )}
          </div>
        </motion.div>

        {/* Right column â€” Metadata, Description, Copies */}
        <motion.div
          className="lg:col-span-8 flex flex-col gap-6"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* Title block */}
          <div style={{ borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '1.5rem' }}>
            {/* Category chip */}
            {book.category_name && (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded mb-4 text-xs font-bold uppercase tracking-wider"
                style={{
                  background: 'rgba(73,80,199,0.08)',
                  color: 'var(--color-secondary)',
                }}
              >
                <Tag size={11} />
                {book.category_name}
              </div>
            )}

            <h1 className="text-3xl font-bold font-display mb-1" style={{ color: 'var(--color-primary)' }}>
              {book.title}
            </h1>
            {book.subtitle && (
              <p className="text-lg font-normal mb-4" style={{ color: 'var(--color-on-surface-variant)' }}>
                {book.subtitle}
              </p>
            )}

            {/* Key metadata row */}
            <div className="flex flex-wrap gap-x-8 gap-y-3 mt-5">
              {[
                ['Author', book.author_name || 'Unknown'],
                book.publication_year && ['Published', book.publication_year],
                book.publisher && ['Publisher', book.publisher],
              ].filter(Boolean).map(([label, val]) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-on-surface-muted)' }}>
                    {label}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                    {val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          {book.description && (
            <div>
              <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--color-primary)' }}>
                About this Book
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-on-surface-variant)' }}>
                {book.description}
              </p>
            </div>
          )}

          {/* Bibliographic data table */}
          {bibRows.length > 0 && (
            <div style={{ borderTop: '1px solid var(--color-outline-variant)', paddingTop: '1.5rem' }}>
              <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
                Bibliographic Data
              </h3>
              <div style={{ borderTop: '1px solid var(--color-outline-variant)' }}>
                {bibRows.map(([label, val], i) => (
                  <div
                    key={label}
                    className="flex py-3"
                    style={{
                      borderBottom: '1px solid var(--color-outline-variant)',
                      background: i % 2 === 1 ? 'var(--color-surface-container-lowest)' : 'transparent',
                    }}
                  >
                    <div
                      className="w-1/3 text-xs font-bold uppercase tracking-wider pl-2"
                      style={{ color: 'var(--color-on-surface-variant)' }}
                    >
                      {label}
                    </div>
                    <div className="w-2/3 text-sm" style={{ color: 'var(--color-on-surface)' }}>
                      {val}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Copy Locations table */}
          {book.copies?.length > 0 && (
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid var(--color-outline-variant)' }}
            >
              <div
                className="px-5 py-3 flex items-center gap-2"
                style={{ background: 'var(--color-surface-container-low)', borderBottom: '1px solid var(--color-outline-variant)' }}
              >
                <MapPin size={14} style={{ color: 'var(--color-primary)' }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-on-surface-variant)' }}>
                  Copy Locations ({book.copies.length})
                </span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--color-surface-container-lowest)' }}>
                    {['Accession No.', 'Location', 'Status'].map(h => (
                      <th key={h} className="px-5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-on-surface-muted)', borderBottom: '1px solid var(--color-outline-variant)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {book.copies.map((copy, i) => (
                    <tr
                      key={copy.copy_id}
                      style={{
                        borderBottom: i < book.copies.length - 1 ? '1px solid var(--color-outline-variant)' : 'none',
                        background: i % 2 === 1 ? 'var(--color-surface-container-lowest)' : 'transparent',
                      }}
                    >
                      <td className="px-5 py-3 font-mono text-xs" style={{ color: 'var(--color-on-surface)' }}>
                        {copy.accession_number}
                      </td>
                      <td className="px-5 py-3 text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
                        {copy.shelf_block
                          ? `Block ${copy.shelf_block} Â· Rack ${copy.shelf_rack} Â· Shelf ${copy.shelf_shelf}`
                          : 'â€”'
                        }
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={copy.status === 'AVAILABLE' ? 'available' : copy.status === 'ISSUED' ? 'issued' : 'overdue'}>
                          {copy.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* E-book modal */}
      <Modal isOpen={showEbook} onClose={() => setShowEbook(false)} title="E-Book Access">
        {book.ebookFallback && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
              All physical copies of <strong style={{ color: 'var(--color-on-surface)' }}>{book.title}</strong> are currently borrowed.
              You can access the e-book version instead.
            </p>
            <a
              href={book.ebookFallback.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary btn flex items-center gap-2 justify-center"
            >
              <Download size={16} /> Open E-Book
            </a>
          </div>
        )}
      </Modal>
    </AppShell>
  );
};

export default BookDetailPage;
