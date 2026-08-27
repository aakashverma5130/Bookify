import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, MapPin, Download, BookMarked, ArrowLeft, Users, Star } from 'lucide-react';
import AppShell from '../components/AppShell';
import Badge from '../components/Badge';
import Card from '../components/Card';
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
      toast.success(`Added to waitlist — position #${res.data.queuePosition}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reserve');
    } finally {
      setReserving(false);
    }
  };

  if (loading) return <AppShell><SkeletonLoader variant="card" count={3} /></AppShell>;
  if (!book)   return <AppShell><p className="text-slate-400">Book not found</p></AppShell>;

  const available = book.available_copies > 0;

  return (
    <AppShell title={book.title}>
      <button onClick={() => navigate(-1)} className="btn-ghost btn mb-4 text-sm">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cover column */}
        <div className="lg:col-span-1">
          <motion.div
            className="card flex flex-col items-center gap-4"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="w-full max-w-[220px] aspect-[3/4] rounded-xl overflow-hidden bg-bg-600">
              {book.cover_image_url
                ? <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-6xl">📚</div>
              }
            </div>

            {/* Availability badge */}
            <Badge variant={available ? 'available' : book.has_ebook ? 'issued' : 'overdue'}>
              {available ? `${book.available_copies} / ${book.total_copies} Available` : book.has_ebook ? 'E-Book Available' : 'Unavailable'}
            </Badge>

            {/* Actions */}
            {isStudent && (
              <div className="w-full space-y-2">
                {available ? (
                  <p className="text-xs text-slate-500 text-center">Visit the library counter to borrow this book</p>
                ) : (
                  <Button className="w-full justify-center" icon={BookMarked} loading={reserving} onClick={handleReserve}>
                    Join Waitlist
                  </Button>
                )}

                {/* E-book fallback when no copies */}
                {book.ebookFallback && !available && (
                  <Button variant="secondary" className="w-full justify-center" icon={Download}
                    onClick={() => setShowEbook(true)}>
                    Read E-Book
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* Detail column */}
        <motion.div
          className="lg:col-span-2 space-y-6"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="card">
            <h1 className="text-2xl font-bold text-white font-display mb-1">{book.title}</h1>
            <p className="text-slate-400 text-sm mb-3">by {book.author_name || 'Unknown'}</p>

            <div className="flex flex-wrap gap-2 mb-4">
              {book.category_name && <Badge variant="issued">{book.category_name}</Badge>}
              {book.publication_year && <Badge variant="neutral">{book.publication_year}</Badge>}
              {book.isbn && <Badge variant="neutral">ISBN: {book.isbn}</Badge>}
            </div>

            {book.description && (
              <p className="text-slate-300 text-sm leading-relaxed">{book.description}</p>
            )}

            {book.publisher && (
              <p className="text-xs text-slate-500 mt-3">Publisher: {book.publisher}</p>
            )}
          </div>

          {/* Copies shelf map */}
          <Card>
            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
              <MapPin size={16} className="text-primary-400" />
              Copy Locations
            </h3>
            {book.copies?.length > 0 ? (
              <div className="space-y-2">
                {book.copies.map((copy) => (
                  <div key={copy.copy_id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <span className="text-sm text-white font-mono">{copy.accession_number}</span>
                      {copy.shelf_block && (
                        <span className="text-xs text-slate-500 ml-2">
                          Block {copy.shelf_block} · Rack {copy.shelf_rack} · Shelf {copy.shelf_shelf}
                        </span>
                      )}
                    </div>
                    <Badge variant={copy.status === 'AVAILABLE' ? 'available' : copy.status === 'ISSUED' ? 'issued' : 'overdue'}>
                      {copy.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No copies registered yet</p>
            )}
          </Card>
        </motion.div>
      </div>

      {/* E-book modal */}
      <Modal isOpen={showEbook} onClose={() => setShowEbook(false)} title="E-Book Access">
        {book.ebookFallback && (
          <div className="space-y-4">
            <p className="text-slate-300 text-sm">
              All physical copies of <strong className="text-white">{book.title}</strong> are currently borrowed.
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
