import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scan,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  MapPin,
  FileSpreadsheet,
  RotateCcw,
  Search,
  Sparkles,
  ArrowRight,
  Printer
} from 'lucide-react';
import AppShell from '../components/AppShell';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import SkeletonLoader from '../components/SkeletonLoader';
import useScanner from '../hooks/useScanner';
import { auditApi } from '../services/apiServices';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const InventoryAuditPage = () => {
  const [scanCode, setScanCode] = useState('');
  const [currentShelf, setCurrentShelf] = useState('Block A / Rack 1 / Shelf 2');
  const [notes, setNotes] = useState('');
  const [scanning, setScanning] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const [auditReport, setAuditReport] = useState({ summary: { verified: 0, misplaced: 0, missing: 0 }, entries: [] });
  const [loadingReport, setLoadingReport] = useState(true);

  // Auto-scan listener (hardware USB barcode scanner keyboard emulation)
  useScanner((scannedValue) => {
    handleScanSubmit(scannedValue);
  });

  const fetchReport = async () => {
    setLoadingReport(true);
    try {
      const res = await auditApi.getReport();
      setAuditReport(res.data || { summary: { verified: 0, misplaced: 0, missing: 0 }, entries: [] });
    } catch {
      toast.error('Failed to load audit history');
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleScanSubmit = async (codeToScan) => {
    const targetCode = (codeToScan || scanCode).trim();
    if (!targetCode) {
      toast.error('Please enter or scan an Accession No. or Barcode');
      return;
    }

    setScanning(true);
    try {
      const res = await auditApi.scan({
        qrCodeValue: targetCode,
        accessionNumber: targetCode,
        expectedShelf: currentShelf,
        notes: notes.trim() || undefined
      });

      const scanData = res.data;
      if (scanData.result === 'VERIFIED') {
        toast.success(`Verified: ${scanData.bookTitle} on correct shelf!`, { icon: '✅' });
      } else if (scanData.result === 'MISPLACED') {
        toast.error(`MISPLACED BOOK! Move to: ${scanData.currentShelf}`, { icon: '⚠️', duration: 5000 });
      }

      setRecentScans(prev => [scanData, ...prev.slice(0, 19)]);
      setScanCode('');
      setNotes('');
      fetchReport();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Scan failed — copy unregistered or invalid code');
    } finally {
      setScanning(false);
    }
  };

  const exportCSV = () => {
    if (!auditReport.entries.length) {
      toast.error('No audit records to export');
      return;
    }
    const headers = ['Audit ID', 'Book Title', 'Accession No', 'Result', 'Expected Shelf', 'Suggested Shelf', 'Scanned By', 'Scan Date'];
    const rows = auditReport.entries.map(e => [
      e.audit_id,
      `"${e.book_title || ''}"`,
      e.accession_number || '',
      e.result,
      `"${e.expected_shelf || ''}"`,
      `"${e.suggested_shelf || ''}"`,
      `"${e.scanned_by_name || ''}"`,
      format(new Date(e.scan_date), 'yyyy-MM-dd HH:mm:ss')
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `booksphere_inventory_audit_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Audit report exported as CSV');
  };

  return (
    <AppShell title="Inventory & Physical Shelf Audit">
      {/* Top Banner & Audit Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left 2 Cols: Scanner Terminal */}
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success-400 animate-ping" />
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Scan size={18} className="text-primary-400" />
                Live Barcode & QR Shelf Scanner
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Hardware Scanner: <span className="text-success-400 font-semibold">Active & Listening</span>
            </span>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleScanSubmit(); }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Current Auditing Shelf *</label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" />
                  <input
                    value={currentShelf}
                    onChange={e => setCurrentShelf(e.target.value)}
                    placeholder="e.g. Block A / Rack 1 / Shelf 2"
                    required
                    className="input pl-9 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Scan Barcode / Accession No *</label>
                <div className="relative">
                  <Scan size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    value={scanCode}
                    onChange={e => setScanCode(e.target.value)}
                    placeholder="Scan barcode or type ACC-1001..."
                    className="input pl-9 font-mono"
                    autoFocus
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <input
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Optional notes (e.g. physical wear, torn label)..."
                className="input text-xs flex-1"
              />
              <Button
                type="submit"
                loading={scanning}
                icon={Scan}
                className="px-6 shadow-glow-primary"
              >
                Log Scan
              </Button>
            </div>
          </form>
        </Card>

        {/* Right Col: Audit Summary Cards */}
        <div className="space-y-3">
          <div className="card p-4 flex items-center justify-between border-success-500/30 bg-success-950/10">
            <div>
              <p className="text-xs text-slate-400 font-medium">Verified Correctly</p>
              <p className="text-2xl font-bold text-success-400 font-display mt-0.5">
                {auditReport.summary?.verified || 0}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-success-500/20 text-success-400 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
          </div>

          <div className="card p-4 flex items-center justify-between border-danger-500/30 bg-danger-950/10">
            <div>
              <p className="text-xs text-slate-400 font-medium">Misplaced on Shelf</p>
              <p className="text-2xl font-bold text-danger-400 font-display mt-0.5">
                {auditReport.summary?.misplaced || 0}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-danger-500/20 text-danger-400 flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={FileSpreadsheet}
              onClick={exportCSV}
              className="flex-1 text-xs justify-center"
            >
              Export CSV
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={RotateCcw}
              onClick={fetchReport}
              className="text-xs"
              title="Refresh Audit Data"
            />
          </div>
        </div>
      </div>

      {/* Live Scan Results & Audit Log Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white text-base">Recent Audit Log & Shelf Verifications</h3>
          <span className="text-xs text-slate-400">Total Scans: {auditReport.entries?.length || 0}</span>
        </div>

        {loadingReport ? (
          <SkeletonLoader variant="table-row" count={5} />
        ) : auditReport.entries.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No copies scanned yet in this audit session. Start scanning items on the current shelf.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-400 border-b border-white/5 bg-bg-700/40">
                <tr>
                  <th className="py-3 px-4">Result</th>
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">Accession No</th>
                  <th className="py-3 px-4">Audited Shelf</th>
                  <th className="py-3 px-4">Assigned Location</th>
                  <th className="py-3 px-4">Scanned By</th>
                  <th className="py-3 px-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {auditReport.entries.slice(0, 25).map((entry) => (
                  <tr
                    key={entry.audit_id}
                    className={`hover:bg-bg-600/30 transition-colors
                      ${entry.result === 'MISPLACED' ? 'bg-danger-950/15' : ''}
                    `}
                  >
                    <td className="py-3 px-4">
                      <Badge variant={entry.result === 'VERIFIED' ? 'available' : entry.result === 'MISPLACED' ? 'overdue' : 'neutral'}>
                        {entry.result}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-semibold text-white max-w-xs truncate">
                      {entry.book_title}
                    </td>
                    <td className="py-3 px-4 font-mono text-primary-300 text-xs">
                      {entry.accession_number}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-300">
                      {entry.expected_shelf || '—'}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">
                      {entry.suggested_shelf || '—'}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">
                      {entry.scanned_by_name || 'Librarian'}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {format(new Date(entry.scan_date), 'dd MMM, HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AppShell>
  );
};

export default InventoryAuditPage;
