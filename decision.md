# Booksphere — Decision Log

> Every time a non-mechanical choice is made — a library, a schema shape, a naming convention, a trade-off, a resolved ambiguity, or a deviation from the brief — an entry is added here.
> Plain English, no unexplained jargon. Written as decisions are made, not batched at the end.

---

## Step 0 — Animation philosophy
**Decision:** The site will use bold, purposeful, 60fps motion throughout (page transitions, scroll reveals, animated stats, subtle depth on cards) rather than a minimal-animation academic style.
**Why:** An earlier planning pass for this project called for minimal animation for a plain academic look; the current brief explicitly asks for the opposite — a bold, animated, non-cluttered, non-templated feel. This entry records that the newer instruction wins.
**Trade-off / what to watch for:** Heavy animation can harm accessibility. We mitigate this by respecting `prefers-reduced-motion` via a `useReducedMotion` hook and only animating `transform` / `opacity` (never layout properties) to keep frames at 60fps.

---

## Step 1 — Project name
**Decision:** The project is named **Booksphere** (not LibConnect).
**Why:** User confirmed "Booksphere is project name" after the initial plan was drafted. All branding, metadata, and docs use Booksphere.

---

## Step 1 — Repo structure (no double-nesting)
**Decision:** All source lives directly inside `c:/Users/FSOS/Desktop/Booksphere/` — `frontend/`, `backend/`, `ai-service/`, `database/`, `docs/`, and root-level docs. No inner `booksphere/` or `libconnect/` subfolder.
**Why:** The workspace already had `frontend/` and `backend/` as empty top-level directories. Creating another sub-folder would force every `cd` path to be one level deeper for no benefit.

---

## Step 1 — Local SMTP for development
**Decision:** Use **Nodemailer + Ethereal.email** for OTP and reminder emails in local development. Production SMTP credentials (SendGrid, Gmail, etc.) are left as env vars in `.env.example`.
**Why:** Ethereal creates a throwaway SMTP server on first run and gives a browser URL to preview captured emails — no real mail account needed to test the OTP flow locally. Swapping to a real provider requires only changing env vars.

---

## Step 1 — PostgreSQL via Docker Compose
**Decision:** Include a `docker-compose.yml` at the repo root that starts PostgreSQL (+ the Node backend and Python AI service). Local development requires only Docker — no separate PostgreSQL installation.
**Why:** The user didn't confirm a local PostgreSQL installation. Docker Compose removes the setup friction and keeps the environment reproducible across machines. Developers with a native PostgreSQL install can still use it by pointing the `.env` `DATABASE_URL` at their local instance and not running the `db` service from Compose.

---

## Step 2 — Database engine: PostgreSQL
**Decision:** PostgreSQL is the database engine.
**Why:** The schema is fundamentally relational. Issues, fines, reservations, and copies all depend on foreign-key integrity and multi-table transactions (e.g., returning a book touches the issue row, the copy status, the fine record, the reservation queue, and a notification in one atomic action). PostgreSQL enforces that correctness at the database level. Pushing that consistency into application code would create more places for bugs to hide.
**Alternatives considered:** MySQL (acceptable fallback per the brief — schema is compatible), MongoDB (rejected — document model would require all referential integrity to live in application code).

---

## Step 2 — `book_copies` is its own table, not a count on `books`
**Decision:** Each physical copy is a separate row in `book_copies` with its own accession number, status, and shelf location — not a simple integer count on `books`.
**Why:** The librarian dashboard needs to answer "which exact copy is overdue / damaged / lost / misplaced" — not just "how many are missing." Individual tracking also makes inventory audit (scanning a copy's QR and updating its specific row) straightforward. This was flagged as one of the most important schema decisions in the original project brief.

---

## Step 2 — E-book fallback path (`books.digital_resource_id`)
**Decision:** `books` has a nullable FK `digital_resource_id → digital_resources.resource_id`. When a book's available physical copies drop to 0, the book-detail API checks this column and, if set, surfaces a "Read the E-Book" option instead of a dead end.
**Why:** This was an explicit original requirement not covered by either source document individually. The FK keeps the relationship expressed in the schema rather than only in application code, and it makes the fallback query a single JOIN rather than a two-step lookup.

---

## Step 2 — Status columns use CHECK constraints, not enum tables
**Decision:** Status fields (e.g., `issues.status IN ('ISSUED','RETURNED','OVERDUE')`) use PostgreSQL `CHECK` constraints rather than separate enum lookup tables.
**Why:** CHECK constraints keep the schema self-contained and easier to read. Adding a new status value is a single `ALTER TABLE` migration rather than a two-table change. For a project this size the flexibility gain of a lookup table doesn't outweigh the added complexity.

---

## Step 3 — AI embedding model: `all-MiniLM-L6-v2` (local, via sentence-transformers)
**Decision:** The AI service uses `sentence-transformers/all-MiniLM-L6-v2` for semantic search re-ranking.
**Why:** Runs entirely locally with no API key or external dependency. Fast enough (< 100ms per query on CPU for a small catalogue) for a library of a few thousand books. The model is ~90MB and loads once at service startup.
**Alternatives considered:** OpenAI `text-embedding-ada-002` (requires API key + cost per call), `all-mpnet-base-v2` (more accurate but 4× slower on CPU — overkill for this use case).

---

## Step 3 — E-book file storage: local disk for dev, S3-compatible env vars for production
**Decision:** Uploaded e-books are stored in `backend/uploads/` during local development. The `.env.example` documents `STORAGE_PROVIDER`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` for production.
**Why:** Removes the need for a cloud bucket to run the project locally. Swapping to S3 (or any compatible provider like Cloudflare R2) requires only env var changes and a one-line swap in the storage service.

---

## Step 5 — Animation toolkit choices
**Decision:** Use **Framer Motion** for component-level transitions, **GSAP + ScrollTrigger** for scroll-linked section reveals, and **Lenis** for smooth physics-based scrolling. Icon set: **lucide-react** exclusively.
**Why:** Each library excels at a different layer of animation. Framer Motion's layout animations and `AnimatePresence` handle route transitions and modal entrances cleanly. GSAP ScrollTrigger handles timeline-pinned scroll sequences that Framer Motion cannot express as naturally. Lenis adds the inertial scroll feel that makes the overall site feel premium without GPU-heavy tricks.
**What to watch for:** Don't mix approaches on the same element. Framer Motion and GSAP both want to own an element's transform — keep them on separate elements.
