import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, BookMarked, RotateCcw,
  BarChart2, Users, Scan, Package, Settings,
  ArrowLeftRight, LogOut, Library, BrainCircuit,
  Calendar,
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
        background: 'linear-gradient(180deg, #0a0a1a 0%, #0f0f27 100%)',
        borderRight: '1px solid rgba(99,102,241,0.1)',
      }}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-6 overflow-hidden">
        <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
          <Library size={18} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-base font-bold text-white font-display tracking-tight">Bookify</h1>
              <p className="text-xs text-slate-500 capitalize">{user?.role?.replace('_', ' ').toLowerCase()}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''} relative group`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  className="text-sm whitespace-nowrap"
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
              <div className="absolute left-full ml-2 px-2 py-1 rounded-md bg-bg-600 text-white text-xs whitespace-nowrap
                opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50
                border border-white/10">
                {label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="p-3 border-t border-white/5">
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary-800 flex items-center justify-center text-xs font-bold text-primary-300">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-danger-400 hover:text-danger-300 hover:bg-danger-500/10"
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm">Logout</span>}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
