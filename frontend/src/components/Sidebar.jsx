import { NavLink, useNavigate } from 'react-router-dom';
import logoSrc from '../assets/logo.png';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, BookMarked, RotateCcw,
  BarChart2, Users, Scan, Package, Settings,
  ArrowLeftRight, LogOut, BrainCircuit,
  Calendar, ChevronLeft, ChevronRight, Library,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const LibrarianNav = [
  { label: 'Dashboard',     to: '/lib/dashboard',    icon: LayoutDashboard },
  { label: 'Catalog',       to: '/lib/books',         icon: BookOpen },
  { label: 'Issue / Return',to: '/lib/circulation',   icon: ArrowLeftRight },
  { label: 'Reservations',  to: '/lib/reservations',  icon: BookMarked },
  { label: 'Digital Shelf', to: '/lib/digital',       icon: Package },
  { label: 'Inventory',     to: '/lib/audit',          icon: Scan },
  { label: 'Analytics',     to: '/lib/analytics',     icon: BarChart2 },
  { label: 'AI Forecast',   to: '/lib/forecast',      icon: BrainCircuit },
  { label: 'Students',      to: '/lib/students',       icon: Users },
  { label: 'Purchase Reqs', to: '/lib/purchases',      icon: Package },
  { label: 'Settings',      to: '/lib/settings',       icon: Settings },
];

const StudentNav = [
  { label: 'Home',           to: '/student/home',       icon: LayoutDashboard },
  { label: 'Explore Books',  to: '/student/books',      icon: BookOpen },
  { label: 'My Books',       to: '/student/my-books',   icon: BookMarked },
  { label: 'Calendar',       to: '/student/calendar',   icon: Calendar },
  { label: 'Digital Shelf',  to: '/student/digital',    icon: Library },
  { label: 'Fines',          to: '/student/fines',       icon: RotateCcw },
  { label: 'Request a Book', to: '/student/purchase-request', icon: Package },
];

const Sidebar = ({ collapsed = false, onToggle }) => {
  const { user, isLibrarian, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = isLibrarian ? LibrarianNav : StudentNav;

  const handleLogout = async () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.aside
      className="fixed left-0 top-0 bottom-0 z-50 flex flex-col"
      style={{
        width: collapsed ? 72 : 240,
        background: 'var(--color-surface-dark)',
        boxShadow: 'var(--shadow-sidebar)',
      }}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Logo + collapse toggle */}
      <div
        className="flex items-center px-4 py-6 overflow-hidden"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div
          className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.15)' }}
        >
          <img src={logoSrc} alt="Bookify" className="w-8 h-8 object-contain" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              className="ml-3 flex-1 min-w-0"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-sm font-bold tracking-tight" style={{ color: '#ffffff' }}>Bookify</h1>
              <p className="text-[11px] capitalize truncate" style={{ color: 'rgba(242,240,243,0.55)' }}>
                {user?.role?.replace(/_/g, ' ').toLowerCase()}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={onToggle}
          className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center ml-auto transition-colors"
          style={{ color: 'rgba(242,240,243,0.5)' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(242,240,243,0.5)'; e.currentTarget.style.background = ''; }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {navItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-4 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer relative group
               ${isActive
                 ? 'text-white font-semibold'
                 : ''}`
            }
            style={({ isActive }) => isActive ? {
              background: 'rgba(255,255,255,0.10)',
              color: '#ffffff',
              borderLeft: '2px solid rgba(255,255,255,0.6)',
            } : {
              color: 'rgba(242,240,243,0.65)',
            }}
            onMouseEnter={e => {
              if (!e.currentTarget.classList.contains('active') && !e.currentTarget.getAttribute('aria-current')) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.color = 'rgba(242,240,243,0.9)';
              }
            }}
            onMouseLeave={e => {
              if (!e.currentTarget.getAttribute('aria-current')) {
                e.currentTarget.style.background = '';
                e.currentTarget.style.color = 'rgba(242,240,243,0.65)';
              }
            }}
            title={collapsed ? label : undefined}
          >
            <Icon size={17} className="flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  className="whitespace-nowrap text-sm"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>

            {/* Tooltip when collapsed */}
            {collapsed && (
              <div
                className="absolute left-full ml-2 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50"
                style={{
                  background: 'var(--color-surface-container-high)',
                  color: 'var(--color-on-surface)',
                  border: '1px solid var(--color-outline-variant)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                {label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-2 py-2 mb-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff' }}
            >
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate" style={{ color: '#ffffff' }}>{user?.name}</p>
              <p className="text-[10px] truncate" style={{ color: 'rgba(242,240,243,0.5)' }}>{user?.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-4 rounded-lg px-3 py-2.5 w-full text-sm font-medium transition-all duration-200 cursor-pointer"
          style={{ color: 'rgba(255,180,171,0.85)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(186,26,26,0.15)'; e.currentTarget.style.color = '#ffb4ab'; }}
          onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'rgba(255,180,171,0.85)'; }}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
