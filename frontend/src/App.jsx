import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';

// Pages
import LoginPage              from './pages/LoginPage';
import StudentHome            from './pages/StudentHome';
import StudentMyBooksPage     from './pages/StudentMyBooksPage';
import BorrowingCalendarPage  from './pages/BorrowingCalendarPage';
import DigitalShelfPage       from './pages/DigitalShelfPage';
import PurchaseRequestsPage   from './pages/PurchaseRequestsPage';
import BookSearchPage         from './pages/BookSearchPage';
import BookDetailPage         from './pages/BookDetailPage';
import SeatBookingPage        from './pages/SeatBookingPage';
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
    <Route path="/student/seats"            element={<StudentRoute><SeatBookingPage /></StudentRoute>} />
    <Route path="/student/digital"          element={<StudentRoute><DigitalShelfPage /></StudentRoute>} />
    <Route path="/student/fines"            element={<StudentRoute><StudentMyBooksPage /></StudentRoute>} />
    <Route path="/student/purchase-request" element={<StudentRoute><PurchaseRequestsPage /></StudentRoute>} />

    {/* Librarian routes */}
    <Route path="/lib/dashboard"    element={<LibrarianRoute><LibrarianDashboard /></LibrarianRoute>} />
    <Route path="/lib/books"        element={<LibrarianRoute><BookSearchPage /></LibrarianRoute>} />
    <Route path="/lib/circulation"  element={<LibrarianRoute><CirculationPage /></LibrarianRoute>} />
    <Route path="/lib/reservations" element={<LibrarianRoute><ReservationsPage /></LibrarianRoute>} />
    <Route path="/lib/seats"        element={<LibrarianRoute><SeatBookingPage /></LibrarianRoute>} />
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
  <AuthProvider>
    <BrowserRouter>
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#13132d',
            color: '#f8fafc',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '12px',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#13132d' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#13132d' } },
        }}
      />
    </BrowserRouter>
  </AuthProvider>
);

export default App;
