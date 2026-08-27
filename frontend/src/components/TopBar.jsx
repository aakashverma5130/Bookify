import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Bell, Search as SearchIcon, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const TopBar = ({ sidebarWidth, onToggleSidebar, title }) => {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      navigate(`/lib/books?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header
      className="fixed top-0 right-0 z-40 flex items-center h-16 px-6 gap-4"
      style={{
        left: sidebarWidth,
        background: 'rgba(15, 15, 39, 0.8)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(99,102,241,0.1)',
      }}
    >
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-bg-600 transition-colors"
      >
        <Menu size={18} />
      </button>

      {title && (
        <h1 className="page-title hidden sm:block">{title}</h1>
      )}

      {/* Quick search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md ml-auto">
        <div className="relative">
          <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Quick search..."
            className="input py-2 pl-9 text-xs"
          />
        </div>
      </form>

      {/* Notification bell */}
      <button
        onClick={() => navigate('/notifications')}
        className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-bg-600 transition-colors"
      >
        <Bell size={18} />
      </button>

      {/* User chip */}
      <div className="hidden sm:flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary-800 flex items-center justify-center text-xs font-bold text-primary-300">
          {user?.name?.charAt(0) || 'U'}
        </div>
        <div className="hidden md:block">
          <p className="text-xs font-medium text-white leading-tight">{user?.name}</p>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
