import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, RotateCcw, RefreshCw, Search, Scan } from 'lucide-react';
import AppShell from '../components/AppShell';
import Card from '../components/Card';
import Modal from '../components/Modal';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { circulationApi } from '../services/apiServices';
import useScanner from '../hooks/useScanner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const CirculationPage = () => {
  const [activeTab, setActiveTab]   = useState('issue'); // issue | return | renew
  const [issueForm, setIssueForm]   = useState({ studentId: '', copyId: '' });
  const [returnForm, setReturnForm] = useState({ issueId: '', condition: 'GOOD', notes: '' });
  const [renewForm, setRenewForm]   = useState({ issueId: '' });
  const [loading, setLoading]       = useState(false);
  const [lastResult, setLastResult] = useState(null);

  // Barcode scanner support — listens for quick keypress sequences
  const [scanTarget, setScanTarget] = useState('copyId'); // which field the scanner fills
  useScanner((scanned) => {
    if (activeTab === 'issue') {
      if (scanTarget === 'copyId') setIssueForm(f => ({ ...f, copyId: scanned }));
      else setIssueForm(f => ({ ...f, studentId: scanned }));
    } else if (activeTab === 'return') {
      setReturnForm(f => ({ ...f, issueId: scanned }));
    }
    toast.success(`Scanned: ${scanned}`, { icon: '📡', duration: 1500 });
  });

  const handleIssue = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await circulationApi.issue(issueForm);
      setLastResult({ type: 'issue', ...res.data });
      toast.success(`Book issued! Due: ${res.data.dueDate}`);
      setIssueForm({ studentId: '', copyId: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to issue book');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await circulationApi.return(returnForm.issueId, {
        condition: returnForm.condition,
        notes: returnForm.notes,
      });
      setLastResult({ type: 'return', ...res.data });
      toast.success('Book returned!');
      setReturnForm({ issueId: '', condition: 'GOOD', notes: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to return book');
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await circulationApi.renew(renewForm.issueId);
      setLastResult({ type: 'renew', ...res.data });
      toast.success(`Renewed! New due date: ${res.data.newDueDate}`);
      setRenewForm({ issueId: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to renew');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: 'issue',  label: 'Issue Book',   icon: CheckCircle },
    { key: 'return', label: 'Return Book',  icon: RotateCcw    },
    { key: 'renew',  label: 'Renew Book',   icon: RefreshCw    },
  ];

  return (
    <AppShell title="Issue / Return">
      <div className="max-w-2xl mx-auto">

        {/* Scanner status banner */}
        <div className="card mb-6 flex items-center gap-3 py-3">
          <div className="w-2 h-2 rounded-full bg-success-400 animate-pulse" />
          <Scan size={16} className="text-success-400" />
          <span className="text-xs text-slate-300">
            Barcode scanner active — scan a copy QR/barcode to auto-fill
            {activeTab === 'issue' && (
              <button
                onClick={() => setScanTarget(t => t === 'copyId' ? 'studentId' : 'copyId')}
                className="ml-2 text-primary-400 hover:text-primary-300 underline underline-offset-2"
              >
                (now filling: {scanTarget === 'copyId' ? 'Copy ID' : 'Student ID'})
              </button>
            )}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 p-1 rounded-2xl bg-bg-700">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setActiveTab(key); setLastResult(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${activeTab === key ? 'bg-primary-700 text-white shadow-glow-primary' : 'text-slate-400 hover:text-white'}`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Issue form */}
        {activeTab === 'issue' && (
          <Card>
            <form onSubmit={handleIssue} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Student ID</label>
                <input value={issueForm.studentId}
                  onChange={e => setIssueForm(f => ({ ...f, studentId: e.target.value }))}
                  placeholder="Scan or type student ID…"
                  required className="input" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Book Copy ID / Accession No.</label>
                <input value={issueForm.copyId}
                  onChange={e => setIssueForm(f => ({ ...f, copyId: e.target.value }))}
                  placeholder="Scan barcode or enter copy ID…"
                  required className="input" />
              </div>
              <Button type="submit" className="w-full justify-center" loading={loading} icon={CheckCircle}>
                Issue Book
              </Button>
            </form>
          </Card>
        )}

        {/* Return form */}
        {activeTab === 'return' && (
          <Card>
            <form onSubmit={handleReturn} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Issue ID (scan copy barcode)</label>
                <input value={returnForm.issueId}
                  onChange={e => setReturnForm(f => ({ ...f, issueId: e.target.value }))}
                  placeholder="Scan barcode or enter issue ID…"
                  required className="input" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Book Condition</label>
                <select value={returnForm.condition}
                  onChange={e => setReturnForm(f => ({ ...f, condition: e.target.value }))}
                  className="input">
                  <option value="GOOD">Good — No damage</option>
                  <option value="DAMAGED">Damaged</option>
                </select>
              </div>
              {returnForm.condition === 'DAMAGED' && (
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Damage Notes</label>
                  <textarea value={returnForm.notes}
                    onChange={e => setReturnForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Describe the damage…" rows={3}
                    className="input resize-none" />
                </div>
              )}
              <Button type="submit" className="w-full justify-center" loading={loading} icon={RotateCcw}>
                Process Return
              </Button>
            </form>
          </Card>
        )}

        {/* Renew form */}
        {activeTab === 'renew' && (
          <Card>
            <form onSubmit={handleRenew} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Issue ID</label>
                <input value={renewForm.issueId}
                  onChange={e => setRenewForm(f => ({ ...f, issueId: e.target.value }))}
                  placeholder="Enter issue ID…"
                  required className="input" />
              </div>
              <Button type="submit" className="w-full justify-center" loading={loading} icon={RefreshCw}>
                Renew Book
              </Button>
            </form>
          </Card>
        )}

        {/* Result card */}
        {lastResult && (
          <motion.div
            className="mt-6 card"
            style={{ borderColor: 'rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.05)' }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={18} className="text-success-400" />
              <p className="font-bold text-white">
                {lastResult.type === 'issue'  ? 'Book Issued'   :
                 lastResult.type === 'return' ? 'Book Returned' : 'Book Renewed'}
              </p>
            </div>
            {lastResult.type === 'issue' && (
              <div className="text-sm space-y-1 text-slate-300">
                <p>Issue ID: <code className="text-primary-300">{lastResult.issueId}</code></p>
                <p>Book: <strong className="text-white">{lastResult.bookTitle}</strong></p>
                <p>Due: <strong className="text-warning-400">{lastResult.dueDate}</strong></p>
              </div>
            )}
            {lastResult.type === 'return' && (
              <div className="text-sm space-y-1 text-slate-300">
                <p>Overdue days: <strong className={lastResult.overdueDays > 0 ? 'text-danger-400' : 'text-success-400'}>{lastResult.overdueDays}</strong></p>
                <p>Fine: <strong className={lastResult.fineAmount > 0 ? 'text-danger-400' : 'text-success-400'}>Rs. {lastResult.fineAmount}</strong></p>
                {lastResult.nextInQueue && <p>Next student in queue notified ✅</p>}
              </div>
            )}
            {lastResult.type === 'renew' && (
              <p className="text-sm text-slate-300">
                New due date: <strong className="text-warning-400">{lastResult.newDueDate}</strong>
                {' '}(Renewal #{lastResult.renewalCount})
              </p>
            )}
          </motion.div>
        )}
      </div>
    </AppShell>
  );
};

export default CirculationPage;
