import { useState, useEffect } from 'react';
import {
  IndianRupee,
  Clock,
  Save
} from 'lucide-react';
import AppShell from '../components/AppShell';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { analyticsApi } from '../services/apiServices';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const LibrarySettingsPage = () => {
  const { isHeadLibrarian: _ } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    fine_per_day: '2.00',
    max_books_per_student: 3,
    default_loan_days: 15,
    renewal_limit: 2,
    seat_grace_minutes: 15,
    library_name: 'Bookify Library'
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await analyticsApi.getSettings();
      if (res.data) {
        setSettings(res.data);
      }
    } catch {
      toast.error('Failed to load library settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await analyticsApi.updateSettings({
        finePerDay: parseFloat(settings.fine_per_day),
        maxBooksPerStudent: parseInt(settings.max_books_per_student),
        defaultLoanDays: parseInt(settings.default_loan_days),
        renewalLimit: parseInt(settings.renewal_limit),
        seatGraceMinutes: parseInt(settings.seat_grace_minutes)
      });
      toast.success('Library circulation & fine policies updated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Library Policy & Circulation Settings">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Header Card */}
          <div className="card flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--color-primary-container) 60%, transparent)', border: '1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)', color: 'var(--color-primary)' }}>
                <Settings size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold font-display" style={{ color: 'var(--color-on-surface)' }}>System Circulation Configuration</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-on-surface-variant)' }}>
                  Rules and thresholds automatically applied by backend circulation controllers and cron jobs.
                </p>
              </div>
            </div>
            <Badge variant="issued">Global Config</Badge>
          </div>

          {/* Circulation Policies */}
          <Card className="space-y-5">
            <h3 className="text-base font-bold flex items-center gap-2 pb-3 border-b" style={{ color: 'var(--color-on-surface)', borderColor: 'var(--color-outline-variant)' }}>
              <BookOpen size={16} style={{ color: 'var(--color-primary)' }} />
              Book Loan & Renewal Rules
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--color-on-surface)' }}>
                  <Calendar size={13} style={{ color: 'var(--color-primary)' }} />
                  Default Loan Period (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={settings.default_loan_days}
                  onChange={e => setSettings({ ...settings, default_loan_days: e.target.value })}
                  required
                  className="input font-semibold"
                />
                <p className="text-[11px] mt-1" style={{ color: 'var(--color-on-surface-muted)' }}>Standard duration before a borrowed book is considered overdue.</p>
              </div>

              <div>
                <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--color-on-surface)' }}>
                  <BookOpen size={13} style={{ color: 'var(--color-primary)' }} />
                  Max Books Allowed Per Student
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.max_books_per_student}
                  onChange={e => setSettings({ ...settings, max_books_per_student: e.target.value })}
                  required
                  className="input font-semibold"
                />
                <p className="text-[11px] mt-1" style={{ color: 'var(--color-on-surface-muted)' }}>Maximum simultaneous active physical issues allowed per student account.</p>
              </div>

              <div>
                <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--color-on-surface)' }}>
                  <RotateCcw size={13} style={{ color: 'var(--color-primary)' }} />
                  Maximum Renewals Allowed
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={settings.renewal_limit}
                  onChange={e => setSettings({ ...settings, renewal_limit: e.target.value })}
                  required
                  className="input font-semibold"
                />
                <p className="text-[11px] mt-1" style={{ color: 'var(--color-on-surface-muted)' }}>Number of times a student can extend a loan without returning to counter.</p>
              </div>

              <div>
                <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--color-on-surface)' }}>
                  <IndianRupee size={13} style={{ color: 'var(--color-danger)' }} />
                  Overdue Fine Rate (Rs. / Day)
                </label>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  value={settings.fine_per_day}
                  onChange={e => setSettings({ ...settings, fine_per_day: e.target.value })}
                  required
                  className="input font-semibold font-mono"
                  style={{ color: 'var(--color-danger)' }}
                />
                <p className="text-[11px] mt-1" style={{ color: 'var(--color-on-surface-muted)' }}>Daily penalty charged automatically for each day past due date.</p>
              </div>
            </div>
          </Card>

          {/* Seat Booking Policies */}
          <Card className="space-y-5">
            <h3 className="text-base font-bold flex items-center gap-2 pb-3 border-b" style={{ color: 'var(--color-on-surface)', borderColor: 'var(--color-outline-variant)' }}>
              <Clock size={16} style={{ color: 'var(--color-tertiary)' }} />
              Seat Reservation & QR Pass Settings
            </h3>

            <div>
              <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--color-on-surface)' }}>
                <Clock size={13} style={{ color: 'var(--color-tertiary)' }} />
                Check-In Grace Window (Minutes)
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={settings.seat_grace_minutes}
                onChange={e => setSettings({ ...settings, seat_grace_minutes: e.target.value })}
                required
                className="input font-semibold max-w-xs"
              />
              <p className="text-[11px] mt-1" style={{ color: 'var(--color-on-surface-muted)' }}>Grace time before unattended reserved seats are auto-released.</p>
            </div>
          </Card>

          {/* Save Action */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="submit"
              loading={saving}
              icon={Save}
              className="px-8 shadow-glow-primary"
            >
              Save Library Settings
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
};

export default LibrarySettingsPage;
