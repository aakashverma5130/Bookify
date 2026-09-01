import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import { UNAUTHORIZED_EVENT } from './services/api';

// Pages
import LoginPage              from './pages/LoginPage';
import StudentHome            from './pages/StudentHome';
import StudentMyBooksPage     from './pages/StudentMyBooksPage';
import BorrowingCalendarPage  from './pages/BorrowingCalendarPage';
import DigitalShelfPage       from './pages/DigitalShelfPage';
import PurchaseRequestsPage   from './pages/PurchaseRequestsPage';
import BookSearchPage         from './pages/BookSearchPage';
import BookDetailPage         from './pages/BookDetailPage';
import NotificationsPage      from './pages/NotificationsPage';

// Librarian Pages
import LibrarianDashboard     from './pages/LibrarianDashboard';
import CirculationPage        from './pages/CirculationPage';
import ReservationsPage       from './pages/ReservationsPage';
import InventoryAuditPage     from './pages/InventoryAuditPage';
import StudentManagementPage  from './pages/StudentManagementPage';
import AIForecastPage         from './pages/AIForecastPage';
import LibrarySettingsPage    from './pages/LibrarySettingsPage';

// ── Route guards ──────────────────────────────────────────────────────────────
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-900">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const LibrarianRoute = ({ children }) => {
  const { isAuthenticated, isLibrarian, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isLibrarian)     return <Navigate to="/student/home" replace />;
  return children;
};

const StudentRoute = ({ children }) => {
  const { isAuthenticated, isStudent, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isStudent)       return <Navigate to="/lib/dashboard" replace />;
  return children;
};

// ── Unauthorized listener ─────────────────────────────────────────────────────
// The Axios interceptor in `services/api.js` dispatches a custom event on 401
// (see UNAUTHORIZED_EVENT). This component must live INSIDE <BrowserRouter>
// so it can call `navigate` for a soft, client-side redirect — never a full
// page reload. This is the fix for the "page auto-refresh after login" bug.
const UnauthorizedListener = () => {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    const handler = () => {
      if (location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handler);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handler);
  }, [navigate, location.pathname]);
  return null;
};

// ── App routing ───────────────────────────────────────────────────────────────
const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route path="/login" element={<LoginPage />} />
    <Route path="/"      element={<Navigate to="/login" replace />} />

    {/* Shared protected */}
    <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
    <Route path="/books/:id"     element={<PrivateRoute><BookDetailPage /></PrivateRoute>} />

    {/* Student routes */}
    <Route path="/student/home"             element={<StudentRoute><StudentHome /></StudentRoute>} />
    <Route path="/student/books"            element={<StudentRoute><BookSearchPage /></StudentRoute>} />
    <Route path="/student/my-books"         element={<StudentRoute><StudentMyBooksPage /></StudentRoute>} />
    <Route path="/student/calendar"         element={<StudentRoute><BorrowingCalendarPage /></StudentRoute>} />
    <Route path="/student/digital"          element={<StudentRoute><DigitalShelfPage /></StudentRoute>} />
    <Route path="/student/fines"            element={<StudentRoute><StudentMyBooksPage /></StudentRoute>} />
    <Route path="/student/purchase-request" element={<StudentRoute><PurchaseRequestsPage /></StudentRoute>} />

    {/* Librarian routes */}
    <Route path="/lib/dashboard"    element={<LibrarianRoute><LibrarianDashboard /></LibrarianRoute>} />
    <Route path="/lib/books"        element={<LibrarianRoute><BookSearchPage /></LibrarianRoute>} />
    <Route path="/lib/circulation"  element={<LibrarianRoute><CirculationPage /></LibrarianRoute>} />
    <Route path="/lib/reservations" element={<LibrarianRoute><ReservationsPage /></LibrarianRoute>} />
    <Route path="/lib/digital"      element={<LibrarianRoute><DigitalShelfPage /></LibrarianRoute>} />
    <Route path="/lib/audit"        element={<LibrarianRoute><InventoryAuditPage /></LibrarianRoute>} />
    <Route path="/lib/analytics"    element={<LibrarianRoute><LibrarianDashboard /></LibrarianRoute>} />
    <Route path="/lib/forecast"     element={<LibrarianRoute><AIForecastPage /></LibrarianRoute>} />
    <Route path="/lib/students"     element={<LibrarianRoute><StudentManagementPage /></LibrarianRoute>} />
    <Route path="/lib/purchases"    element={<LibrarianRoute><PurchaseRequestsPage /></LibrarianRoute>} />
    <Route path="/lib/settings"     element={<LibrarianRoute><LibrarySettingsPage /></LibrarianRoute>} />

    {/* 404 */}
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <UnauthorizedListener />
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: 'var(--color-surface-container)',
              color: 'var(--color-on-surface)',
              border: '1px solid var(--color-outline-variant)',
              borderRadius: '8px',
              fontSize: '13px',
            },
            success: { iconTheme: { primary: 'var(--color-success)', secondary: 'var(--color-surface-container)' } },
            error:   { iconTheme: { primary: 'var(--color-danger)', secondary: 'var(--color-surface-container)' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
