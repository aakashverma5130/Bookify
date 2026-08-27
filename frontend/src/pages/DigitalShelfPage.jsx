import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Download,
  BookOpen,
  Upload,
  Search,
  Filter,
  Eye,
  Lock,
  Clock,
  Sparkles,
  CheckCircle2,
  X,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Sun,
  Moon
} from 'lucide-react';
import AppShell from '../components/AppShell';
import Card from '../components/Card';
import Modal from '../components/Modal';
import Button from '../components/Button';
import Badge from '../components/Badge';
import SkeletonLoader from '../components/SkeletonLoader';
import { digitalApi } from '../services/apiServices';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const DigitalShelfPage = () => {
  const { isLibrarian, user } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedAccess, setSelectedAccess] = useState('ALL');

  // Reader state
  const [readingDoc, setReadingDoc] = useState(null);
  const [readerTheme, setReaderTheme] = useState('dark'); // 'dark' | 'sepia' | 'light'
  const [zoomLevel, setZoomLevel] = useState(100);

  // Upload modal state (librarian)
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    author: '',
    type: 'PDF',
    accessLevel: 'OPEN',
    restrictedCourse: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedType !== 'ALL') params.type = selectedType;
      if (selectedAccess !== 'ALL') params.access = selectedAccess;
      const res = await digitalApi.getAll(params);
      setResources(res.data.resources || []);
    } catch {
      toast.error('Failed to load digital shelf resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [selectedType, selectedAccess]);

  const filteredResources = resources.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.title?.toLowerCase().includes(q) ||
      r.author?.toLowerCase().includes(q) ||
      r.restricted_course?.toLowerCase().includes(q)
    );
  });

  const handleDownload = async (resource) => {
    try {
      const res = await digitalApi.download(resource.resource_id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${resource.title}.${resource.type?.toLowerCase() || 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Downloaded: ${resource.title}`);
      fetchResources();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Download failed or course restricted');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', uploadForm.title);
      formData.append('author', uploadForm.author);
      formData.append('type', uploadForm.type);
      formData.append('accessLevel', uploadForm.accessLevel);
      if (uploadForm.restrictedCourse) {
        formData.append('restrictedCourse', uploadForm.restrictedCourse);
      }

      await digitalApi.upload(formData);
      toast.success('Digital resource published to shelf!');
      setShowUploadModal(false);
      setUploadForm({ title: '', author: '', type: 'PDF', accessLevel: 'OPEN', restrictedCourse: '' });
      setSelectedFile(null);
      fetchResources();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to upload resource');
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <AppShell title="Digital Shelf">
      {/* Header Banner */}
      <div className="card relative overflow-hidden mb-6 p-6"
        style={{ background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.8) 0%, rgba(15, 15, 39, 0.9) 100%)' }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} className="text-accent-purple" />
              <span className="text-xs uppercase tracking-wider font-semibold text-primary-400">
                E-Library & Digital Repository
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white font-display">
              Read Online & Download Digital Textbooks
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Access digital course materials, syllabi, lecture notes, and e-books 24/7 without borrowing limits.
            </p>
          </div>

          {isLibrarian && (
            <Button
              onClick={() => setShowUploadModal(true)}
              icon={Upload}
              className="self-start md:self-auto shadow-glow-primary"
            >
              Upload Digital Resource
            </Button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search digital titles, authors, course codes..."
            className="input pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="input py-2 text-xs w-36"
          >
            <option value="ALL">All Types</option>
            <option value="PDF">PDF Documents</option>
            <option value="EPUB">EPUB E-Books</option>
            <option value="MOBI">MOBI E-Books</option>
          </select>

          {/* Access Filter */}
          <select
            value={selectedAccess}
            onChange={e => setSelectedAccess(e.target.value)}
            className="input py-2 text-xs w-44"
          >
            <option value="ALL">All Access Levels</option>
            <option value="OPEN">Open Access</option>
            <option value="COURSE_RESTRICTED">Course Restricted</option>
          </select>
        </div>
      </div>

      {/* Resource Grid */}
      {loading ? (
        <SkeletonLoader variant="book-card" count={8} />
      ) : filteredResources.length === 0 ? (
        <Card>
          <div className="text-center py-16 text-slate-400 flex flex-col items-center gap-3">
            <FileText size={48} className="text-slate-600" />
            <p className="text-base font-semibold text-white">No digital resources found</p>
            <p className="text-sm text-slate-500">Try adjusting your search criteria or filters.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredResources.map((res, i) => (
            <motion.div
              key={res.resource_id}
              className="card card-hover flex flex-col justify-between"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
            >
              <div>
                {/* Top badges */}
                <div className="flex items-center justify-between mb-3">
                  <Badge variant={res.type === 'PDF' ? 'issued' : res.type === 'EPUB' ? 'available' : 'warning'}>
                    {res.type}
                  </Badge>
                  {res.access_level === 'COURSE_RESTRICTED' ? (
                    <span className="badge bg-warning-500/20 text-warning-400 border border-warning-500/30 flex items-center gap-1 text-[10px]">
                      <Lock size={10} /> {res.restricted_course || 'Restricted'}
                    </span>
                  ) : (
                    <Badge variant="available">Open Access</Badge>
                  )}
                </div>

                {/* Title and Author */}
                <h3 className="font-bold text-white text-base line-clamp-2 mb-1" title={res.title}>
                  {res.title}
                </h3>
                <p className="text-xs text-slate-400 mb-3">{res.author || 'Author not specified'}</p>

                {/* Meta stats */}
                <div className="flex items-center gap-3 text-[11px] text-slate-500 mb-4 pt-2 border-t border-white/5">
                  <span className="flex items-center gap-1">
                    <Download size={12} /> {res.download_count || 0} downloads
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> ~{res.avg_read_time_mins || 45} mins
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => setReadingDoc(res)}
                  variant="secondary"
                  size="sm"
                  icon={Eye}
                  className="flex-1 text-xs justify-center"
                >
                  Read Now
                </Button>
                <Button
                  onClick={() => handleDownload(res)}
                  size="sm"
                  icon={Download}
                  className="text-xs px-3"
                  title="Download File"
                >
                  Download
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* In-Browser Document Reader Modal */}
      <Modal
        isOpen={!!readingDoc}
        onClose={() => setReadingDoc(null)}
        title={readingDoc?.title || 'E-Reader'}
        size="xl"
      >
        {readingDoc && (
          <div className="flex flex-col h-[75vh]">
            {/* Reader Toolbar */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Theme:</span>
                <button
                  onClick={() => setReaderTheme('dark')}
                  className={`px-2 py-1 rounded-md flex items-center gap-1 ${readerTheme === 'dark' ? 'bg-primary-600 text-white' : 'bg-bg-600 text-slate-300'}`}
                >
                  <Moon size={12} /> Dark
                </button>
                <button
                  onClick={() => setReaderTheme('sepia')}
                  className={`px-2 py-1 rounded-md flex items-center gap-1 ${readerTheme === 'sepia' ? 'bg-amber-800 text-amber-100' : 'bg-bg-600 text-slate-300'}`}
                >
                  <Sun size={12} /> Sepia
                </button>
                <button
                  onClick={() => setReaderTheme('light')}
                  className={`px-2 py-1 rounded-md flex items-center gap-1 ${readerTheme === 'light' ? 'bg-slate-200 text-slate-900 font-bold' : 'bg-bg-600 text-slate-300'}`}
                >
                  Light
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomLevel(z => Math.max(75, z - 15))}
                  className="p-1.5 rounded-lg bg-bg-600 hover:bg-bg-500 text-slate-300"
                  title="Zoom Out"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="text-slate-400 font-mono text-xs w-12 text-center">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel(z => Math.min(150, z + 15))}
                  className="p-1.5 rounded-lg bg-bg-600 hover:bg-bg-500 text-slate-300"
                  title="Zoom In"
                >
                  <ZoomIn size={14} />
                </button>
                <button
                  onClick={() => handleDownload(readingDoc)}
                  className="btn-secondary btn-sm flex items-center gap-1 ml-2"
                >
                  <Download size={12} /> Save
                </button>
              </div>
            </div>

            {/* Reader Content Pane */}
            <div
              className={`flex-1 overflow-y-auto p-8 rounded-xl transition-colors duration-300 shadow-inner
                ${readerTheme === 'dark' ? 'bg-bg-900 text-slate-200' :
                  readerTheme === 'sepia' ? 'bg-[#fbf0d9] text-[#5f4b32]' :
                  'bg-white text-slate-900'}
              `}
              style={{ fontSize: `${(zoomLevel / 100) * 1}rem` }}
            >
              <div className="max-w-2xl mx-auto space-y-6 leading-relaxed">
                <div className="text-center pb-6 border-b border-current/10">
                  <h1 className="text-2xl font-bold font-display">{readingDoc.title}</h1>
                  <p className="text-sm opacity-80 mt-1">by {readingDoc.author || 'Academic Faculty'}</p>
                  <span className="text-xs uppercase tracking-wider opacity-60 mt-2 inline-block">
                    Bookify Digital Archive · Format: {readingDoc.type}
                  </span>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold">Chapter 1: Foundations & Overview</h3>
                  <p>
                    This digital textbook resource is served directly through the Bookify Digital Shelf system.
                    All digital copies are optimized for rapid in-browser indexing, high readability across desktop and mobile devices,
                    and strict university IP access controls.
                  </p>
                  <p>
                    Academic curriculum materials provide in-depth theoretical analysis, practical lab tutorials, and review exercises.
                    Students can read continuously without time expirations or check-out queue locks.
                  </p>
                  <div className="p-4 rounded-lg bg-current/5 border border-current/10 my-4 text-sm italic">
                    "Knowledge belongs to all who seek it. Digital libraries ensure equal access without physical constraints."
                  </div>
                  <h3 className="text-lg font-bold">Chapter 2: Core Architectures</h3>
                  <p>
                    Systematic examination of modern database structures, relational integrity constraints, ACID properties,
                    and indexed multi-version concurrency control (MVCC).
                  </p>
                  <p>
                    Review questions at the end of each module provide self-assessment checks for university semester examinations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Librarian Upload Modal */}
      {isLibrarian && (
        <Modal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          title="Upload to Digital Shelf"
        >
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Document Title *</label>
              <input
                value={uploadForm.title}
                onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
                placeholder="e.g. Distributed Operating Systems - 4th Edition"
                required
                className="input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Author / Faculty</label>
                <input
                  value={uploadForm.author}
                  onChange={e => setUploadForm({ ...uploadForm, author: e.target.value })}
                  placeholder="e.g. Dr. A. Tanenbaum"
                  className="input"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Format *</label>
                <select
                  value={uploadForm.type}
                  onChange={e => setUploadForm({ ...uploadForm, type: e.target.value })}
                  className="input"
                >
                  <option value="PDF">PDF</option>
                  <option value="EPUB">EPUB</option>
                  <option value="MOBI">MOBI</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Access Policy *</label>
                <select
                  value={uploadForm.accessLevel}
                  onChange={e => setUploadForm({ ...uploadForm, accessLevel: e.target.value })}
                  className="input"
                >
                  <option value="OPEN">Open to All Students</option>
                  <option value="COURSE_RESTRICTED">Course Restricted</option>
                </select>
              </div>

              {uploadForm.accessLevel === 'COURSE_RESTRICTED' && (
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Course Code *</label>
                  <input
                    value={uploadForm.restrictedCourse}
                    onChange={e => setUploadForm({ ...uploadForm, restrictedCourse: e.target.value })}
                    placeholder="e.g. B.Tech CSE"
                    required
                    className="input"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Select File (.pdf, .epub, .mobi) *</label>
              <input
                type="file"
                accept=".pdf,.epub,.mobi"
                onChange={e => setSelectedFile(e.target.files[0] || null)}
                required
                className="input py-2 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-500 cursor-pointer"
              />
            </div>

            <div className="flex gap-3 pt-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowUploadModal(false)}
                className="flex-1 justify-center"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={uploadLoading}
                icon={Upload}
                className="flex-1 justify-center"
              >
                Upload Resource
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </AppShell>
  );
};

export default DigitalShelfPage;
