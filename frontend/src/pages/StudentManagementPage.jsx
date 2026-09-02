import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  UserCheck,
  UserX,
  BookOpen,
  GraduationCap,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import Modal from '../components/Modal';
import Button from '../components/Button';
import Badge from '../components/Badge';
import SkeletonLoader from '../components/SkeletonLoader';
import { analyticsApi } from '../services/apiServices';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

// Avatar colour palette â€” cycles through distinct tones
const AVATAR_COLORS = [
  { bg: 'var(--color-primary-container)', color: 'var(--color-primary)' },
  { bg: 'color-mix(in srgb, var(--color-secondary-container) 60%, transparent)', color: 'var(--color-secondary)' },
  { bg: 'color-mix(in srgb, var(--color-success) 12%, transparent)', color: 'var(--color-success)' },
  { bg: 'color-mix(in srgb, var(--color-warning) 14%, transparent)', color: 'color-mix(in srgb, var(--color-warning) 80%, #7a5800)' },
];

const PAGE_SIZE = 15;

const StudentManagementPage = () => {
  const { isHeadLibrarian } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [page, setPage] = useState(1);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await analyticsApi.getStudents({ search: search.trim() || undefined, limit: 100 });
      setStudents(res.data.students || []);
      setPage(1);
    } catch {
      toast.error('Failed to load students directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  const handleToggleStatus = async (student) => {
    setActionLoadingId(student.student_id);
    try {
      if (student.is_active) {
        await analyticsApi.suspendStudent(student.student_id);
        toast.success(`Account for ${student.name} suspended`);
      } else {
        await analyticsApi.activateStudent(student.student_id);
        toast.success(`Account for ${student.name} activated`);
      }
      setStudents(prev =>
        prev.map(s =>
          s.student_id === student.student_id ? { ...s, is_active: !s.is_active } : s
        )
      );
      if (selectedStudent?.student_id === student.student_id) {
        setSelectedStudent(s => s ? { ...s, is_active: !s.is_active } : s);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update student status');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Client-side status filter
  const filtered = students.filter(s => {
    if (statusFilter === 'ACTIVE') return s.is_active;
    if (statusFilter === 'SUSPENDED') return !s.is_active;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <AppShell title="Student Directory">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold font-display" style={{ color: 'var(--color-primary)' }}>
            Manage Students
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-on-surface-variant)' }}>
            View and manage library memberships across departments
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div
        className="rounded-xl p-4 mb-6 flex flex-wrap gap-4 items-center"
        style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)' }}
      >
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-on-surface-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, enrollment no., or emailâ€¦"
            className="input pl-9 text-sm"
          />
        </div>

        {/* Status filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-on-surface-muted)' }}>
            Status
          </label>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="input py-2 text-xs w-36"
          >
            <option value="ALL">Any Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>

        <div className="flex items-center gap-1 text-xs ml-auto" style={{ color: 'var(--color-on-surface-muted)' }}>
          <Filter size={12} />
          <span>
            <strong style={{ color: 'var(--color-on-surface)' }}>{filtered.length}</strong> result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonLoader variant="table-row" count={8} />
      ) : filtered.length === 0 ? (
        <div
          className="rounded-xl p-16 flex flex-col items-center gap-3 text-center"
          style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)' }}
        >
          <Users size={48} style={{ color: 'var(--color-on-surface-muted)' }} />
          <p className="text-base font-semibold" style={{ color: 'var(--color-on-surface)' }}>No students matched</p>
          <p className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>Try a different search term or filter.</p>
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--color-outline-variant)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ background: 'var(--color-surface-container-low)', borderBottom: '1px solid var(--color-outline-variant)' }}>
                  {['Student', 'Enrollment No.', 'Department & Course', 'Books', 'Unpaid Fine', 'Status', 'Actions'].map(col => (
                    <th
                      key={col}
                      className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
                      style={{ color: 'var(--color-on-surface-variant)' }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((student, idx) => {
                  const hasUnpaidFines = parseFloat(student.unpaid_fines) > 0;
                  const activeIssues = parseInt(student.active_issues) || 0;
                  const avatarStyle = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                  const initials = student.name
                    ? student.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
                    : 'ST';

                  return (
                    <motion.tr
                      key={student.student_id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(idx, 8) * 0.03 }}
                      className="group transition-colors"
                      style={{
                        borderBottom: '1px solid var(--color-outline-variant)',
                        background: !student.is_active
                          ? 'color-mix(in srgb, var(--color-danger) 4%, var(--color-surface-container-lowest))'
                          : 'var(--color-surface-container-lowest)',
                        opacity: student.is_active ? 1 : 0.7,
                      }}
                    >
                      {/* Student Name + Email */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: avatarStyle.bg, color: avatarStyle.color }}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <button
                              className="text-sm font-semibold text-left hover:underline"
                              style={{ color: 'var(--color-on-surface)' }}
                              onClick={() => setSelectedStudent(student)}
                            >
                              {student.name}
                            </button>
                            <p className="text-[11px] truncate" style={{ color: 'var(--color-on-surface-muted)' }}>
                              {student.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Enrollment No */}
                      <td className="px-5 py-4">
                        <span
                          className="text-xs font-mono px-2 py-0.5 rounded"
                          style={{ background: 'var(--color-surface-container-low)', color: 'var(--color-on-surface)', border: '1px solid var(--color-outline-variant)' }}
                        >
                          {student.enrollment_no}
                        </span>
                      </td>

                      {/* Department & Course */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
                          <GraduationCap size={12} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                          <span className="truncate max-w-[160px]">
                            {student.department}{student.course ? ` Â· ${student.course}` : ''}
                            {student.year ? ` (Yr ${student.year})` : ''}
                          </span>
                        </div>
                      </td>

                      {/* Books Issued */}
                      <td className="px-5 py-4">
                        <div
                          className="flex items-center gap-1 text-sm font-semibold"
                          style={{ color: activeIssues > 0 ? 'var(--color-primary)' : 'var(--color-on-surface-muted)' }}
                        >
                          <BookOpen size={13} />
                          {activeIssues}
                        </div>
                      </td>

                      {/* Unpaid Fine */}
                      <td className="px-5 py-4">
                        <span
                          className="text-sm font-semibold"
                          style={{ color: hasUnpaidFines ? 'var(--color-danger)' : 'var(--color-success)' }}
                        >
                          {"\u20B9"}{parseFloat(student.unpaid_fines).toFixed(2)}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-4">
                        <Badge variant={student.is_active ? 'available' : 'overdue'}>
                          {student.is_active ? 'Active' : 'Suspended'}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: 'var(--color-on-surface-muted)' }}
                            title="View details"
                          >
                            <Eye size={16} />
                          </button>
                          {isHeadLibrarian && (
                            <button
                              onClick={() => handleToggleStatus(student)}
                              disabled={actionLoadingId === student.student_id}
                              className="p-1.5 rounded-lg transition-colors disabled:opacity-40"
                              style={{ color: student.is_active ? 'var(--color-danger)' : 'var(--color-success)' }}
                              title={student.is_active ? 'Suspend account' : 'Activate account'}
                            >
                              {actionLoadingId === student.student_id
                                ? <span className="text-[10px] font-mono">â€¦</span>
                                : student.is_active ? <UserX size={16} /> : <UserCheck size={16} />
                              }
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              className="px-5 py-3 flex items-center justify-between"
              style={{ borderTop: '1px solid var(--color-outline-variant)', background: 'var(--color-surface-container-lowest)' }}
            >
              <p className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
                Showing {(page - 1) * PAGE_SIZE + 1}â€“{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1 rounded disabled:opacity-30 transition-colors"
                  style={{ color: 'var(--color-on-surface-variant)' }}
                >
                  <ChevronLeft size={18} />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className="w-7 h-7 rounded text-xs font-semibold transition-colors"
                      style={page === p
                        ? { background: 'var(--color-primary)', color: 'var(--color-on-primary)' }
                        : { color: 'var(--color-on-surface)' }
                      }
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1 rounded disabled:opacity-30 transition-colors"
                  style={{ color: 'var(--color-on-surface-variant)' }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Student Details Modal */}
      <Modal
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        title="Student Profile & Library Record"
        size="md"
      >
        {selectedStudent && (
          <div className="space-y-4">
            {/* Profile header */}
            <div
              className="rounded-xl p-4 space-y-3"
              style={{ background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)' }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold flex-shrink-0"
                  style={{ background: 'var(--color-primary-container)', color: 'var(--color-primary)' }}
                >
                  {selectedStudent.name?.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() || 'ST'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold" style={{ color: 'var(--color-on-surface)' }}>
                      {selectedStudent.name}
                    </h3>
                    <Badge variant={selectedStudent.is_active ? 'available' : 'overdue'}>
                      {selectedStudent.is_active ? 'Active Library Privileges' : 'Account Suspended'}
                    </Badge>
                  </div>
                  <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--color-primary)' }}>
                    Enrollment: {selectedStudent.enrollment_no}
                  </p>
                </div>
              </div>

              <div
                className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs pt-3"
                style={{ borderTop: '1px solid var(--color-outline-variant)' }}
              >
                {[
                  ['Department', selectedStudent.department],
                  ['Course', selectedStudent.course],
                  ['Email', selectedStudent.email],
                  ['Phone', selectedStudent.phone || 'Not provided'],
                ].map(([label, val]) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span style={{ color: 'var(--color-on-surface-muted)' }}>{label}</span>
                    <span className="truncate" style={{ color: 'var(--color-on-surface)' }}>{val || 'â€”'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className="rounded-xl p-4 text-center"
                style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)' }}
              >
                <p className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>Currently Borrowed</p>
                <p className="text-3xl font-bold font-display mt-1" style={{ color: 'var(--color-primary)' }}>
                  {selectedStudent.active_issues}
                </p>
              </div>
              <div
                className="rounded-xl p-4 text-center"
                style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)' }}
              >
                <p className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>Unpaid Fines</p>
                <p
                  className="text-3xl font-bold font-display mt-1"
                  style={{ color: parseFloat(selectedStudent.unpaid_fines) > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}
                >
                  {"\u20B9"}{parseFloat(student.unpaid_fines).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" onClick={() => setSelectedStudent(null)}>Close</Button>
              {isHeadLibrarian && (
                <Button
                  variant={selectedStudent.is_active ? 'danger' : 'primary'}
                  loading={actionLoadingId === selectedStudent.student_id}
                  onClick={() => handleToggleStatus(selectedStudent)}
                >
                  {selectedStudent.is_active ? 'Suspend Account' : 'Reactivate Account'}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  );
};

export default StudentManagementPage;
