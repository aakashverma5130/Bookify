import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, AlertTriangle, IndianRupee, BookMarked, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import SkeletonLoader from '../components/SkeletonLoader';
import { studentApi } from '../services/apiServices';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { format, differenceInDays } from 'date-fns';

const StudentHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats]     = useState(null);
  const [books, setBooks]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [dashRes, booksRes] = await Promise.all([
          studentApi.getDashboard(),
          studentApi.getCurrentBooks(),
        ]);
        setStats(dashRes.data);
        setBooks(booksRes.data.books || []);
      } catch {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'Student';

  const statCards = stats ? [
    {
      label: 'Currently Borrowed',
      value: stats.currentlyBorrowed,
      icon: BookOpen,
      iconColor: 'var(--color-primary)',
    },
    {
      label: 'Due This Week',
      value: stats.dueSoon,
      icon: Clock,
      iconColor: 'var(--color-warning)',
    },
    {
      label: 'Overdue',
      value: stats.overdue,
      icon: AlertTriangle,
      iconColor: 'var(--color-danger)',
    },
    {
      label: 'Unpaid Fines',
      value: `Rs. ${parseFloat(stats.totalUnpaidFines).toFixed(2)}`,
      icon: IndianRupee,
      iconColor: stats.totalUnpaidFines > 0 ? 'var(--color-danger)' : 'var(--color-success)',
      isString: true,
    },
  ] : [];

  return (
    <AppShell title="Dashboard">
      <div className="max-w-screen-xl">

        {/* ── Hero Section ────────────────────────────────────────── */}
        <motion.section
          className="rounded-2xl p-8 mb-8 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6"
          style={{
            background: 'var(--color-surface-container-lowest)',
            border: '1px solid var(--color-outline-variant)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Decorative background */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 80% 50%, rgba(3,22,53,0.03) 0%, transparent 70%)',
            }}
          />
          <div className="relative z-10 max-w-sm">
            <h2
              className="font-bold mb-2"
              style={{
                color: 'var(--color-primary)',
                fontSize: 'clamp(1.75rem, 4vw, 3rem)',
                letterSpacing: '-0.02em',
                lineHeight: '1.1',
              }}
            >
              Hello, {firstName}!
            </h2>
            <p className="text-base mb-6" style={{ color: 'var(--color-on-surface-variant)' }}>
              Your library at your fingertips.
              <br />
              Explore, borrow, and learn.
            </p>
            <button
              onClick={() => navigate('/student/books')}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-opacity"
              style={{ background: 'var(--color-secondary)', color: '#ffffff' }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              Explore catalog <ArrowRight size={15} />
            </button>
          </div>
          {/* Decorative illustration placeholder */}
          <div
            className="relative w-full sm:w-48 h-32 sm:h-auto flex items-center justify-center flex-shrink-0 select-none"
            aria-hidden="true"
          >
            <span style={{ fontSize: '96px', opacity: 0.08 }}>📚</span>
          </div>
        </motion.section>

        {/* ── Quick Stats ─────────────────────────────────────────── */}
        {loading ? (
          <SkeletonLoader variant="stat" count={4} />
        ) : (
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {statCards.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  className="rounded-xl p-4 text-center"
                  style={{
                    background: 'var(--color-surface-container-lowest)',
                    border: '1px solid var(--color-outline-variant)',
                  }}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.07 }}
                >
                  <div className="flex justify-center mb-2">
                    <Icon size={22} style={{ color: stat.iconColor }} />
                  </div>
                  <p
                    className="font-bold text-xl mb-1"
                    style={{ color: 'var(--color-primary)', fontSize: '1.25rem' }}
                  >
                    {stat.isString ? stat.value : stat.value}
                  </p>
                  <p
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: 'var(--color-on-surface-variant)' }}
                  >
                    {stat.label}
                  </p>
                </motion.div>
              );
            })}
          </section>
        )}

        {/* ── Currently Borrowed Books ─────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2
              className="font-bold"
              style={{ color: 'var(--color-primary)', fontSize: '1.25rem', letterSpacing: '-0.01em' }}
            >
              My Current Books
            </h2>
            <button
              onClick={() => navigate('/student/my-books')}
              className="text-sm font-medium flex items-center gap-1 transition-colors"
              style={{ color: 'var(--color-secondary)' }}
            >
              View all <ArrowRight size={14} />
            </button>
          </div>

          {loading ? (
            <SkeletonLoader variant="table-row" count={3} />
          ) : books.length === 0 ? (
            <div
              className="rounded-xl p-12 flex flex-col items-center gap-3 text-center"
              style={{
                background: 'var(--color-surface-container-lowest)',
                border: '1px solid var(--color-outline-variant)',
              }}
            >
              <BookMarked size={48} style={{ color: 'var(--color-outline-variant)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--color-on-surface-variant)' }}>
                You have no books checked out
              </p>
              <button
                onClick={() => navigate('/student/books')}
                className="mt-2 px-5 py-2 rounded-lg text-sm font-semibold transition-opacity"
                style={{ background: 'var(--color-primary)', color: '#ffffff' }}
              >
                Browse catalog
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {books.map((book, i) => {
                const daysLeft = differenceInDays(new Date(book.due_date), new Date());
                const statusColor = daysLeft < 0
                  ? 'var(--color-danger)'
                  : daysLeft <= 3
                    ? 'var(--color-warning)'
                    : 'var(--color-success)';
                const statusLabel = daysLeft < 0
                  ? `${Math.abs(daysLeft)}d overdue`
                  : daysLeft === 0
                    ? 'Due today'
                    : `${daysLeft}d left`;

                return (
                  <motion.div
                    key={book.issue_id}
                    className="flex items-center gap-4 rounded-xl p-4"
                    style={{
                      background: 'var(--color-surface-container-lowest)',
                      border: '1px solid var(--color-outline-variant)',
                    }}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.07 }}
                  >
                    {/* Cover */}
                    <div
                      className="w-12 h-16 rounded-md flex-shrink-0 overflow-hidden"
                      style={{ background: 'var(--color-surface-container-low)' }}
                    >
                      {book.cover_image_url
                        ? <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-2xl">📚</div>
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-on-surface)' }}>
                        {book.book_title}
                      </p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-on-surface-variant)' }}>
                        {book.author_name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-on-surface-muted)' }}>
                        Acc: {book.accession_number}
                      </p>
                    </div>

                    {/* Due date + status */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs" style={{ color: 'var(--color-on-surface-muted)' }}>Due date</p>
                      <p className="text-sm font-semibold" style={{ color: statusColor }}>
                        {format(new Date(book.due_date), 'dd MMM yyyy')}
                      </p>
                      <span
                        className="inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `color-mix(in srgb, ${statusColor} 12%, transparent)`, color: statusColor }}
                      >
                        {statusLabel}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
};

export default StudentHome;
