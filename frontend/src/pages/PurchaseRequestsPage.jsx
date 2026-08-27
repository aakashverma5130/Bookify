import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PackagePlus,
  CheckCircle2,
  XCircle,
  Clock,
  BookPlus,
  MessageSquare,
  Search,
  Check,
  X,
  User,
  Filter
} from 'lucide-react';
import AppShell from '../components/AppShell';
import Card from '../components/Card';
import Modal from '../components/Modal';
import Button from '../components/Button';
import Badge from '../components/Badge';
import SkeletonLoader from '../components/SkeletonLoader';
import { purchaseApi } from '../services/apiServices';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const PurchaseRequestsPage = () => {
  const { isLibrarian, isStudent } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  // Submit new request modal (student)
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestForm, setRequestForm] = useState({
    title: '',
    author: '',
    isbn: '',
    reason: ''
  });

  // Decision modal (librarian)
  const [reviewingRequest, setReviewingRequest] = useState(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [decisionLoading, setDecisionLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await purchaseApi.getAll();
      setRequests(res.data.requests || []);
    } catch {
      toast.error('Failed to load book purchase requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!requestForm.title || !requestForm.reason) {
      toast.error('Book title and reason are required');
      return;
    }
    setSubmitting(true);
    try {
      await purchaseApi.create(requestForm);
      toast.success('Book purchase request submitted for review!');
      setShowSubmitModal(false);
      setRequestForm({ title: '', author: '', isbn: '', reason: '' });
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecision = async (status) => {
    if (!reviewingRequest) return;
    setDecisionLoading(true);
    try {
      await purchaseApi.decide(reviewingRequest.request_id, {
        status,
        librarianNotes: decisionNotes.trim() || undefined
      });
      toast.success(`Request marked as ${status}`);
      setReviewingRequest(null);
      setDecisionNotes('');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update request');
    } finally {
      setDecisionLoading(false);
    }
  };

  const filtered = requests.filter(r => {
    const matchesFilter = filterStatus === 'ALL' || r.status === filterStatus;
    const matchesSearch =
      !search.trim() ||
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.author?.toLowerCase().includes(search.toLowerCase()) ||
      r.student_name?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED': return <Badge variant="available">Approved</Badge>;
      case 'REJECTED': return <Badge variant="overdue">Rejected</Badge>;
      case 'ORDERED':  return <Badge variant="issued">Ordered / In Transit</Badge>;
      default:         return <Badge variant="due-soon">Pending Review</Badge>;
    }
  };

  return (
    <AppShell title={isLibrarian ? "Student Book Acquisition Requests" : "Request a New Book"}>
      {/* Top Banner / Action Header */}
      <div className="card flex flex-col md:flex-row items-center justify-between gap-4 mb-6 p-6">
        <div>
          <h2 className="text-xl font-bold text-white font-display">
            {isLibrarian ? "Review Library Acquisition Proposals" : "Can't find a book in our catalog?"}
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            {isLibrarian
              ? "Approve or decline book procurement requests submitted by students and faculty."
              : "Suggest textbooks, research journals, or reference guides for library procurement."}
          </p>
        </div>

        {isStudent && (
          <Button
            onClick={() => setShowSubmitModal(true)}
            icon={BookPlus}
            className="shadow-glow-primary"
          >
            Submit Book Request
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="card flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search request by title, author, or student name..."
            className="input pl-9"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="input py-2 text-xs w-44"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="ORDERED">Ordered</option>
        </select>
      </div>

      {/* Requests List */}
      {loading ? (
        <SkeletonLoader variant="table-row" count={5} />
      ) : filtered.length === 0 ? (
        <Card>
          <div className="text-center py-16 text-slate-400 flex flex-col items-center gap-3">
            <PackagePlus size={48} className="text-slate-600" />
            <p className="text-base font-semibold text-white">No purchase requests found</p>
            <p className="text-sm text-slate-500">
              {isStudent ? "Click 'Submit Book Request' above to request an addition to the library." : "No student requests awaiting review."}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((req, idx) => (
            <motion.div
              key={req.request_id}
              className="card flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.03 }}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h4 className="font-bold text-white text-base truncate">{req.title}</h4>
                  {getStatusBadge(req.status)}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mb-2">
                  <span>Author: <strong className="text-slate-300">{req.author || 'Not specified'}</strong></span>
                  {req.isbn && <span className="font-mono">ISBN: {req.isbn}</span>}
                  {isLibrarian && (
                    <span className="text-primary-300 flex items-center gap-1">
                      <User size={12} /> {req.student_name} ({req.enrollment_no})
                    </span>
                  )}
                  <span className="text-slate-500">
                    Requested: {format(new Date(req.created_at), 'dd MMM yyyy')}
                  </span>
                </div>

                {req.reason && (
                  <div className="p-2.5 rounded-lg bg-bg-600/40 border border-white/5 text-xs text-slate-300">
                    <span className="text-slate-500 font-semibold mr-1">Justification:</span>
                    {req.reason}
                  </div>
                )}

                {req.librarian_notes && (
                  <div className="mt-2 text-xs text-accent-cyan flex items-center gap-1.5 font-medium">
                    <MessageSquare size={13} />
                    <span>Librarian Note: {req.librarian_notes}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons for Librarians */}
              {isLibrarian && req.status === 'PENDING' && (
                <div className="flex items-center gap-2 self-end md:self-center">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={Check}
                    onClick={() => {
                      setReviewingRequest(req);
                      setDecisionNotes('');
                    }}
                    className="text-xs"
                  >
                    Review Request
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Student Submit Request Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit New Book Purchase Request"
      >
        <form onSubmit={handleSubmitRequest} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Book Title *</label>
            <input
              value={requestForm.title}
              onChange={e => setRequestForm({ ...requestForm, title: e.target.value })}
              placeholder="e.g. Designing Data-Intensive Applications"
              required
              className="input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Author / Editor</label>
              <input
                value={requestForm.author}
                onChange={e => setRequestForm({ ...requestForm, author: e.target.value })}
                placeholder="e.g. Martin Kleppmann"
                className="input"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">ISBN (Optional)</label>
              <input
                value={requestForm.isbn}
                onChange={e => setRequestForm({ ...requestForm, isbn: e.target.value })}
                placeholder="e.g. 978-1449373320"
                className="input font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Academic Reason / Syllabus Need *</label>
            <textarea
              value={requestForm.reason}
              onChange={e => setRequestForm({ ...requestForm, reason: e.target.value })}
              placeholder="Explain how this book assists in coursework, research, or semester projects..."
              rows={3}
              required
              className="input resize-none"
            />
          </div>

          <div className="flex gap-3 pt-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowSubmitModal(false)}
              className="flex-1 justify-center"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              icon={BookPlus}
              className="flex-1 justify-center"
            >
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Librarian Decision Modal */}
      <Modal
        isOpen={!!reviewingRequest}
        onClose={() => setReviewingRequest(null)}
        title="Review Procurement Request"
      >
        {reviewingRequest && (
          <div className="space-y-4">
            <div className="card bg-bg-700/50 p-4 space-y-1">
              <h3 className="font-bold text-white text-base">{reviewingRequest.title}</h3>
              <p className="text-xs text-slate-400">Author: {reviewingRequest.author || 'N/A'}</p>
              <p className="text-xs text-slate-400">
                Requested by: <strong className="text-primary-300">{reviewingRequest.student_name}</strong> ({reviewingRequest.enrollment_no})
              </p>
              <p className="text-xs text-slate-300 pt-2 border-t border-white/5 italic">
                "{reviewingRequest.reason}"
              </p>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Reviewer Feedback Notes (Optional)</label>
              <textarea
                value={decisionNotes}
                onChange={e => setDecisionNotes(e.target.value)}
                placeholder="e.g. Approved for semester procurement from distributor..."
                rows={3}
                className="input resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="danger"
                loading={decisionLoading}
                icon={XCircle}
                onClick={() => handleDecision('REJECTED')}
                className="flex-1 justify-center"
              >
                Reject Request
              </Button>
              <Button
                variant="primary"
                loading={decisionLoading}
                icon={CheckCircle2}
                onClick={() => handleDecision('APPROVED')}
                className="flex-1 justify-center"
              >
                Approve & Order
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  );
};

export default PurchaseRequestsPage;
