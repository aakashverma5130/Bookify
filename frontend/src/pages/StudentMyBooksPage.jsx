import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookMarked, Clock, AlertTriangle, RotateCcw, IndianRupee } from 'lucide-react';
import AppShell from '../components/AppShell';
import Card from '../components/Card';
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
      // Update local state
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
    { key: 'current',  label: 'Currently Borrowed', count: books.length },
    { key: 'history',  label: 'History',             count: history.length },
    { key: 'fines',    label: 'Fines',               count: fines.filter(f => !f.paid).length },
  ];

  return (
    <AppShell title="My Books">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 p-1 rounded-2xl bg-bg-700 max-w-md">
        {tabs.map(({ key, label, count }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200
              ${tab === key ? 'bg-primary-700 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            {label}
            {count > 0 && (
              <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold
                ${tab === key ? 'bg-white/20' : 'bg-bg-500'}`}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? <SkeletonLoader variant="table-row" count={4} /> : (
        <>
          {tab === 'current' && (
            <div className="space-y-3">
              {books.length === 0 ? (
                <Card><p className="text-slate-400 text-sm text-center py-8">No books currently borrowed</p></Card>
              ) : books.map((book, i) => {
                const daysLeft = differenceInDays(new Date(book.due_date), new Date());
                const statusVariant = daysLeft < 0 ? 'overdue' : daysLeft <= 3 ? 'due-soon' : 'available';

                return (
                  <motion.div key={book.issue_id} className="card flex items-center gap-4"
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.07 }}>

                    <div className="w-12 h-16 rounded-lg bg-bg-600 flex-shrink-0 overflow-hidden">
                      {book.cover_image_url
                        ? <img src={book.cover_image_url} alt={book.book_title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-xl">📚</div>
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{book.book_title}</p>
                      <p className="text-xs text-slate-400">{book.author_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={statusVariant}>Due {format(new Date(book.due_date), 'dd MMM')}</Badge>
                        {book.renewal_count > 0 && <Badge variant="neutral">Renewed ×{book.renewal_count}</Badge>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <ProgressRing daysRemaining={daysLeft} totalDays={15} size={52} />
                      <button
                        onClick={() => handleRenew(book.issue_id)}
                        disabled={!!renewing}
                        className="btn-secondary btn text-xs"
                        title="Renew book"
                      >
                        {renewing === book.issue_id ? (
                          <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <RotateCcw size={13} />
                        )}
                        Renew
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {tab === 'history' && (
            <div className="space-y-2">
              {history.length === 0 ? (
                <Card><p className="text-slate-400 text-sm text-center py-8">No borrowing history yet</p></Card>
              ) : history.map((item, i) => (
                <motion.div key={item.issue_id} className="card flex items-center gap-3"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{item.book_title}</p>
                    <p className="text-xs text-slate-500">
                      {format(new Date(item.issue_date), 'dd MMM yyyy')} →
                      {item.return_date ? format(new Date(item.return_date), ' dd MMM yyyy') : ' Not returned'}
                    </p>
                  </div>
                  <Badge variant={item.status === 'RETURNED' ? 'available' : item.status === 'OVERDUE' ? 'overdue' : 'issued'}>
                    {item.status}
                  </Badge>
                </motion.div>
              ))}
            </div>
          )}

          {tab === 'fines' && (
            <div className="space-y-2">
              {fines.length === 0 ? (
                <Card><p className="text-success-400 text-sm text-center py-8">No fines! 🎉 Great job returning on time.</p></Card>
              ) : fines.map((fine, i) => (
                <motion.div key={fine.fine_id} className="card flex items-start gap-3"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}>
                  <IndianRupee size={18} className={fine.paid ? 'text-success-400' : 'text-danger-400'} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{fine.book_title}</p>
                    <p className="text-xs text-slate-400">{fine.reason} · {format(new Date(fine.created_at), 'dd MMM yyyy')}</p>
                    {fine.notes && <p className="text-xs text-slate-500">{fine.notes}</p>}
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold font-display ${fine.paid ? 'text-success-400' : 'text-danger-400'}`}>
                      Rs. {fine.amount}
                    </p>
                    <Badge variant={fine.paid ? 'available' : 'overdue'}>{fine.paid ? 'Paid' : 'Unpaid'}</Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
};

export default StudentMyBooksPage;
