import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, AlertTriangle, IndianRupee, BookMarked } from 'lucide-react';
import AppShell from '../components/AppShell';
import StatCounter from '../components/StatCounter';
import ProgressRing from '../components/ProgressRing';
import SkeletonLoader from '../components/SkeletonLoader';
import Card from '../components/Card';
import { studentApi } from '../services/apiServices';
import toast from 'react-hot-toast';
import { format, differenceInDays } from 'date-fns';

const StudentHome = () => {
  const [stats, setStats]       = useState(null);
  const [books, setBooks]       = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [dashRes, booksRes] = await Promise.all([
          studentApi.getDashboard(),
          studentApi.getCurrentBooks(),
        ]);
        setStats(dashRes.data);
        setBooks(booksRes.data.books || []);
      } catch (err) {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const statCards = stats ? [
    { label: 'Books Borrowed',    value: stats.currentlyBorrowed,  icon: BookOpen,      color: 'text-primary-400' },
    { label: 'Due Soon (≤3 days)',value: stats.dueSoon,            icon: Clock,         color: 'text-warning-400' },
    { label: 'Overdue',           value: stats.overdue,            icon: AlertTriangle, color: 'text-danger-400'  },
    { label: 'Unpaid Fines (Rs)', value: parseFloat(stats.totalUnpaidFines), icon: IndianRupee, color: stats.totalUnpaidFines > 0 ? 'text-danger-400' : 'text-success-400', prefix: 'Rs. ' },
  ] : [];

  return (
    <AppShell title="My Dashboard">
      {/* Stat cards */}
      {loading ? (
        <SkeletonLoader variant="stat" count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, i) => (
            <StatCounter key={stat.label} {...stat} delay={i * 0.1} />
          ))}
        </div>
      )}

      {/* Currently borrowed books */}
      <div className="mt-2">
        <h2 className="page-title mb-4">My Current Books</h2>
        {loading ? (
          <SkeletonLoader variant="table-row" count={3} />
        ) : books.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center py-12 gap-3 text-slate-400">
              <BookMarked size={48} className="text-slate-600" />
              <p className="text-sm">You have no books checked out</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {books.map((book, i) => {
              const daysLeft = differenceInDays(new Date(book.due_date), new Date());
              const statusColor = daysLeft < 0 ? 'text-danger-400' : daysLeft <= 3 ? 'text-warning-400' : 'text-success-400';

              return (
                <motion.div
                  key={book.issue_id}
                  className="card flex items-center gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.08 }}
                >
                  {/* Cover thumbnail */}
                  <div className="w-12 h-16 rounded-lg bg-bg-600 flex-shrink-0 overflow-hidden">
                    {book.cover_image_url
                      ? <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-xl">📚</div>
                    }
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{book.book_title}</p>
                    <p className="text-xs text-slate-400">{book.author_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Acc: {book.accession_number}</p>
                  </div>

                  {/* Due date */}
                  <div className="text-right flex-shrink-0 flex items-center gap-4">
                    <div>
                      <p className="text-xs text-slate-500">Due date</p>
                      <p className={`text-sm font-semibold ${statusColor}`}>
                        {format(new Date(book.due_date), 'dd MMM yyyy')}
                      </p>
                    </div>
                    <ProgressRing daysRemaining={daysLeft} totalDays={15} size={56} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default StudentHome;
