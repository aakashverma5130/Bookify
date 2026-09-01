import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookMarked, Clock, AlertTriangle, RotateCcw, IndianRupee } from 'lucide-react';
import AppShell from '../components/AppShell';
import ProgressRing from '../components/ProgressRing';
import Badge from '../components/Badge';
import SkeletonLoader from '../components/SkeletonLoader';
import { studentApi, circulationApi } from '../services/apiServices';
import toast from 'react-hot-toast';
import { format, differenceInDays } from 'date-fns';

const StudentMyBooksPage = () => {
  const [books, setBooks]       = useState([]);
  const [history, setHistory]   = useState([]);
  const [fines, setFines]       = useState([]);
  const [tab, setTab]           = useState('current');
  const [loading, setLoading]   = useState(true);
  const [renewing, setRenewing] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [booksRes, histRes, finesRes] = await Promise.all([
          studentApi.getCurrentBooks(),
          studentApi.getHistory(),
          studentApi.getFines(),
        ]);
        setBooks(booksRes.data.books   || []);
        setHistory(histRes.data.history || []);
        setFines(finesRes.data.fines   || []);
      } catch { toast.error('Failed to load books'); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const handleRenew = async (issueId) => {
    setRenewing(issueId);
    try {
      const res = await circulationApi.renew(issueId);
      toast.success(`Renewed until ${res.data.newDueDate}`);
      setBooks(prev => prev.map(b =>
        b.issue_id === issueId ? { ...b, due_date: res.data.newDueDate, renewal_count: res.data.renewalCount } : b
      ));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Renewal failed');
    } finally {
      setRenewing(null);
    }
  };

  const tabs = [
    { key: 'current', label: 'Currently Borrowed', count: books.length },
    { key: 'history', label: 'History',             count: history.length },
    { key: 'fines',   label: 'Fines',               count: fines.filter(f => !f.paid).length },
  ];

  return (
    <AppShell title="My Books">
      {/* ── Tab bar ─────────────────────────────────────────────── */}
      <div
        className="flex gap-1 mb-6 p-1 rounded-xl max-w-lg"
        style={{ background: 'var(--color-surface-container-low)' }}
      >
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200"
            style={tab === key ? {
              background: 'var(--color-surface-container-lowest)',
              color: 'var(--color-primary)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            } : {
              color: 'var(--color-on-surface-variant)',
            }}
          >
            {label}
            {count > 0 && (
              <span
                className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold"
                style={tab === key
                  ? { background: 'var(--color-primary)', color: '#ffffff' }
                  : { background: 'var(--color-outline-variant)', color: 'var(--color-on-surface-variant)' }
                }
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      {loading ? (
        <SkeletonLoader variant="table-row" count={4} />
      ) : (
        <AnimatePresence mode="wait">
          {/* Currently borrowed */}
          {tab === 'current' && (
            <motion.div
              key="current"
              className="space-y-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {books.length === 0 ? (
                <div className="rounded-xl p-12 flex flex-col items-center gap-3 text-center"
                  style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)' }}>
                  <BookMarked size={48} style={{ color: 'var(--color-outline-variant)' }} />
                  <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>No books currently borrowed</p>
                </div>
              ) : books.map((book, i) => {
                const daysLeft = differenceInDays(new Date(book.due_date), new Date());
                const statusColor = daysLeft < 0 ? 'var(--color-danger)' : daysLeft <= 3 ? 'var(--color-warning)' : 'var(--color-success)';
                const statusLabel = daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today' : `${daysLeft}d left`;

                return (
                  <motion.div
                    key={book.issue_id}
                    className="flex items-center gap-4 rounded-xl p-4"
                    style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)' }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.07 }}
                  >
                    <div className="w-12 h-16 rounded-lg flex-shrink-0 overflow-hidden"
                      style={{ background: 'var(--color-surface-container-low)' }}>
                      {book.cover_image_url
                        ? <img src={book.cover_image_url} alt={book.book_title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-xl">📚</div>
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-on-surface)' }}>{book.book_title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-on-surface-variant)' }}>{book.author_name}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: `color-mix(in srgb, ${statusColor} 12%, transparent)`, color: statusColor }}>
                          {statusLabel}
                        </span>
                        {book.renewal_count > 0 && (
                          <span className="text-xs" style={{ color: 'var(--color-on-surface-muted)' }}>
                            Renewed ×{book.renewal_count}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <ProgressRing daysRemaining={daysLeft} totalDays={15} size={50} />
                      <button
                        onClick={() => handleRenew(book.issue_id)}
                        disabled={!!renewing}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
                        style={{ border: '1px solid var(--color-outline-variant)', color: 'var(--color-primary)' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.background = 'var(--color-surface-container-low)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-outline-variant)'; e.currentTarget.style.background = 'transparent'; }}
                      >
                        {renewing === book.issue_id
                          ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          : <RotateCcw size={12} />}
                        Renew
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* History */}
          {tab === 'history' && (
            <motion.div
              key="history"
              className="space-y-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {history.length === 0 ? (
                <div className="rounded-xl p-10 text-center" style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)' }}>
                  <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>No borrowing history yet</p>
                </div>
              ) : history.map((item, i) => (
                <motion.div
                  key={item.issue_id}
                  className="flex items-center gap-4 rounded-xl px-4 py-3"
                  style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}
                >
                  <Clock size={16} className="flex-shrink-0" style={{ color: 'var(--color-on-surface-muted)' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-on-surface)' }}>{item.book_title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-on-surface-muted)' }}>
                      {format(new Date(item.issue_date), 'dd MMM yyyy')} →{' '}
                      {item.return_date ? format(new Date(item.return_date), 'dd MMM yyyy') : 'Not returned'}
                    </p>
                  </div>
                  <Badge variant={item.status === 'RETURNED' ? 'available' : item.status === 'OVERDUE' ? 'overdue' : 'issued'}>
                    {item.status}
                  </Badge>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Fines */}
          {tab === 'fines' && (
            <motion.div
              key="fines"
              className="space-y-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {fines.length === 0 ? (
                <div className="rounded-xl p-10 text-center" style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)' }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-success)' }}>No fines! 🎉 Great job returning on time.</p>
                </div>
              ) : fines.map((fine, i) => (
                <motion.div
                  key={fine.fine_id}
                  className="flex items-start gap-3 rounded-xl px-4 py-3"
                  style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}
                >
                  <IndianRupee size={16} className="flex-shrink-0 mt-0.5" style={{ color: fine.paid ? 'var(--color-success)' : 'var(--color-danger)' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--color-on-surface)' }}>{fine.book_title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-on-surface-muted)' }}>
                      {fine.reason} · {format(new Date(fine.created_at), 'dd MMM yyyy')}
                    </p>
                    {fine.notes && <p className="text-xs mt-0.5" style={{ color: 'var(--color-on-surface-muted)' }}>{fine.notes}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-bold" style={{ color: fine.paid ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      Rs. {fine.amount}
                    </p>
                    <Badge variant={fine.paid ? 'available' : 'overdue'}>{fine.paid ? 'Paid' : 'Unpaid'}</Badge>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </AppShell>
  );
};

export default StudentMyBooksPage;
