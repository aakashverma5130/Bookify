import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import AppShell from '../components/AppShell';
import Card from '../components/Card';
import Badge from '../components/Badge';
import SkeletonLoader from '../components/SkeletonLoader';
import { analyticsApi } from '../services/apiServices';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const PRIORITY_ICON = {
  HIGH:   <TrendingUp   size={16} style={{ color: 'var(--color-danger)' }} />,
  MEDIUM: <TrendingUp   size={16} style={{ color: 'var(--color-warning)' }} />,
  LOW:    <TrendingDown size={16} style={{ color: 'var(--color-success)' }} />,
};

const AIForecastPage = () => {
  const [forecasts, setForecasts]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('ALL'); // ALL | HIGH | MEDIUM | LOW

  const fetchForecasts = async () => {
    setLoading(true);
    try {
      const res = await analyticsApi.getForecast();
      setForecasts(res.data.forecasts || []);
    } catch (err) {
      const status = err.response?.status;
      const msg = status === 429
        ? 'Too many requests — please wait a moment and try again.'
        : status === 401
          ? 'Your session has expired. Please sign in again.'
          : err.message || 'Failed to load forecasts';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchForecasts(); }, []);

  const filtered = filter === 'ALL' ? forecasts : forecasts.filter(f => f.priority === filter);

  const counts = {
    HIGH:   forecasts.filter(f => f.priority === 'HIGH').length,
    MEDIUM: forecasts.filter(f => f.priority === 'MEDIUM').length,
    LOW:    forecasts.filter(f => f.priority === 'LOW').length,
  };

  return (
    <AppShell title="AI Demand Forecast">
      <div className="flex items-center gap-3 mb-6">
        <BrainCircuit size={24} style={{ color: 'var(--color-primary)' }} />
        <div>
          <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
            Demand scores computed from issue frequency + waitlist queue.
            {forecasts[0]?.generated_at && (
              <span className="ml-2" style={{ color: 'var(--color-on-surface-muted)' }}>Last updated: {format(new Date(forecasts[0].generated_at), 'dd MMM, HH:mm')}</span>
            )}
          </p>
        </div>
        <button onClick={fetchForecasts} className="ml-auto btn-ghost btn text-xs">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Priority summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {(['HIGH', 'MEDIUM', 'LOW']).map(p => (
          <motion.button
            key={p}
            className="card text-center cursor-pointer transition-all"
            style={filter === p ? { borderColor: 'var(--color-primary)' } : undefined}
            onClick={() => setFilter(f => f === p ? 'ALL' : p)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              {PRIORITY_ICON[p]}
              <span className="text-2xl font-bold font-display" style={{ color: 'var(--color-on-surface)' }}>{counts[p]}</span>
            </div>
            <Badge variant={p === 'HIGH' ? 'high' : p === 'MEDIUM' ? 'medium' : 'low'}>{p}</Badge>
          </motion.button>
        ))}
      </div>

      {/* Forecast list */}
      {loading ? (
        <SkeletonLoader variant="table-row" count={8} />
      ) : (
        <div className="space-y-3">
          {filtered.map((item, i) => (
            <motion.div
              key={item.forecast_id}
              className="card flex items-start gap-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
            >
              {/* Cover */}
              <div className="w-12 h-16 rounded-lg flex-shrink-0 overflow-hidden" style={{ background: 'var(--color-surface-container-low)' }}>
                {item.cover_image_url
                  ? <img src={item.cover_image_url} alt={item.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-xl">📚</div>
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-on-surface)' }}>{item.title}</p>
                  <Badge variant={item.priority === 'HIGH' ? 'high' : item.priority === 'MEDIUM' ? 'medium' : 'low'}>
                    {item.priority}
                  </Badge>
                </div>
                <p className="text-xs mb-1" style={{ color: 'var(--color-on-surface-variant)' }}>{item.author_name} · {item.category_name}</p>
                <p className="text-xs" style={{ color: 'var(--color-on-surface-muted)' }}>{item.reasoning}</p>
              </div>

              {/* Demand score bar */}
              <div className="flex-shrink-0 w-20 text-right">
                <p className="text-lg font-bold font-display" style={{ color: item.priority === 'HIGH' ? '#ef4444' : item.priority === 'MEDIUM' ? '#eab308' : '#22c55e' }}>
                  {(item.predicted_demand_score * 100).toFixed(0)}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--color-on-surface-muted)' }}>demand score</p>
                <div className="w-full h-1.5 rounded-full mt-1 overflow-hidden" style={{ background: 'var(--color-surface-container-high)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: item.priority === 'HIGH' ? '#ef4444' : item.priority === 'MEDIUM' ? '#eab308' : '#22c55e' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.predicted_demand_score * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.04, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </motion.div>
          ))}

          {filtered.length === 0 && !loading && (
            <Card>
              <p className="text-sm text-center py-8" style={{ color: 'var(--color-on-surface-variant)' }}>No forecast data. Run a forecast first.</p>
            </Card>
          )}
        </div>
      )}
    </AppShell>
  );
};

export default AIForecastPage;
