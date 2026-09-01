import { useState } from 'react';
import { Menu, Bell, Search as SearchIcon, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

const TopBar = ({ sidebarWidth, onToggleSidebar, title }) => {
  const { user, isLibrarian } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      // Bug fix: route students to /student/books, librarians to /lib/books
      const target = isLibrarian ? '/lib/books' : '/student/books';
      navigate(`${target}?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header
      className="fixed top-0 right-0 z-40 flex items-center h-16 px-4 gap-3"
      style={{
        left: sidebarWidth,
        background: 'color-mix(in srgb, var(--color-surface) 92%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-outline-variant)',
        transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-lg transition-colors flex-shrink-0"
        style={{ color: 'var(--color-on-surface-variant)' }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-on-surface)'; e.currentTarget.style.background = 'var(--color-surface-container-low)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-on-surface-variant)'; e.currentTarget.style.background = ''; }}
      >
        <Menu size={18} />
      </button>

      {title && (
        <h1 className="page-title hidden sm:block" style={{ fontSize: '1.05rem' }}>{title}</h1>
      )}

      {/* Quick search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-sm ml-auto">
        <div className="relative">
          <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-on-surface-muted)' }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search books..."
            className="input py-2 pl-9"
            style={{ fontSize: '0.8125rem' }}
          />
        </div>
      </form>

      {/* Theme toggle */}
      <button
        onClick={toggle}
        className="p-2 rounded-lg transition-all duration-200 flex-shrink-0"
        style={{ color: 'var(--color-on-surface-variant)' }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-on-surface)'; e.currentTarget.style.background = 'var(--color-surface-container-low)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-on-surface-variant)'; e.currentTarget.style.background = ''; }}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Notification bell */}
      <button
        onClick={() => navigate('/notifications')}
        className="relative p-2 rounded-lg transition-colors flex-shrink-0"
        style={{ color: 'var(--color-on-surface-variant)' }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-on-surface)'; e.currentTarget.style.background = 'var(--color-surface-container-low)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-on-surface-variant)'; e.currentTarget.style.background = ''; }}
      >
        <Bell size={18} />
      </button>

      {/* User avatar */}
      <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)' }}
        >
          {user?.name?.charAt(0) || 'U'}
        </div>
        <div className="hidden md:block">
          <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--color-on-surface)' }}>{user?.name}</p>
          <p className="text-[10px] leading-tight" style={{ color: 'var(--color-on-surface-variant)' }}>{user?.role?.replace(/_/g, ' ')}</p>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
