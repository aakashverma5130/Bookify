import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Users, AlertTriangle, IndianRupee,
  TrendingUp, BookMarked, Scan, Download,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import AppShell from '../components/AppShell';
import SkeletonLoader from '../components/SkeletonLoader';
import { analyticsApi } from '../services/apiServices';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

// Stitch-aligned chart palette (secondary #4950c7, primary #031635)
const CHART_COLORS = ['#4950c7', '#031635', '#1a2b4b', '#8293b8', '#b6c6ef', '#75777f'];

const LibrarianDashboard = () => {
  const [stats, setStats]     = useState(null);
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
    { label: 'Total Copies',     value: stats.totalCopies,              icon: BookOpen,      color: 'var(--color-on-surface-variant)' },
    { label: 'Available',        value: stats.availableCopies,          icon: TrendingUp,    color: 'var(--color-on-surface-variant)' },
    { label: 'Issued',           value: stats.issuedCopies,             icon: BookMarked,    color: 'var(--color-on-surface-variant)' },
    { label: 'Overdue',          value: stats.overdueIssues,            icon: AlertTriangle, color: 'var(--color-danger)',              numColor: 'var(--color-danger)' },
    { label: 'Active Students',  value: stats.totalStudents,            icon: Users,         color: 'var(--color-on-surface-variant)' },
    { label: 'Unpaid Fines (Rs)',value: parseFloat(stats.totalFinesRs), icon: IndianRupee,   color: 'var(--color-on-surface-variant)', prefix: 'Rs.' },
    { label: 'Damaged / Lost',   value: stats.damagedLostCopies,        icon: Scan,          color: 'var(--color-on-surface-variant)' },
  ] : [];

  const monthlyData = reports?.monthlyTrend?.map(m => ({
    month: format(new Date(m.month), 'MMM yy'),
    issues: parseInt(m.issues),
  })) || [];

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--color-surface-container-high)', border: '1px solid var(--color-outline-variant)', color: 'var(--color-on-surface)' }}>
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
        ))}
      </div>
    );
  };

  return (
    <AppShell title="Library Overview">

      {/* ── Page header ────────────────────────────────────────────── */}
      <motion.header
        className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1
            className="font-bold mb-2"
            style={{
              color: 'var(--color-primary)',
              fontSize: 'clamp(1.75rem, 4vw, 3rem)',
              letterSpacing: '-0.02em',
              lineHeight: '1.1',
            }}
          >
            Library Overview
          </h1>
          <p className="text-base" style={{ color: 'var(--color-on-surface-variant)' }}>
            High-level insights into library operations and resource utilization.
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded transition-colors"
            style={{
              border: '1px solid var(--color-primary)',
              color: 'var(--color-primary)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(3,22,53,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Download size={15} />
            Export Report
          </button>
        </div>
      </motion.header>

      {/* ── Stats Bento Grid ────────────────────────────────────────── */}
      {loading ? (
        <SkeletonLoader variant="stat" count={7} />
      ) : (
        <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-10">
          {statCards.map((card, i) => {
            const Icon = card.icon;
            const displayValue = card.prefix
              ? `${card.prefix} ${Number(card.value).toFixed(2)}`
              : card.value;
            return (
              <motion.div
                key={card.label}
                className="rounded-lg p-4 flex flex-col justify-between"
                style={{
                  background: 'var(--color-surface-container-lowest)',
                  border: '1px solid var(--color-outline-variant)',
                  boxShadow: '0 4px 20px rgba(26,43,75,0.02)',
                  minHeight: 90,
                }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-on-surface-variant)' }}>
                    {card.label}
                  </span>
                  <Icon size={16} style={{ color: card.color, flexShrink: 0 }} />
                </div>
                <div
                  className="font-bold mt-auto"
                  style={{
                    color: card.numColor || 'var(--color-primary)',
                    fontSize: '1.4rem',
                    lineHeight: 1.1,
                  }}
                >
                  {displayValue}
                </div>
              </motion.div>
            );
          })}
        </section>
      )}

      {/* ── Charts Row ──────────────────────────────────────────────── */}
      {!loading && reports && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          {/* Monthly issue trend — 2/3 width */}
          <div
            className="lg:col-span-2 rounded-lg p-6"
            style={{
              background: 'var(--color-surface-container-lowest)',
              border: '1px solid var(--color-outline-variant)',
              boxShadow: '0 4px 20px rgba(26,43,75,0.04)',
            }}
          >
            <h3 className="font-semibold text-base mb-4" style={{ color: 'var(--color-primary)' }}>
              Issues — Last 12 Months
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="issueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#4950c7" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4950c7" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="issues" name="Issues" stroke="#4950c7" fill="url(#issueGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Category breakdown — 1/3 width */}
          <div
            className="rounded-lg p-6"
            style={{
              background: 'var(--color-surface-container-lowest)',
              border: '1px solid var(--color-outline-variant)',
              boxShadow: '0 4px 20px rgba(26,43,75,0.04)',
            }}
          >
            <h3 className="font-semibold text-base mb-4" style={{ color: 'var(--color-primary)' }}>
              By Category
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={reports.categoryBreakdown?.slice(0, 6) || []}
                  dataKey="borrow_count"
                  nameKey="category"
                  cx="50%" cy="50%"
                  outerRadius={72}
                  strokeWidth={2}
                  stroke="var(--color-surface-container-lowest)"
                >
                  {reports.categoryBreakdown?.slice(0, 6).map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: 'var(--color-on-surface-variant)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Top Borrowed Books + Recent Activity ───────────────────── */}
      {!loading && reports && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Top Books — 1/3 */}
          {reports?.topBooks?.length > 0 && (
            <div
              className="rounded-lg overflow-hidden"
              style={{
                background: 'var(--color-surface-container-lowest)',
                border: '1px solid var(--color-outline-variant)',
                boxShadow: '0 4px 20px rgba(26,43,75,0.04)',
              }}
            >
              <div
                className="p-5 flex justify-between items-center"
                style={{ borderBottom: '1px solid var(--color-outline-variant)', background: 'rgba(245,243,246,0.5)' }}
              >
                <h3 className="font-semibold text-sm" style={{ color: 'var(--color-primary)' }}>
                  Most Borrowed Books
                </h3>
              </div>
              <div className="p-4 space-y-4">
                {reports.topBooks.slice(0, 5).map((book, i) => (
                  <motion.div
                    key={book.book_id}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.05 }}
                  >
                    <span
                      className="text-xs w-4 text-right flex-shrink-0 font-bold"
                      style={{ color: 'var(--color-on-surface-muted)' }}
                    >
                      {i + 1}
                    </span>
                    <div
                      className="w-10 h-14 rounded flex-shrink-0 overflow-hidden"
                      style={{ background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)' }}
                    >
                      {book.cover_image_url
                        ? <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-base">📚</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-primary)' }}>{book.title}</p>
                      <p className="text-[11px] truncate" style={{ color: 'var(--color-on-surface-variant)' }}>{book.author_name}</p>
                      <p className="text-[10px] font-bold mt-0.5" style={{ color: 'var(--color-secondary)' }}>
                        {book.borrow_count} borrows
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity Table — 2/3 */}
          {reports?.recentActivity?.length > 0 && (
            <div
              className="lg:col-span-2 rounded-lg overflow-hidden"
              style={{
                background: 'var(--color-surface-container-lowest)',
                border: '1px solid var(--color-outline-variant)',
                boxShadow: '0 4px 20px rgba(26,43,75,0.04)',
              }}
            >
              <div
                className="p-5 flex justify-between items-center"
                style={{ borderBottom: '1px solid var(--color-outline-variant)', background: 'rgba(245,243,246,0.5)' }}
              >
                <h3 className="font-semibold text-sm" style={{ color: 'var(--color-primary)' }}>Recent Activity</h3>
                <span className="text-xs font-bold" style={{ color: 'var(--color-secondary)' }}>View all →</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr style={{ background: 'rgba(245,243,246,0.5)' }}>
                      {['Student', 'Book', 'Action', 'Date', 'Status'].map(h => (
                        <th
                          key={h}
                          className="p-4 text-xs font-bold uppercase tracking-wider"
                          style={{ color: 'var(--color-on-surface-variant)', borderBottom: '1px solid var(--color-outline-variant)' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reports.recentActivity.slice(0, 8).map((item, i) => (
                      <tr
                        key={i}
                        style={{ borderBottom: '1px solid rgba(197,198,207,0.3)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-container-low)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <td className="p-4 text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>{item.student_name}</td>
                        <td className="p-4 text-xs max-w-[160px] truncate" style={{ color: 'var(--color-on-surface-variant)' }}>{item.book_title}</td>
                        <td className="p-4 text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>{item.action}</td>
                        <td className="p-4 text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
                          {item.date ? format(new Date(item.date), 'dd MMM, HH:mm') : '—'}
                        </td>
                        <td className="p-4">
                          <StatusBadge status={item.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
};

const StatusBadge = ({ status }) => {
  const s = (status || '').toLowerCase();
  const config = {
    active:   { bg: 'rgba(3,22,53,0.08)',    color: 'var(--color-primary)',   label: 'Active'   },
    returned: { bg: 'rgba(117,119,127,0.10)', color: 'var(--color-on-surface-variant)', label: 'Returned' },
    overdue:  { bg: 'rgba(186,26,26,0.10)',  color: 'var(--color-danger)',    label: 'Overdue'  },
    renewed:  { bg: 'rgba(73,80,199,0.10)',  color: 'var(--color-secondary)', label: 'Renewed'  },
    pending:  { bg: 'rgba(189,149,56,0.12)', color: 'var(--color-warning)',   label: 'Pending'  },
  }[s] || { bg: 'rgba(197,198,207,0.2)', color: 'var(--color-on-surface-variant)', label: status || '—' };

  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-[10px] font-bold"
      style={{ background: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  );
};

export default LibrarianDashboard;
