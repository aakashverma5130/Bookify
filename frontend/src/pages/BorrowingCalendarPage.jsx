import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Info,
  RotateCcw
} from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  differenceInDays,
  parseISO
} from 'date-fns';
import AppShell from '../components/AppShell';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import ProgressRing from '../components/ProgressRing';
import { studentApi, circulationApi } from '../services/apiServices';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const BorrowingCalendarPage = () => {
  const { isStudent } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [books, setBooks] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [renewingId, setRenewingId] = useState(null);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const [currRes, histRes] = await Promise.all([
        studentApi.getCurrentBooks(),
        studentApi.getHistory()
      ]);
      setBooks(currRes.data.books || []);
      setHistory(histRes.data.history || []);
    } catch {
      toast.error('Failed to load borrowing calendar data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const handleRenew = async (issueId) => {
    setRenewingId(issueId);
    try {
      const res = await circulationApi.renew(issueId);
      toast.success(`Book renewed until ${res.data.newDueDate}`);
      await fetchCalendarData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to renew book');
    } finally {
      setRenewingId(null);
    }
  };

  // Combine and map all events to dates
  const allEvents = useMemo(() => {
    const events = [];
    
    // Active books
    books.forEach(b => {
      if (b.issue_date) {
        events.push({
          type: 'ISSUE',
          date: parseISO(b.issue_date),
          title: `Borrowed: ${b.book_title || b.title}`,
          book: b
        });
      }
      if (b.due_date) {
        const daysLeft = differenceInDays(parseISO(b.due_date), new Date());
        events.push({
          type: daysLeft < 0 ? 'OVERDUE' : daysLeft <= 3 ? 'DUE_SOON' : 'DUE',
          date: parseISO(b.due_date),
          title: `Due: ${b.book_title || b.title}`,
          book: b,
          daysLeft
        });
      }
    });

    // History (returned)
    history.forEach(h => {
      if (h.return_date) {
        events.push({
          type: 'RETURNED',
          date: parseISO(h.return_date),
          title: `Returned: ${h.book_title || h.title}`,
          book: h
        });
      }
    });

    return events;
  }, [books, history]);

  // Calendar dates generation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const getEventsForDay = (day) => {
    return allEvents.filter(event => isSameDay(event.date, day));
  };

  const selectedDateEvents = useMemo(() => {
    return getEventsForDay(selectedDate);
  }, [selectedDate, allEvents]);

  return (
    <AppShell title="Borrowing Calendar">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Calendar View */}
        <div className="flex-1 space-y-4">
          <div className="card flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-900/60 border border-primary-500/30 flex items-center justify-center text-primary-400">
                <CalendarIcon size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white font-display">
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <p className="text-xs text-slate-400">
                  Track issue timelines, upcoming deadlines, and returned books
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 rounded-xl bg-bg-600 hover:bg-bg-500 text-slate-300 transition-colors border border-white/5"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => {
                  setCurrentMonth(new Date());
                  setSelectedDate(new Date());
                }}
                className="px-3 py-1.5 rounded-xl bg-bg-600 hover:bg-bg-500 text-xs font-semibold text-slate-200 border border-white/5"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 rounded-xl bg-bg-600 hover:bg-bg-500 text-slate-300 transition-colors border border-white/5"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="card p-4">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold text-slate-400">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                const dayEvents = getEventsForDay(day);
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isTodayDate = isToday(day);

                const hasOverdue = dayEvents.some(e => e.type === 'OVERDUE');
                const hasDueSoon = dayEvents.some(e => e.type === 'DUE_SOON');
                const hasDue = dayEvents.some(e => e.type === 'DUE');
                const hasIssue = dayEvents.some(e => e.type === 'ISSUE');
                const hasReturn = dayEvents.some(e => e.type === 'RETURNED');

                return (
                  <motion.button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`min-h-[72px] sm:min-h-[84px] p-1.5 rounded-xl border flex flex-col items-start justify-between text-left transition-all relative overflow-hidden group
                      ${!isCurrentMonth ? 'opacity-30 border-transparent bg-bg-800/40' : 'bg-bg-700/60 border-white/5'}
                      ${isSelected ? 'ring-2 ring-primary-400 border-transparent bg-primary-950/40' : 'hover:border-primary-500/40 hover:bg-bg-600/80'}
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Top Row: Date Number & Today badge */}
                    <div className="w-full flex items-center justify-between">
                      <span className={`text-xs font-semibold rounded-md w-6 h-6 flex items-center justify-center
                        ${isTodayDate ? 'bg-primary-600 text-white font-bold' : isSelected ? 'text-primary-300 font-bold' : 'text-slate-300'}
                      `}>
                        {format(day, 'd')}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary-500/20 text-primary-300 font-mono">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Event Dots / Micro Indicators */}
                    <div className="w-full flex flex-wrap gap-1 mt-1">
                      {hasOverdue && (
                        <div className="w-2 h-2 rounded-full bg-danger-400 animate-pulse" title="Overdue Book" />
                      )}
                      {hasDueSoon && (
                        <div className="w-2 h-2 rounded-full bg-warning-400" title="Due Soon" />
                      )}
                      {hasDue && (
                        <div className="w-2 h-2 rounded-full bg-primary-400" title="Due Date" />
                      )}
                      {hasIssue && (
                        <div className="w-2 h-2 rounded-full bg-accent-cyan" title="Issued" />
                      )}
                      {hasReturn && (
                        <div className="w-2 h-2 rounded-full bg-success-400" title="Returned" />
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Color Legend */}
          <div className="card flex flex-wrap items-center gap-4 py-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-danger-400" />
              <span>Overdue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-warning-400" />
              <span>Due Soon (≤3 days)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-primary-400" />
              <span>Due Date</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-accent-cyan" />
              <span>Issued Date</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-success-400" />
              <span>Returned Date</span>
            </div>
          </div>
        </div>

        {/* Selected Date Details Panel */}
        <div className="w-full lg:w-96 space-y-4">
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div>
                <p className="text-xs text-slate-400 font-medium">Selected Date</p>
                <h3 className="text-base font-bold text-white">
                  {format(selectedDate, 'EEEE, dd MMMM yyyy')}
                </h3>
              </div>
              {isToday(selectedDate) && (
                <Badge variant="issued">Today</Badge>
              )}
            </div>

            <div className="mt-4 space-y-3">
              {selectedDateEvents.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
                  <Clock size={32} className="text-slate-600" />
                  <p>No borrowing events or deadlines on this day.</p>
                </div>
              ) : (
                selectedDateEvents.map((ev, idx) => (
                  <motion.div
                    key={idx}
                    className={`p-3.5 rounded-xl border flex flex-col gap-2
                      ${ev.type === 'OVERDUE' ? 'bg-danger-500/10 border-danger-500/30' :
                        ev.type === 'DUE_SOON' ? 'bg-warning-500/10 border-warning-500/30' :
                        ev.type === 'RETURNED' ? 'bg-success-500/10 border-success-500/30' :
                        ev.type === 'ISSUE' ? 'bg-cyan-500/10 border-cyan-500/30' :
                        'bg-primary-500/10 border-primary-500/30'}
                    `}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {ev.type === 'OVERDUE' && <AlertTriangle size={15} className="text-danger-400" />}
                        {ev.type === 'DUE_SOON' && <Clock size={15} className="text-warning-400" />}
                        {ev.type === 'RETURNED' && <CheckCircle2 size={15} className="text-success-400" />}
                        {ev.type === 'ISSUE' && <BookOpen size={15} className="text-accent-cyan" />}
                        {ev.type === 'DUE' && <Clock size={15} className="text-primary-400" />}
                        <span className="text-xs font-bold text-white tracking-wide">{ev.type}</span>
                      </div>
                      <Badge variant={ev.type === 'OVERDUE' ? 'overdue' : ev.type === 'DUE_SOON' ? 'due-soon' : ev.type === 'RETURNED' ? 'available' : 'issued'}>
                        {ev.type.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-white line-clamp-1">{ev.book.book_title || ev.book.title}</h4>
                      <p className="text-xs text-slate-400">{ev.book.author_name || 'Author'}</p>
                      <p className="text-[11px] text-slate-500 mt-1 font-mono">Acc: {ev.book.accession_number || 'N/A'}</p>
                    </div>

                    {(ev.type === 'DUE' || ev.type === 'DUE_SOON' || ev.type === 'OVERDUE') && (
                      <div className="pt-2 mt-1 border-t border-white/5 flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          {ev.daysLeft < 0 ? `${Math.abs(ev.daysLeft)} days overdue` : `${ev.daysLeft} days left`}
                        </span>
                        <button
                          onClick={() => handleRenew(ev.book.issue_id)}
                          disabled={renewingId === ev.book.issue_id}
                          className="btn-secondary btn text-[11px] py-1 px-2.5"
                        >
                          <RotateCcw size={12} />
                          {renewingId === ev.book.issue_id ? 'Renewing...' : 'Renew'}
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </Card>

          {/* Active Borrow Summary */}
          <Card>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <BookOpen size={16} className="text-primary-400" />
              Active Borrow Countdown
            </h3>
            {books.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No active loans currently</p>
            ) : (
              <div className="space-y-3">
                {books.map(b => {
                  const days = differenceInDays(parseISO(b.due_date), new Date());
                  return (
                    <div key={b.issue_id} className="flex items-center justify-between p-2.5 rounded-xl bg-bg-600/40 border border-white/5">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-semibold text-white truncate">{b.book_title || b.title}</p>
                        <p className="text-[11px] text-slate-400">Due: {format(parseISO(b.due_date), 'dd MMM')}</p>
                      </div>
                      <ProgressRing daysRemaining={days} totalDays={15} size={42} strokeWidth={4} />
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
};

export default BorrowingCalendarPage;
