# FRONTEND_MIGRATION_PROGRESS.md
# Bookify — Stitch UI Migration Handover Document

> **Status:** ANALYSIS PHASE — No code changes made yet.
> **Last Updated:** 2026-09-01

---

## 1. OVERALL MIGRATION OBJECTIVE

Migrate the Bookify frontend UI to visually match the Stitch-generated designs as closely as possible, while preserving 100% of existing backend functionality, authentication, authorization, security, APIs, and business logic.

The Stitch designs are treated exclusively as the visual/presentation layer. All existing React hooks, API services, state management, routing guards, and data-flow logic must remain intact.

Core Principle:
```
Existing backend/API/security/business logic  [DO NOT TOUCH]
Existing frontend functionality and data flow [PRESERVE]
New Stitch visual presentation layer          [MIGRATE]
```

---

## 2. EXISTING BACKEND ARCHITECTURE

### Stack
- Runtime: Node.js + Express (CommonJS)
- Database: SQLite via config/db.js (WAL mode)
- Auth: JWT (HS256), localStorage as bookify_token / bookify_user
- Security: Helmet, CORS allow-list, express-rate-limit
- File serving: Authenticated-only via digitalResourceController
- Jobs: dailyReminderJob (08:00 daily), reservationExpiryJob (every 5 min)

### API Routes (all under /api/)
- /api/auth => authController.js
- /api/books => bookController.js
- /api/issues => circulationController.js
- /api/reservations => reservationController.js
- /api/digital-resources => digitalResourceController.js
- /api/purchase-requests => purchaseRequestController.js
- /api/admin => analyticsController.js + studentController.js
- /api/audit => auditController.js
- /api/notifications => notificationController.js
- /api/student => studentController.js

### PROTECTED BACKEND FILES (NEVER MODIFY)
- backend/server.js
- backend/config/db.js
- backend/controllers/ (all 10 files)
- backend/routes/ (all 11 files)
- backend/middleware/authMiddleware.js
- backend/middleware/roleMiddleware.js
- backend/middleware/validation.js
- backend/jobs/ (all job files)
- backend/logger.js
- backend/.env
- backend/package.json

---

## 3. AUTHENTICATION AND SECURITY

### Auth Flow
- Storage: localStorage (bookify_token, bookify_user)
- Hook: frontend/src/hooks/useAuth.jsx [PROTECTED]
- Interceptor: frontend/src/services/api.js [PROTECTED]
- Unauthorized listener: UnauthorizedListener in App.jsx

### User Roles
- STUDENT: isStudent=true, isLibrarian=false
- ASSISTANT_LIBRARIAN: isStudent=false, isLibrarian=true, isHeadLibrarian=false
- HEAD_LIBRARIAN: isStudent=false, isLibrarian=true, isHeadLibrarian=true

### Route Guards in App.jsx (DO NOT MODIFY LOGIC)
- PrivateRoute: any authenticated user
- StudentRoute: requires isStudent, else redirects to /lib/dashboard
- LibrarianRoute: requires isLibrarian, else redirects to /student/home

---

## 4. EXISTING FRONTEND ARCHITECTURE

### Framework and Tooling
- Framework: React 19 + Vite 8
- Styling: Tailwind CSS v3 + CSS Custom Properties (tokens.css)
- Animation: Framer Motion v13, GSAP v3
- Icons: Lucide React
- Routing: React Router v7
- Forms: React Hook Form + Zod
- Charts: Recharts
- Notifications: React Hot Toast
- HTTP client: Axios with JWT interceptors
- Font: Plus Jakarta Sans + JetBrains Mono

### Current AppShell Layout
- Sidebar: fixed left, 260px expanded / 72px collapsed, z-50
- TopBar: fixed top, height 64px, left=sidebarWidth, z-40
- Main: marginLeft=sidebarWidth, paddingTop=64px, p-6

### Existing Pages (16 total)
1. LoginPage.jsx => /login (Public) - Login + forgot/OTP/reset
2. StudentHome.jsx => /student/home (Student) - Dashboard + stats + books
3. StudentMyBooksPage.jsx => /student/my-books, /student/fines (Student) - Loans, history, fines
4. BookSearchPage.jsx => /student/books, /lib/books (Both) - Catalog search
5. BookDetailPage.jsx => /books/:id (Both) - Book detail + reserve
6. BorrowingCalendarPage.jsx => /student/calendar (Student) - Calendar view
7. DigitalShelfPage.jsx => /student/digital, /lib/digital (Both) - E-resources
8. PurchaseRequestsPage.jsx => /student/purchase-request, /lib/purchases (Both) - Requests
9. NotificationsPage.jsx => /notifications (Both) - Notifications
10. LibrarianDashboard.jsx => /lib/dashboard, /lib/analytics (Librarian) - Stats + charts
11. CirculationPage.jsx => /lib/circulation (Librarian) - Issue and return
12. ReservationsPage.jsx => /lib/reservations (Librarian) - Reservation queue
13. InventoryAuditPage.jsx => /lib/audit (Librarian) - QR audit
14. StudentManagementPage.jsx => /lib/students (Librarian) - Student management
15. AIForecastPage.jsx => /lib/forecast (Librarian) - AI demand forecast
16. LibrarySettingsPage.jsx => /lib/settings (Librarian) - Settings

### Existing Components (12 total)
- AppShell.jsx - Layout wrapper
- Sidebar.jsx - Collapsible nav sidebar
- TopBar.jsx - Fixed top bar
- BookCard.jsx - Book grid card
- Card.jsx - Generic card container
- Modal.jsx - Overlay modal
- Badge.jsx - Status badges
- Button.jsx - Button variants
- ProgressRing.jsx - Days remaining indicator
- StatCounter.jsx - Animated stat card
- SkeletonLoader.jsx - Loading placeholders
- QRDisplay.jsx - QR code display

---

## 5. STITCH DESIGN INVENTORY (111 folders)

Each folder has code.html + screen.png. Grouped by category:

| Category | Count | Primary Design |
|----------|-------|----------------|
| A. Login | 7 | login_bookify |
| B. Sign-up | 7 | N/A (no backend, do not implement) |
| C. Student Dashboard | 23 | student_dashboard_bookify_1 |
| D. Public Home | 5 | home_bookify (no existing route) |
| E. Library Catalog | 9 | library_catalog_bookify |
| F. Book Details | 4 | book_details_bookify_1 |
| G. Admin Dashboard | 6 | admin_dashboard_bookify_1 |
| H. Circulation | 1 | circulation_bookify_admin |
| I. Manage Books | 4 | manage_books_bookify_admin_1 |
| J. Manage Students | 3 | manage_students_bookify_admin_1 |
| K. Issue Book | 3 | issue_book_bookify_admin_1 |
| L. Return Book | 3 | return_book_bookify_admin_1 |
| M. My Books (Student) | 5 | my_books_bookify_1 |
| N. Borrowing History | 2 | borrowing_history_bookify |
| O. My Borrowing | 1 | my_borrowing_bookify |
| P. My Reservations | 4 | my_reservations_bookify_1 |
| Q. My Profile | 8 | my_profile_bookify_1 (no existing page) |
| R. Reports/Analytics | 3 | reports_analytics_bookify_admin_1 |
| S. Theme Variants | 10 | N/A (design system explorations) |
| T. Misc/Images | 3 | N/A (ignore) |

---

## 6. ROUTE-TO-DESIGN MAPPING

| Route | Page | Primary Stitch Design | Status |
|-------|------|-----------------------|--------|
| /login | LoginPage.jsx | login_bookify | Pending |
| /student/home | StudentHome.jsx | student_dashboard_bookify_1 | Pending |
| /student/books | BookSearchPage.jsx | library_catalog_bookify | Pending |
| /lib/books | BookSearchPage.jsx | library_catalog_bookify | Pending |
| /books/:id | BookDetailPage.jsx | book_details_bookify_1 | Pending |
| /student/my-books | StudentMyBooksPage.jsx | my_books_bookify_1 | Pending |
| /student/fines | StudentMyBooksPage.jsx | my_books_bookify_1 (fines tab) | Pending |
| /student/calendar | BorrowingCalendarPage.jsx | No Stitch design - preserve | Pending |
| /student/digital | DigitalShelfPage.jsx | No Stitch design - preserve | Pending |
| /student/purchase-request | PurchaseRequestsPage.jsx | No Stitch design - preserve | Pending |
| /notifications | NotificationsPage.jsx | No Stitch design - preserve | Pending |
| /lib/dashboard | LibrarianDashboard.jsx | admin_dashboard_bookify_1 | Pending |
| /lib/analytics | LibrarianDashboard.jsx | reports_analytics_bookify_admin_1 | Pending |
| /lib/circulation | CirculationPage.jsx | circulation_bookify_admin | Pending |
| /lib/reservations | ReservationsPage.jsx | my_reservations_bookify_1 | Pending |
| /lib/digital | DigitalShelfPage.jsx | No Stitch design - preserve | Pending |
| /lib/audit | InventoryAuditPage.jsx | No Stitch design - preserve | Pending |
| /lib/forecast | AIForecastPage.jsx | No Stitch design - preserve | Pending |
| /lib/students | StudentManagementPage.jsx | manage_students_bookify_admin_1 | Pending |
| /lib/purchases | PurchaseRequestsPage.jsx | No Stitch design - preserve | Pending |
| /lib/settings | LibrarySettingsPage.jsx | No Stitch design - preserve | Pending |
| /student/profile (NEW) | NEW MyProfilePage.jsx | my_profile_bookify_1 | Pending |

---

## 7. SHARED COMPONENTS ALREADY CREATED

None yet - implementation not started.

---

## 8. FILES MODIFIED SO FAR

None - analysis phase only, no code changes made.

---

## 9. IMPORTANT FUNCTIONALITY TO PRESERVE

- JWT login + role-based redirect (LoginPage.jsx)
- Forgot password / OTP / reset password flow (4 modes)
- Auto-logout on 401 (api.js interceptor)
- Student dashboard stats (studentApi.getDashboard)
- Student current books (studentApi.getCurrentBooks)
- My-books / history / fines (studentApi.*)
- Book catalog + search + filters (bookApi.*)
- Book detail + reserve (bookApi.getById + reservationApi.create)
- Borrowing calendar (studentApi.getCurrentBooks)
- Digital resource download (digitalApi.*)
- Purchase requests (purchaseApi.*)
- Notifications + mark read (notificationApi.*)
- Librarian analytics + charts (analyticsApi.*)
- Issue / Return / Renew books (circulationApi.*)
- Reservations management (reservationApi.*)
- QR inventory audit (auditApi.*)
- AI demand forecast (analyticsApi.getForecast)
- Student management (analyticsApi.getStudents, suspend, activate)
- Library settings (analyticsApi.getSettings, updateSettings)
- Theme toggle light/dark (useTheme.jsx)
- Sidebar collapse (AppShell.jsx state)

---

## 10. CURRENT KNOWN ISSUES

1. LibrarianDashboard.jsx uses hardcoded hex chart colors not from CSS token system
2. TopBar.jsx search always navigates to /lib/books even when student is logged in
3. Sidebar.jsx labels /student/fines route as "Fines" but renders StudentMyBooksPage

---

## 11. CURRENT BUILD/LINT STATUS

Not run. Baseline command before Batch 1:
  cd frontend && npm run build && npm run lint

---

## 12. RISK ANALYSIS

1. [HIGH] Login field: Stitch shows "Student ID" but backend requires email. KEEP email type.
2. [HIGH] Stitch sidebars have fewer nav items than existing. DO NOT remove any items.
3. [MEDIUM] 7 sign-up designs but no backend registration. Do NOT implement.
4. [MEDIUM] Primary color mismatch (#031635 vs #154472). Update tokens.css in Batch 1.
5. [MEDIUM] Admin sidebar in Stitch shows fewer items. Keep all 11 librarian nav items.
6. [LOW] Material Symbols vs Lucide React. Keep Lucide (optionally add Material Symbols).
7. [LOW] Chart.js in Stitch vs Recharts in existing. Keep Recharts.
8. [LOW] CSS keyframes vs Framer Motion. Keep Framer Motion.
9. [LOW] My Profile page missing. Create MyProfilePage.jsx using existing APIs.
10. [MEDIUM] AppShell changes affect all pages. Test all 16 pages after any AppShell change.

---

## 13. IMPLEMENTATION BATCHES

Batch 1: Design System Foundation
  Files: tokens.css, tailwind.config.js, index.css
  Goal: Align colors and typography to Stitch. No JSX changes.
  Status: Pending

Batch 2: Layout Shell Components
  Files: Sidebar.jsx, TopBar.jsx, AppShell.jsx
  Goal: Match Stitch sidebar + topbar visual. Keep ALL logic.
  Status: Pending

Batch 3: Login Page
  Files: LoginPage.jsx
  Goal: Match login_bookify design. Preserve all 4 auth flows.
  Status: Pending

Batch 4: Student Dashboard
  Files: StudentHome.jsx
  Goal: Match student_dashboard_bookify_1. Preserve all API calls.
  Status: Pending

Batch 5: Book Catalog and Detail
  Files: BookSearchPage.jsx, BookDetailPage.jsx
  Goal: Match library_catalog_bookify and book_details_bookify_1.
  Status: Pending

Batch 6: Student My-Books and Reservations
  Files: StudentMyBooksPage.jsx
  Goal: Match my_books_bookify_1 and borrowing_history_bookify.
  Status: Pending

Batch 7: Librarian Pages
  Files: LibrarianDashboard.jsx, CirculationPage.jsx, StudentManagementPage.jsx
  Goal: Match admin dashboard and circulation Stitch designs.
  Status: Pending

Batch 8: New Pages
  Files: NEW MyProfilePage.jsx, App.jsx (new route only)
  Goal: Add profile page using my_profile_bookify_1 and existing APIs.
  Status: Pending

Batch 9: Remaining Pages and Mobile
  Files: Calendar, Digital, AI Forecast, Settings, Purchase, Notifications, Audit, Reservations
  Goal: Stitch-inspired improvements + mobile responsiveness.
  Status: Pending

Batch 10: Polish and Verification
  Goal: Visual consistency, all feature tests, auth flow tests, dark mode.
  Status: Pending

Recommended Order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10

---

## 14. AMBIGUITIES AND MISMATCHES (15 total)

1. Login: Stitch "Student ID" but backend requires email [HIGH] -> Keep email field
2. 7 sign-up designs, no backend endpoint [MEDIUM] -> Do not implement
3. Public home page designs, no existing route [LOW] -> Optional - user decides
4. Stitch sidebars have fewer nav items [HIGH] -> Keep all existing items
5. Primary color mismatch #031635 vs #154472 [MEDIUM] -> Update in Batch 1
6. Icon system: Material Symbols vs Lucide [LOW] -> User to decide
7. 8 My Profile designs, no existing page [LOW] -> Add in Batch 8
8. About Us / Contact Us designs [LOW] -> Optional static pages
9. Fines in Rs. vs Stitch shows $ [LOW] -> Keep Rs. (matches backend)
10. Wishlist in Stitch, no backend support [MEDIUM] -> Do not implement
11. Student Reservations sidebar item unclear [MEDIUM] -> May need new route
12. My Loans maps to /student/my-books [LOW] -> Implement as tabs
13. Multiple variants per screen (3-23) [MEDIUM] -> User should pick preferred variant
14. Chart.js in Stitch vs Recharts [LOW] -> Keep Recharts
15. Some Stitch folders are image files [NONE] -> Ignore these

---

## 15. DECISIONS MADE DURING MIGRATION

None yet - awaiting user approval.

---

## 16. ABSOLUTE RULES FOR FUTURE AGENTS

1. NEVER modify any file in backend/
2. NEVER modify frontend/src/hooks/useAuth.jsx
3. NEVER modify frontend/src/services/api.js
4. Login input MUST remain type=email (backend validates email, not student ID)
5. Do NOT remove any sidebar nav items (Stitch shows fewer but all must remain)
6. Do NOT implement sign-up page without explicit user confirmation
7. Do NOT implement Wishlist feature (no backend support)
8. Only modify App.jsx JSX/style; NEVER touch PrivateRoute, StudentRoute, LibrarianRoute, UnauthorizedListener logic
9. Do NOT change AppShell component props or structure - CSS classes/style values only
10. Chart data MUST come from existing analyticsApi calls - never hardcode data
11. Dark mode must work for all migrated components using .dark CSS class system
12. Update this file after every batch - mark Done, list modified files
13. Always test login, logout, and auto-401-logout after any change
14. The Stitch designs are the visual reference only. Existing APIs/hooks are source of truth for functionality.

---

End of FRONTEND_MIGRATION_PROGRESS.md
Created: 2026-09-01 | Analysis complete, no code changes made
