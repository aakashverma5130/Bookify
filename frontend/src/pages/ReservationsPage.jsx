import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BookMarked,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Bell,
  Search,
  User,
  Trash2,
  ArrowRight
} from 'lucide-react';
import AppShell from '../components/AppShell';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import SkeletonLoader from '../components/SkeletonLoader';
import { reservationApi } from '../services/apiServices';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';

const ReservationsPage = () => {
  const { isLibrarian, isStudent } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await reservationApi.getAll();
      setReservations(res.data.reservations || []);
    } catch {
      toast.error('Failed to load reservations queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;
    setCancellingId(id);
    try {
      await reservationApi.cancel(id);
      toast.success('Reservation cancelled');
      fetchReservations();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel reservation');
    } finally {
      setCancellingId(null);
    }
  };

  const filtered = reservations.filter(r => {
    const matchesFilter = filterStatus === 'ALL' || r.status === filterStatus;
    const matchesSearch =
      !search.trim() ||
      r.book_title?.toLowerCase().includes(search.toLowerCase()) ||
      r.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.enrollment_no?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = {
    WAITING: reservations.filter(r => r.status === 'WAITING').length,
    NOTIFIED: reservations.filter(r => r.status === 'NOTIFIED').length,
    COMPLETED: reservations.filter(r => r.status === 'COMPLETED').length,
    CANCELLED: reservations.filter(r => r.status === 'CANCELLED').length,
  };

  return (
    <AppShell title={isLibrarian ? "Reservations & Waitlist Queue" : "My Book Waitlists"}>
      {/* Overview Stat Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { key: 'WAITING', label: 'In Queue (Waiting)', count: counts.WAITING, color: 'text-warning-400', badge: 'due-soon' },
          { key: 'NOTIFIED', label: 'Ready for Pickup', count: counts.NOTIFIED, color: 'text-success-400', badge: 'available' },
          { key: 'COMPLETED', label: 'Fulfilled', count: counts.COMPLETED, color: 'text-primary-400', badge: 'issued' },
          { key: 'CANCELLED', label: 'Cancelled', count: counts.CANCELLED, color: 'text-slate-400', badge: 'neutral' },
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setFilterStatus(f => f === item.key ? 'ALL' : item.key)}
            className={`card p-4 text-left transition-all cursor-pointer ${filterStatus === item.key ? 'border-primary-500 bg-primary-950/20' : ''}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{item.label}</span>
              <Badge variant={item.badge}>{item.key}</Badge>
            </div>
            <p className={`text-2xl font-bold font-display mt-2 ${item.color}`}>
              {item.count}
            </p>
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="card flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search book title, student name, or enrollment no..."
            className="input pl-9"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="input py-2 text-xs w-44"
        >
          <option value="ALL">All Statuses</option>
          <option value="WAITING">WAITING (In Queue)</option>
          <option value="NOTIFIED">NOTIFIED (Ready)</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      {/* Queue List */}
      {loading ? (
        <SkeletonLoader variant="table-row" count={6} />
      ) : filtered.length === 0 ? (
        <Card>
          <div className="text-center py-16 text-slate-400 flex flex-col items-center gap-3">
            <BookMarked size={48} className="text-slate-600" />
            <p className="text-base font-semibold text-white">No reservations in this view</p>
            <p className="text-sm text-slate-500">
              Students are automatically queued when all physical copies are borrowed.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((item, idx) => (
            <motion.div
              key={item.reservation_id}
              className={`card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all
                ${item.status === 'NOTIFIED' ? 'border-success-500/40 bg-success-950/10' : ''}
              `}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.03 }}
            >
              {/* Left: Queue Position & Book Details */}
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 font-display font-bold border
                  ${item.status === 'NOTIFIED' ? 'bg-success-500/20 border-success-500/40 text-success-300' : 'bg-primary-900/50 border-primary-500/30 text-primary-300'}
                `}>
                  <span className="text-[9px] uppercase tracking-tighter text-slate-400">Pos</span>
                  <span className="text-base leading-none">#{item.queue_position || 1}</span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="font-bold text-white text-sm sm:text-base truncate">{item.book_title}</h4>
                    <Badge variant={item.status === 'NOTIFIED' ? 'available' : item.status === 'WAITING' ? 'due-soon' : 'neutral'}>
                      {item.status === 'NOTIFIED' ? 'Ready for Pickup (48h Hold)' : item.status}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span className="text-slate-300">by {item.author_name || 'Author'}</span>
                    {isLibrarian && (
                      <span className="flex items-center gap-1 text-primary-300">
                        <User size={12} /> {item.student_name} ({item.enrollment_no})
                      </span>
                    )}
                    <span className="text-slate-500">
                      Reserved: {format(new Date(item.reservation_date), 'dd MMM yyyy')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Expiry time / Action */}
              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-white/5">
                {item.status === 'NOTIFIED' && item.expiry_date && (
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] text-success-400 font-semibold flex items-center gap-1">
                      <Clock size={11} /> Hold Expires
                    </p>
                    <p className="text-xs text-white font-mono">
                      {format(new Date(item.expiry_date), 'dd MMM, HH:mm')}
                    </p>
                  </div>
                )}

                {(item.status === 'WAITING' || item.status === 'NOTIFIED') && (
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    loading={cancellingId === item.reservation_id}
                    onClick={() => handleCancel(item.reservation_id)}
                    className="text-xs"
                  >
                    Cancel Hold
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </AppShell>
  );
};

export default ReservationsPage;
