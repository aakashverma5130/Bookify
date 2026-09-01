import { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const EXPANDED_WIDTH = 240;
const COLLAPSED_WIDTH = 72;

/**
 * AppShell — wraps all authenticated pages with sidebar + topbar.
 */
const AppShell = ({ children, title }) => {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background)' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <TopBar
        sidebarWidth={sidebarWidth}
        onToggleSidebar={() => setCollapsed(c => !c)}
        title={title}
      />
      <main
        className="transition-all duration-300"
        style={{ marginLeft: sidebarWidth, paddingTop: 64 }}
      >
        <div className="p-6 max-w-screen-2xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppShell;
