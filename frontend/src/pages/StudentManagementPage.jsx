import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  UserCheck,
  UserX,
  AlertTriangle,
  BookOpen,
  IndianRupee,
  GraduationCap,
  Mail,
  Phone,
  Eye,
  ShieldAlert,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import AppShell from '../components/AppShell';
import Card from '../components/Card';
import Modal from '../components/Modal';
import Button from '../components/Button';
import Badge from '../components/Badge';
import SkeletonLoader from '../components/SkeletonLoader';
import { analyticsApi } from '../services/apiServices';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const StudentManagementPage = () => {
  const { isHeadLibrarian } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await analyticsApi.getStudents({ search: search.trim() || undefined, limit: 50 });
      setStudents(res.data.students || []);
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
      // Update local state
      setStudents(prev => prev.map(s =>
        s.student_id === student.student_id ? { ...s, is_active: !s.is_active } : s
      ));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update student status');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <AppShell title="Student Directory">
      {/* Search Header */}
      <div className="card flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by student name, enrollment no, or email..."
            className="input pl-9"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 self-end sm:self-auto">
          <span>Total Students: <strong className="text-white">{students.length}</strong></span>
        </div>
      </div>

      {/* Student List */}
      {loading ? (
        <SkeletonLoader variant="table-row" count={6} />
      ) : students.length === 0 ? (
        <Card>
          <div className="text-center py-16 text-slate-400 flex flex-col items-center gap-3">
            <Users size={48} className="text-slate-600" />
            <p className="text-base font-semibold text-white">No students matched</p>
            <p className="text-sm text-slate-500">Check spelling or search by enrollment number.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {students.map((student, idx) => {
            const hasUnpaidFines = parseFloat(student.unpaid_fines) > 0;
            const activeIssues = parseInt(student.active_issues) || 0;

            return (
              <motion.div
                key={student.student_id}
                className={`card flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all
                  ${!student.is_active ? 'opacity-60 bg-danger-950/10 border-danger-900/30' : ''}
                `}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: student.is_active ? 1 : 0.6, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.03 }}
              >
                {/* Left: Avatar & Personal Info */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base flex-shrink-0
                    ${student.is_active ? 'bg-primary-900/70 border border-primary-500/30 text-primary-300' : 'bg-danger-900/50 text-danger-300 border border-danger-500/30'}
                  `}>
                    {student.name?.charAt(0) || 'S'}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-white text-base truncate">{student.name}</h4>
                      <Badge variant={student.is_active ? 'available' : 'overdue'}>
                        {student.is_active ? 'Active' : 'Suspended'}
                      </Badge>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-bg-600 text-slate-300 border border-white/5">
                        {student.enrollment_no}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <GraduationCap size={13} className="text-primary-400" />
                        {student.department} · {student.course} ({student.year ? `Yr ${student.year}` : ''})
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail size={13} className="text-slate-500" />
                        {student.email}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Metrics & Actions */}
                <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-0 border-white/5">
                  {/* Active books stat */}
                  <div className="text-left md:text-right">
                    <p className="text-[11px] text-slate-500">Borrowed Books</p>
                    <p className="text-sm font-bold text-white flex items-center md:justify-end gap-1">
                      <BookOpen size={14} className="text-primary-400" />
                      {activeIssues} active
                    </p>
                  </div>

                  {/* Fines stat */}
                  <div className="text-left md:text-right">
                    <p className="text-[11px] text-slate-500">Unpaid Fines</p>
                    <p className={`text-sm font-bold ${hasUnpaidFines ? 'text-danger-400' : 'text-success-400'}`}>
                      Rs. {parseFloat(student.unpaid_fines).toFixed(2)}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Eye}
                      onClick={() => setSelectedStudent(student)}
                      className="text-xs"
                      title="View Student Details"
                    >
                      Details
                    </Button>

                    <Button
                      variant={student.is_active ? 'danger' : 'primary'}
                      size="sm"
                      icon={student.is_active ? UserX : UserCheck}
                      loading={actionLoadingId === student.student_id}
                      onClick={() => handleToggleStatus(student)}
                      className="text-xs"
                    >
                      {student.is_active ? 'Suspend' : 'Activate'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
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
            <div className="card bg-bg-700/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">{selectedStudent.name}</h3>
                <Badge variant={selectedStudent.is_active ? 'available' : 'overdue'}>
                  {selectedStudent.is_active ? 'Active Library Privileges' : 'Account Suspended'}
                </Badge>
              </div>
              <p className="text-xs font-mono text-primary-300">Enrollment: {selectedStudent.enrollment_no}</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-2 border-t border-white/5">
                <div><span className="text-slate-500">Department:</span> {selectedStudent.department}</div>
                <div><span className="text-slate-500">Course:</span> {selectedStudent.course}</div>
                <div><span className="text-slate-500">Email:</span> {selectedStudent.email}</div>
                <div><span className="text-slate-500">Phone:</span> {selectedStudent.phone || 'Not provided'}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="card p-3 text-center">
                <p className="text-xs text-slate-400">Currently Borrowed</p>
                <p className="text-2xl font-bold text-primary-400 font-display mt-1">
                  {selectedStudent.active_issues}
                </p>
              </div>
              <div className="card p-3 text-center">
                <p className="text-xs text-slate-400">Unpaid Fines</p>
                <p className={`text-2xl font-bold font-display mt-1 ${parseFloat(selectedStudent.unpaid_fines) > 0 ? 'text-danger-400' : 'text-success-400'}`}>
                  Rs. {parseFloat(selectedStudent.unpaid_fines).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setSelectedStudent(null)}>
                Close
              </Button>
              <Button
                variant={selectedStudent.is_active ? 'danger' : 'primary'}
                onClick={() => {
                  handleToggleStatus(selectedStudent);
                  setSelectedStudent(s => ({ ...s, is_active: !s.is_active }));
                }}
              >
                {selectedStudent.is_active ? 'Suspend Account' : 'Reactivate Account'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  );
};

export default StudentManagementPage;
