-- ============================================================================
-- Booksphere — Database Schema
-- PostgreSQL 15+
-- Run: psql -U postgres -d booksphere -f database/schema.sql
-- ============================================================================

-- Drop tables in reverse dependency order for clean re-runs
DROP TABLE IF EXISTS demand_forecasts CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS inventory_audit_log CASCADE;
DROP TABLE IF EXISTS seat_reservations CASCADE;
DROP TABLE IF EXISTS seats CASCADE;
DROP TABLE IF EXISTS purchase_requests CASCADE;
DROP TABLE IF EXISTS digital_resources CASCADE;
DROP TABLE IF EXISTS library_settings CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS fines CASCADE;
DROP TABLE IF EXISTS book_reservations CASCADE;
DROP TABLE IF EXISTS issues CASCADE;
DROP TABLE IF EXISTS book_copies CASCADE;
DROP TABLE IF EXISTS books CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS authors CASCADE;
DROP TABLE IF EXISTS librarians CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ── Enable extensions ─────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";     -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- trigram indexes for LIKE search

-- ============================================================================
-- USERS & ROLES
-- ============================================================================

CREATE TABLE users (
    user_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(150) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    role            VARCHAR(30) NOT NULL
                        CHECK (role IN ('STUDENT','ASSISTANT_LIBRARIAN','HEAD_LIBRARIAN')),
    phone           VARCHAR(20),
    profile_image   TEXT,                                   -- URL / path
    notify_web_push BOOLEAN NOT NULL DEFAULT FALSE,
    notify_email    BOOLEAN NOT NULL DEFAULT TRUE,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email  ON users(email);
CREATE INDEX idx_users_role   ON users(role);

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE students (
    student_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    enrollment_no   VARCHAR(50) NOT NULL UNIQUE,
    department      VARCHAR(100) NOT NULL,
    course          VARCHAR(100) NOT NULL,
    year            SMALLINT NOT NULL CHECK (year BETWEEN 1 AND 6),
    semester        SMALLINT NOT NULL CHECK (semester BETWEEN 1 AND 12),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_students_user_id       ON students(user_id);
CREATE INDEX idx_students_enrollment    ON students(enrollment_no);

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE librarians (
    librarian_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    staff_id        VARCHAR(50) NOT NULL UNIQUE,
    designation     VARCHAR(30) NOT NULL
                        CHECK (designation IN ('ASSISTANT_LIBRARIAN','HEAD_LIBRARIAN')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_librarians_user_id ON librarians(user_id);

-- ============================================================================
-- CATALOGUE
-- ============================================================================

CREATE TABLE authors (
    author_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(200) NOT NULL,
    bio         TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_authors_name ON authors USING gin(name gin_trgm_ops);

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE categories (
    category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE digital_resources (
    resource_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title               VARCHAR(300) NOT NULL,
    author              VARCHAR(200),
    type                VARCHAR(20) NOT NULL CHECK (type IN ('EBOOK','JOURNAL')),
    file_url            TEXT NOT NULL,
    file_size_bytes     BIGINT,
    mime_type           VARCHAR(100),
    access_level        VARCHAR(20) NOT NULL DEFAULT 'OPEN'
                            CHECK (access_level IN ('OPEN','COURSE_RESTRICTED')),
    restricted_course   VARCHAR(100),                       -- populated when access_level = COURSE_RESTRICTED
    uploaded_by         UUID REFERENCES users(user_id) ON DELETE SET NULL,
    upload_date         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    download_count      INTEGER NOT NULL DEFAULT 0,
    avg_read_time_mins  NUMERIC(8,2),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_digital_resources_type ON digital_resources(type);

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE books (
    book_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title               VARCHAR(400) NOT NULL,
    isbn                VARCHAR(20),
    publisher           VARCHAR(200),
    publication_year    SMALLINT,
    description         TEXT,
    category_id         UUID REFERENCES categories(category_id) ON DELETE SET NULL,
    author_id           UUID REFERENCES authors(author_id) ON DELETE SET NULL,
    cover_image_url     TEXT,
    digital_resource_id UUID REFERENCES digital_resources(resource_id) ON DELETE SET NULL,
    -- ^ nullable FK: set when this print title has an e-book counterpart
    total_copies        INTEGER NOT NULL DEFAULT 0,         -- denormalized for fast reads; kept in sync by triggers
    available_copies    INTEGER NOT NULL DEFAULT 0,         -- denormalized; updated on issue/return
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Full-text search vector (auto-maintained by trigger below)
    search_vector       TSVECTOR
);

CREATE INDEX idx_books_category     ON books(category_id);
CREATE INDEX idx_books_author       ON books(author_id);
CREATE INDEX idx_books_isbn         ON books(isbn);
CREATE INDEX idx_books_search       ON books USING gin(search_vector);
CREATE INDEX idx_books_title_trgm   ON books USING gin(title gin_trgm_ops);

-- Trigger to keep search_vector current
CREATE OR REPLACE FUNCTION books_search_vector_update() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.isbn, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_books_search_vector
    BEFORE INSERT OR UPDATE ON books
    FOR EACH ROW EXECUTE FUNCTION books_search_vector_update();

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE book_copies (
    copy_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id             UUID NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
    accession_number    VARCHAR(50) NOT NULL UNIQUE,
    status              VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE'
                            CHECK (status IN ('AVAILABLE','ISSUED','DAMAGED','LOST','RESERVED')),
    shelf_block         VARCHAR(10),
    shelf_rack          VARCHAR(10),
    shelf_shelf         VARCHAR(10),
    qr_code_value       VARCHAR(100) UNIQUE,                -- value encoded in the QR sticker on the book
    condition_notes     TEXT,                               -- for DAMAGED copies
    acquired_date       DATE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_book_copies_book_id            ON book_copies(book_id);
CREATE INDEX idx_book_copies_status             ON book_copies(status);
CREATE INDEX idx_book_copies_accession          ON book_copies(accession_number);
CREATE INDEX idx_book_copies_qr                 ON book_copies(qr_code_value);

-- Trigger: keep books.total_copies and books.available_copies in sync
CREATE OR REPLACE FUNCTION sync_book_copy_counts() RETURNS TRIGGER AS $$
DECLARE
    bid UUID;
BEGIN
    -- Determine which book_id is affected
    IF TG_OP = 'DELETE' THEN
        bid := OLD.book_id;
    ELSE
        bid := NEW.book_id;
    END IF;

    UPDATE books
    SET
        total_copies     = (SELECT COUNT(*) FROM book_copies WHERE book_id = bid AND status != 'LOST'),
        available_copies = (SELECT COUNT(*) FROM book_copies WHERE book_id = bid AND status = 'AVAILABLE'),
        updated_at       = NOW()
    WHERE book_id = bid;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_book_copy_counts
    AFTER INSERT OR UPDATE OR DELETE ON book_copies
    FOR EACH ROW EXECUTE FUNCTION sync_book_copy_counts();

-- ============================================================================
-- CIRCULATION
-- ============================================================================

CREATE TABLE issues (
    issue_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    copy_id         UUID NOT NULL REFERENCES book_copies(copy_id) ON DELETE RESTRICT,
    student_id      UUID NOT NULL REFERENCES students(student_id) ON DELETE RESTRICT,
    issue_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date        DATE NOT NULL,
    return_date     DATE,
    status          VARCHAR(20) NOT NULL DEFAULT 'ISSUED'
                        CHECK (status IN ('ISSUED','RETURNED','OVERDUE')),
    issued_by       UUID REFERENCES users(user_id) ON DELETE SET NULL,     -- librarian
    returned_to     UUID REFERENCES users(user_id) ON DELETE SET NULL,     -- librarian
    renewal_count   SMALLINT NOT NULL DEFAULT 0,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_issues_copy_id     ON issues(copy_id);
CREATE INDEX idx_issues_student_id  ON issues(student_id);
CREATE INDEX idx_issues_status      ON issues(status);
CREATE INDEX idx_issues_due_date    ON issues(due_date);

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE book_reservations (
    reservation_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id             UUID NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
    student_id          UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    reservation_date    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expiry_date         TIMESTAMPTZ,                        -- set when a copy becomes available and is held for this student
    status              VARCHAR(20) NOT NULL DEFAULT 'WAITING'
                            CHECK (status IN ('WAITING','NOTIFIED','FULFILLED','EXPIRED','CANCELLED')),
    queue_position      INTEGER NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (book_id, student_id, status)                    -- one active reservation per student per book
);

CREATE INDEX idx_book_reservations_book_id      ON book_reservations(book_id);
CREATE INDEX idx_book_reservations_student_id   ON book_reservations(student_id);
CREATE INDEX idx_book_reservations_status       ON book_reservations(status);

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE fines (
    fine_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id    UUID NOT NULL REFERENCES issues(issue_id) ON DELETE RESTRICT,
    student_id  UUID NOT NULL REFERENCES students(student_id) ON DELETE RESTRICT,
    amount      NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
    reason      VARCHAR(20) NOT NULL CHECK (reason IN ('OVERDUE','DAMAGE','LOST')),
    paid        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at     TIMESTAMPTZ,
    notes       TEXT
);

CREATE INDEX idx_fines_student_id   ON fines(student_id);
CREATE INDEX idx_fines_issue_id     ON fines(issue_id);
CREATE INDEX idx_fines_paid         ON fines(paid);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title           VARCHAR(200) NOT NULL,
    message         TEXT NOT NULL,
    type            VARCHAR(30) NOT NULL
                        CHECK (type IN ('DUE_REMINDER','OVERDUE','RESERVATION','SEAT',
                                        'DIGITAL','PURCHASE_REQUEST','GENERAL')),
    channel         VARCHAR(20) NOT NULL DEFAULT 'IN_APP'
                        CHECK (channel IN ('IN_APP','EMAIL','WEB_PUSH')),
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    metadata        JSONB,                                  -- e.g. { book_id, fine_amount }
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id  ON notifications(user_id);
CREATE INDEX idx_notifications_is_read  ON notifications(is_read);
CREATE INDEX idx_notifications_type     ON notifications(type);

-- ============================================================================
-- LIBRARY SETTINGS (single-row config table)
-- ============================================================================

CREATE TABLE library_settings (
    setting_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fine_per_day            NUMERIC(8,2) NOT NULL DEFAULT 2.00,     -- Rs. 2 per day
    max_books_per_student   SMALLINT NOT NULL DEFAULT 3,
    default_loan_days       SMALLINT NOT NULL DEFAULT 15,
    renewal_limit           SMALLINT NOT NULL DEFAULT 2,
    seat_grace_minutes      SMALLINT NOT NULL DEFAULT 15,
    library_name            VARCHAR(200) NOT NULL DEFAULT 'Booksphere Library',
    library_email           VARCHAR(255),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by              UUID REFERENCES users(user_id) ON DELETE SET NULL
);

-- ============================================================================
-- PURCHASE REQUESTS
-- ============================================================================

CREATE TABLE purchase_requests (
    request_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL REFERENCES students(student_id) ON DELETE RESTRICT,
    title           VARCHAR(400) NOT NULL,
    author          VARCHAR(200),
    isbn            VARCHAR(20),
    reason          TEXT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN ('PENDING','APPROVED','REJECTED')),
    librarian_notes TEXT,
    reviewed_by     UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at     TIMESTAMPTZ
);

CREATE INDEX idx_purchase_requests_student_id   ON purchase_requests(student_id);
CREATE INDEX idx_purchase_requests_status       ON purchase_requests(status);

-- ============================================================================
-- SEATS & SEAT RESERVATIONS
-- ============================================================================

CREATE TABLE seats (
    seat_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seat_label  VARCHAR(20) NOT NULL UNIQUE,                -- e.g. "A-01", "B-12"
    zone        VARCHAR(50),                                -- e.g. "Quiet Zone", "Group Study"
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE seat_reservations (
    seat_reservation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seat_id             UUID NOT NULL REFERENCES seats(seat_id) ON DELETE RESTRICT,
    student_id          UUID NOT NULL REFERENCES students(student_id) ON DELETE RESTRICT,
    date                DATE NOT NULL,
    slot_start          TIME NOT NULL,
    slot_end            TIME NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'BOOKED'
                            CHECK (status IN ('BOOKED','CHECKED_IN','COMPLETED','AUTO_RELEASED','CANCELLED')),
    qr_token            TEXT UNIQUE,                        -- short-lived signed token for check-in
    qr_token_expires_at TIMESTAMPTZ,
    checked_in_at       TIMESTAMPTZ,
    checked_out_at      TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- A student can only hold one reservation per seat per date+slot
    UNIQUE (seat_id, date, slot_start)
);

CREATE INDEX idx_seat_reservations_seat_id      ON seat_reservations(seat_id);
CREATE INDEX idx_seat_reservations_student_id   ON seat_reservations(student_id);
CREATE INDEX idx_seat_reservations_date         ON seat_reservations(date);
CREATE INDEX idx_seat_reservations_qr_token     ON seat_reservations(qr_token);

-- ============================================================================
-- INVENTORY AUDIT LOG
-- ============================================================================

CREATE TABLE inventory_audit_log (
    audit_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    copy_id         UUID NOT NULL REFERENCES book_copies(copy_id) ON DELETE RESTRICT,
    scanned_by      UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    scan_date       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    result          VARCHAR(20) NOT NULL
                        CHECK (result IN ('VERIFIED','MISSING','MISPLACED')),
    expected_shelf  VARCHAR(50),                            -- shelf_block/rack/shelf at time of scan
    suggested_shelf VARCHAR(50),                            -- where the system thinks it should be
    notes           TEXT
);

CREATE INDEX idx_audit_log_copy_id      ON inventory_audit_log(copy_id);
CREATE INDEX idx_audit_log_scan_date    ON inventory_audit_log(scan_date);
CREATE INDEX idx_audit_log_result       ON inventory_audit_log(result);

-- ============================================================================
-- PASSWORD RESET TOKENS
-- ============================================================================

CREATE TABLE password_reset_tokens (
    token_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    otp_hash    TEXT NOT NULL,                              -- bcrypt hash of the OTP; never store raw OTP
    expires_at  TIMESTAMPTZ NOT NULL,
    used        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prt_user_id    ON password_reset_tokens(user_id);
CREATE INDEX idx_prt_expires_at ON password_reset_tokens(expires_at);

-- ============================================================================
-- DEMAND FORECASTS (AI cache table)
-- ============================================================================

CREATE TABLE demand_forecasts (
    forecast_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id                 UUID NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
    predicted_demand_score  NUMERIC(8,4) NOT NULL,          -- 0.0–1.0 normalized score
    priority                VARCHAR(10) NOT NULL
                                CHECK (priority IN ('HIGH','MEDIUM','LOW')),
    reasoning               TEXT,                           -- plain-English explanation of the score
    generated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (book_id)                                        -- one current forecast per book (upserted)
);

CREATE INDEX idx_demand_forecasts_priority      ON demand_forecasts(priority);
CREATE INDEX idx_demand_forecasts_generated_at  ON demand_forecasts(generated_at);

-- ============================================================================
-- VIEWS (convenience, not materialized — kept fast by indexes above)
-- ============================================================================

-- Active issues with student and book info
CREATE OR REPLACE VIEW v_active_issues AS
SELECT
    i.issue_id,
    i.copy_id,
    bc.accession_number,
    bc.shelf_block,
    bc.shelf_rack,
    bc.shelf_shelf,
    b.book_id,
    b.title AS book_title,
    b.isbn,
    s.student_id,
    u.name AS student_name,
    u.email AS student_email,
    s.enrollment_no,
    i.issue_date,
    i.due_date,
    i.status,
    i.renewal_count,
    GREATEST(0, CURRENT_DATE - i.due_date) AS overdue_days,
    GREATEST(0, i.due_date - CURRENT_DATE) AS days_remaining
FROM issues i
JOIN book_copies bc  ON bc.copy_id  = i.copy_id
JOIN books b         ON b.book_id   = bc.book_id
JOIN students s      ON s.student_id = i.student_id
JOIN users u         ON u.user_id   = s.user_id
WHERE i.status IN ('ISSUED', 'OVERDUE');

-- Student's current borrowed books (for the My Books page)
CREATE OR REPLACE VIEW v_student_books AS
SELECT
    i.issue_id,
    i.student_id,
    b.book_id,
    b.title,
    b.isbn,
    b.cover_image_url,
    a.name AS author_name,
    bc.accession_number,
    i.issue_date,
    i.due_date,
    i.return_date,
    i.status,
    i.renewal_count,
    GREATEST(0, CURRENT_DATE - i.due_date)  AS overdue_days,
    GREATEST(0, i.due_date - CURRENT_DATE)  AS days_remaining,
    COALESCE(f.amount, 0)                   AS fine_amount,
    COALESCE(f.paid, TRUE)                  AS fine_paid
FROM issues i
JOIN book_copies bc  ON bc.copy_id   = i.copy_id
JOIN books b         ON b.book_id    = bc.book_id
LEFT JOIN authors a  ON a.author_id  = b.author_id
LEFT JOIN fines f    ON f.issue_id   = i.issue_id;

-- Overdue issues for the daily reminder job
CREATE OR REPLACE VIEW v_overdue_issues AS
SELECT * FROM v_active_issues
WHERE status = 'OVERDUE' OR (status = 'ISSUED' AND due_date < CURRENT_DATE);

-- ============================================================================
-- INITIAL SEED (settings row)
-- ============================================================================

-- Insert default library settings (if not already present)
INSERT INTO library_settings (fine_per_day, max_books_per_student, default_loan_days, renewal_limit, seat_grace_minutes, library_name)
VALUES (2.00, 3, 15, 2, 15, 'Booksphere Library')
ON CONFLICT DO NOTHING;
