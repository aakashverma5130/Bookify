import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Users, AlertTriangle, IndianRupee,
  TrendingUp, BookMarked, Scan,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import AppShell from '../components/AppShell';
import StatCounter from '../components/StatCounter';
import SkeletonLoader from '../components/SkeletonLoader';
import Card from '../components/Card';
import { analyticsApi } from '../services/apiServices';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const CHART_COLORS = ['#6366f1', '#a855f7', '#06b6d4', '#22c55e', '#eab308', '#ef4444'];

const LibrarianDashboard = () => {
  const [stats, setStats]   = useState(null);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [dashRes, reportRes] = await Promise.all([
          analyticsApi.getDashboard(),
          analyticsApi.getReports(),
        ]);
        setStats(dashRes.data);
        setReports(reportRes.data);
      } catch (err) {
        const status = err.response?.status;
        const msg = status === 429
          ? 'Too many requests — please wait a moment and try again.'
          : status === 401
            ? 'Your session has expired. Please sign in again.'
            : 'Failed to load dashboard data';
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const statCards = stats ? [
    { label: 'Total Copies',      value: stats.totalCopies,      icon: BookOpen,      color: 'text-primary-400' },
    { label: 'Currently Issued',  value: stats.issuedCopies,     icon: BookMarked,    color: 'text-accent-cyan'  },
    { label: 'Overdue Issues',    value: stats.overdueIssues,    icon: AlertTriangle, color: 'text-danger-400'   },
    { label: 'Total Students',    value: stats.totalStudents,    icon: Users,         color: 'text-accent-purple'},
    { label: 'Unpaid Fines (Rs)', value: parseFloat(stats.totalFinesRs), icon: IndianRupee, color: 'text-warning-400', prefix: 'Rs. ' },
    { label: 'Damaged / Lost',    value: stats.damagedLostCopies, icon: Scan,         color: 'text-orange-400'  },
    { label: 'Available Copies',  value: stats.availableCopies,  icon: TrendingUp,    color: 'text-success-400' },
  ] : [];

  // Format monthly trend
  const monthlyData = reports?.monthlyTrend?.map(m => ({
    month: format(new Date(m.month), 'MMM yy'),
    issues: parseInt(m.issues),
  })) || [];

  return (
    <AppShell title="Library Dashboard">
      {/* Stats */}
      {loading
        ? <SkeletonLoader variant="stat" count={7} />
        : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {statCards.map((card, i) => (
              <StatCounter key={card.label} {...card} delay={i * 0.06} />
            ))}
          </div>
        )
      }

      {/* Charts Row */}
      {!loading && reports && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          {/* Monthly issue trend */}
          <Card className="lg:col-span-2">
            <h3 className="font-bold text-white mb-4">Issues — Last 12 Months</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="issueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#13132d', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: '#f8fafc' }}
                />
                <Area type="monotone" dataKey="issues" stroke="#6366f1" fill="url(#issueGrad)" strokeWidth={2.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Category pie */}
          <Card>
            <h3 className="font-bold text-white mb-4">By Category</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={reports.categoryBreakdown?.slice(0, 6) || []}
                  dataKey="borrow_count"
                  nameKey="category"
                  cx="50%" cy="50%" outerRadius={80}
                  strokeWidth={0}
                >
                  {reports.categoryBreakdown?.slice(0, 6).map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#13132d', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Top Books */}
      {!loading && reports?.topBooks?.length > 0 && (
        <Card>
          <h3 className="font-bold text-white mb-4">Top Borrowed Books — Last 90 Days</h3>
          <div className="space-y-3">
            {reports.topBooks.map((book, i) => (
              <motion.div
                key={book.book_id}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <span className="text-sm text-slate-600 w-5 text-right flex-shrink-0">{i + 1}</span>
                <div className="w-10 h-13 rounded-lg bg-bg-600 flex-shrink-0 overflow-hidden">
                  {book.cover_image_url
                    ? <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-base">📚</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{book.title}</p>
                  <p className="text-xs text-slate-400 truncate">{book.author_name}</p>
                </div>
                <div className="flex-shrink-0">
                  <span className="badge badge-issued">{book.borrow_count} borrows</span>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}
    </AppShell>
  );
};

export default LibrarianDashboard;
