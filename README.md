# 📚 Booksphere

> **Search. Borrow. Track. Return. Your Library, Anywhere.**

Booksphere is a full-stack, AI-assisted college library management website with two role-based portals — a **Student Portal** and a **Librarian Dashboard** — sharing one codebase and one login page.

## What it does

| For Students | For Librarians |
|---|---|
| Search the catalogue (keyword or plain-language AI query) | Manage the catalogue (single or bulk add via CSV/barcode) |
| See real-time copy availability and exact shelf location | Issue and return books with a USB barcode/QR scanner |
| Reserve books or join the waitlist | Manage reservation queues |
| Track borrowed books, due dates, and fines | Run inventory audits |
| Get automatic due-date reminders (web push / email) | Manage digital resources (e-books/journals) |
| Read an e-book when physical copies are unavailable | Review student purchase requests |
| Reserve a library seat and get a QR check-in pass | View analytics + AI-generated demand forecast |
| Request a book the library doesn't stock | Export reports (PDF / Excel) |

## Architecture

```
Booksphere/
  frontend/       React + Vite + Tailwind + Framer Motion + GSAP
  backend/        Node.js + Express REST API (port 5000)
  ai-service/     Python + FastAPI — search, recommendations, forecast (port 8000)
  database/       PostgreSQL schema, seed data, migrations
  docs/           Architecture diagrams and notes
  decision.md     Every non-trivial decision made during the build, and why
  flow.md         How the system actually runs — entry points + traced request flows
```

## Prerequisites

- [Docker + Docker Compose](https://docs.docker.com/get-docker/) — easiest way to get PostgreSQL + all services running
- OR: Node.js 20+, Python 3.11+, and a running PostgreSQL 15+ instance

## Quick Start (Docker Compose)

```bash
# 1. Clone the repo
git clone <repo-url>
cd Booksphere

# 2. Copy and fill in env files
cp backend/.env.example backend/.env
cp ai-service/.env.example ai-service/.env

# Edit backend/.env and ai-service/.env with your actual values
# (For local dev the defaults mostly work — see the .env.example comments)

# 3. Start everything (PostgreSQL + backend + AI service)
docker compose up --build

# 4. In a separate terminal, start the frontend
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

The first `docker compose up` run will:
1. Pull the PostgreSQL image
2. Build the Node and Python service images
3. Run `database/schema.sql` and `database/seed.sql` automatically
4. Start all three services

## Manual Setup (without Docker)

### PostgreSQL

Create a database named `booksphere` and run:
```bash
psql -U postgres -d booksphere -f database/schema.sql
psql -U postgres -d booksphere -f database/seed.sql
```

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your DB connection string and other values
npm install
npm run dev          # nodemon, auto-reloads on changes
```

### AI Service

```bash
cd ai-service
cp .env.example .env
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The first run downloads the `all-MiniLM-L6-v2` model (~90 MB) — subsequent starts are fast.

### Frontend

```bash
cd frontend
npm install
npm run dev          # Vite dev server at http://localhost:5173
```

## Environment Variables

See [`backend/.env.example`](backend/.env.example) and [`ai-service/.env.example`](ai-service/.env.example) for the full list. The most important ones:

| Variable | Service | Purpose |
|---|---|---|
| `DATABASE_URL` | backend | PostgreSQL connection string |
| `JWT_SECRET` | backend | Signs auth tokens — use a long random string |
| `JWT_EXPIRES_IN` | backend | Token lifetime (e.g. `7d`) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | backend | Email (OTPs + reminders) |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | backend | Web push notifications |
| `AI_SERVICE_URL` | backend | URL of the Python AI service (default: `http://localhost:8000`) |
| `DATABASE_URL` | ai-service | Read-only PostgreSQL connection |

## Demo Accounts (from seed data)

| Role | Email | Password |
|---|---|---|
| Head Librarian | `head@booksphere.edu` | `Admin@123` |
| Assistant Librarian | `assistant@booksphere.edu` | `Admin@123` |
| Student | `student@booksphere.edu` | `Student@123` |

> ⚠️ Change all passwords immediately if deploying to a real environment.

## Role Permissions

| Capability | Head Librarian | Assistant Librarian | Student |
|---|---|---|---|
| Add / edit / bulk-import books | ✓ | ✓ | — |
| Delete books | ✓ | — | — |
| Issue / return / manage queues | ✓ | ✓ | — |
| View analytics & forecasts | ✓ | ✓ | — |
| Export financial reports | ✓ | — | — |
| Approve purchase requests | ✓ | — | — |
| Manage digital resources | ✓ | ✓ | — |
| Run inventory audit | ✓ | ✓ | — |
| Search / reserve / borrow | — | — | ✓ |
| Submit purchase requests | — | — | ✓ |

## Key Design Decisions

See [`decision.md`](decision.md) for the full log. Quick summary:
- PostgreSQL for relational integrity across issues/fines/reservations
- Each physical copy is its own row in `book_copies` (not a count on `books`)
- E-book fallback: if 0 physical copies available, the book detail page links to the e-book if one is linked
- Bold 60fps animations throughout — Framer Motion + GSAP + Lenis
- `all-MiniLM-L6-v2` embeddings for semantic search (no API key, runs locally)

## How the Code is Organized

See [`flow.md`](flow.md) for entry points, traced request flows, and session-by-session change log.

## Future Scope (not in this build)
- ERP / student ID-card integration
- RFID auto issue/return
- Native mobile app
- Interactive digital library floor map
- Deeper analytics and BI dashboards
