# Bookify — Architecture & Flow Map

> **For the first-time reader:** This file tells you how the system actually runs — what starts what, how a real request moves through the code, and what changed in each work session. It is a living document: Parts A and B are updated whenever a new entry point or core flow is added; Part C gets a new entry after every work session.
>
> All file paths are relative to the repo root (`c:/Users/FSOS/Desktop/Bookify/`).

---

## Part A — Entry Points

*What starts each service, what gets registered before it is re
ady to serve requests.*

### Frontend (`frontend/`)
**Starts with:** `npm run dev` (Vite dev server) or `npm run build` + serve the `dist/` folder.
**Entry file:** `frontend/src/main.jsx` → mounts `<App />` into `index.html#root`.
**What runs first:** Vite loads environment variables prefixed `VITE_*`. `App.jsx` sets up the React Router tree, wraps the app in `AuthProvider` (JWT context), and applies the `Lenis` smooth-scroll instance globally. Protected route wrappers check `useAuth()` before rendering any portal page; unauthenticated users are redirected to `/login`.

### Backend (`backend/`)
**Starts with:** `npm run dev` (nodemon) or `node server.js`.
**Entry file:** `backend/server.js`.
**What runs first:** Loads `.env` via `dotenv/config`. Applies global middleware in order: `helmet` (security headers), `cors` (origin from env), `express-rate-limit` on `/api/auth/*`, `express.json()` body parser. Calls `config/db.js` to initialize the PostgreSQL connection pool (verified with a test query on startup). Registers all route files under `/api/*`. Starts the `dailyReminderJob` cron. Listens on `PORT` (default 5000).

### AI Service (`ai-service/`)
**Starts with:** `uvicorn main:app --reload` (dev) or `uvicorn main:app --host 0.0.0.0 --port 8000` (prod).
**Entry file:** `ai-service/main.py`.
**What runs first:** Loads `.env`. On startup, `services/embeddings.py` downloads (first run) and loads the `all-MiniLM-L6-v2` sentence-transformer model into memory — this is the only slow step (~2–5 seconds). Connects to PostgreSQL in read-only mode via `services/db.py`. Registers three routers: `/ai/search`, `/ai/recommendations/{student_id}`, `/ai/demand-forecast`. Ready to serve after model load completes.

---

## Part B — Traced Request Flows

*How a real request moves through the code, naming actual files and functions. Updated as each feature is built.*

### Login (Student or Librarian)
```
User submits credentials on Login.jsx
  → authApi.login() in services/authApi.js
  → POST /api/auth/login
  → authRoutes.js → authController.login()
  → authController queries users table (parameterized), bcrypt.compare(password, hash)
  → On success: signs JWT { userId, role } with JWT_SECRET, returns token + role
  → Frontend stores token in localStorage, AuthProvider sets user context
  → App.jsx redirects: STUDENT → /student/home, *_LIBRARIAN → /librarian/dashboard
```

### Search a Book (keyword)
```
Student types in SearchBar.jsx and submits
  → bookApi.searchBooks({ q, filters }) in services/bookApi.js
  → GET /api/books/search?q=DBMS&category=...
  → bookRoutes.js → bookController.searchBooks()
  → bookController runs full-text search on books + authors tables (parameterized)
  → If q is longer than one word and looks non-keyword-ish: calls aiClient.rerank(q, results)
      → POST http://ai-service:8000/ai/search  { query, candidates }
      → routers/search.py embeds query + candidate titles, cosine-ranks, returns ordered IDs
      → bookController reorders results by AI ranking
  → Returns JSON array of book objects with copy counts
  → SearchResults.jsx renders BookCard list with stagger animation
```

### Issue a Book
```
Librarian scans student ID + book copy barcode on Circulation.jsx
  → BarcodeInput.jsx captures fast keystrokes → triggers circulationApi.issueBook({ studentId, copyId })
  → POST /api/issues
  → circulationRoutes.js → circulationController.issueBook()
  → Checks copy status = AVAILABLE (rejects if not)
  → BEGIN TRANSACTION:
      INSERT issues row (issue_date=today, due_date=today+default_loan_days)
      UPDATE book_copies SET status='ISSUED'
      INSERT notification (type=DUE_REMINDER, due date message)
  → COMMIT
  → Returns issue record; Circulation.jsx shows success toast
```

### Return a Book
```
Librarian scans copy barcode on Circulation.jsx
  → circulationApi.returnBook({ copyId, condition })
  → PUT /api/issues/:id/return  { condition: 'DAMAGED' | 'GOOD' }
  → circulationController.returnBook()
  → Look up open issue for copy_id
  → If condition=DAMAGED: INSERT fines row (reason=DAMAGE)
  → If return_date > due_date: fineService.calculateFine(issueId) → INSERT fines row (reason=OVERDUE)
  → BEGIN TRANSACTION:
      UPDATE issues SET return_date, status='RETURNED'
      UPDATE book_copies SET status='AVAILABLE' (or 'DAMAGED')
      Check book_reservations for next student in queue for this book_id
      If queue entry found: UPDATE reservation status, notify next student, hold copy
  → COMMIT
  → Returns summary with fine amount (Rs. 0 if none)
```

### Join Reservation Queue (Waitlist)
```
Student clicks "Join Waitlist" on BookDetails.jsx
  → reservationApi.createReservation({ bookId })
  → POST /api/reservations
  → reservationController.create()
  → Checks student has no active reservation for this book
  → Gets current MAX(queue_position) for this book_id, increments by 1
  → INSERT book_reservations row
  → Returns position in queue; BookDetails.jsx shows queue badge
```

### Seat Check-In (QR scan at entrance)
```
Student shows QR pass; librarian/scanner scans QR at entrance
  → BarcodeInput captures QR token value
  → seatApi.checkIn({ qrToken })
  → POST /api/seats/checkin  { token }
  → seatController.checkIn()
  → Looks up seat_reservations WHERE qr_token = token AND status = 'BOOKED'
  → Verifies token not expired (checked_in_at must be within grace window)
  → UPDATE seat_reservations SET status='CHECKED_IN', checked_in_at=now()
  → Returns seat label + zone; frontend shows confirmation
```

### Daily Reminder Job (runs at 08:00 every day)
```
node-cron fires dailyReminderJob at 0 8 * * *  (jobs/dailyReminderJob.js)
  → Queries issues WHERE due_date IN (today+7, today+3, today+1, today) AND status='ISSUED'
  → Queries issues WHERE due_date < today AND status='ISSUED'  (overdue)
  → For each issue: notificationService.createNotification(student.user_id, type, title, message)
      → INSERT notifications row
      → If user.notify_web_push: sends Web Push via web-push library
      → If user.notify_email: sends email via Nodemailer (Ethereal in dev, real SMTP in prod)
```

---

## Part C — Session Log

*What changed in each work session and why.*

### Session 1 — Scaffolding & Documentation
**Worked on:** Repo structure, documentation files, environment variable templates, git initialization.
**Files created:** `decision.md`, `flow.md`, `README.md`, `.gitignore`, `backend/.env.example`, `ai-service/.env.example`
**Files changed:** —
**New functions/endpoints of note:** None yet — this session is foundations only.
**Why:** The brief requires `decision.md` and `flow.md` to exist *before* any feature code, and specifies that documentation is not a wrap-up task. All decisions made during scaffolding (project name, repo structure, SMTP strategy, Docker Compose, database engine) are already logged in `decision.md`.

### Session 2 — Complete Implementation & Verification
**Worked on:** Complete backend controllers, routes, fine calculation engine, AI FastAPI services (semantic search, recommendations, demand forecast), full React frontend with all 16 dedicated pages, 9/9 automated unit tests, and production build verification.
**Files created/updated:**
- Backend: `server.js`, `config/db.js`, `middleware/*`, `services/*`, `controllers/*`, `routes/*`, `jobs/dailyReminderJob.js`, `test/*`.
- AI Service: `main.py`, `routers/*`, `services/*`, `requirements.txt`.
- Frontend: `src/App.jsx`, `src/styles/tokens.css`, `src/index.css`, `src/components/*`, `src/pages/*`, `src/services/*`, `src/hooks/*`, `vercel.json`.
- Database: `schema.sql`, `seed.sql`, `migrations/001_initial.sql`.
- Infra: `docker-compose.yml`, `backend/Dockerfile`, `ai-service/Dockerfile`.
**Test status:** 9/9 unit tests passing (`node --test`), 0 build errors in Vite production bundle.
**Why:** Achieved full tri-service functional parity across student and librarian workflows.

---
