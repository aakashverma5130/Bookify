const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

let dbInstance = null;

const getSqliteDb = async () => {
  if (dbInstance) return dbInstance;

  const dbPath = path.join(__dirname, '../bookify_dev.db');
  const isNew = !fs.existsSync(dbPath);
  const db = new sqlite3.Database(dbPath);

  await new Promise((resolve, reject) => {
    db.serialize(async () => {
      try {
        // Enable WAL mode & foreign keys
        db.run('PRAGMA foreign_keys = ON;');
        db.run('PRAGMA journal_mode = WAL;');

        // Create Tables
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            user_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('STUDENT','ASSISTANT_LIBRARIAN','HEAD_LIBRARIAN')),
            phone TEXT,
            profile_image TEXT,
            is_active INTEGER NOT NULL DEFAULT 1,
            notify_email INTEGER NOT NULL DEFAULT 1,
            notify_web_push INTEGER NOT NULL DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS students (
            student_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
            enrollment_no TEXT UNIQUE NOT NULL,
            department TEXT NOT NULL,
            course TEXT NOT NULL,
            year INTEGER,
            semester INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS librarians (
            librarian_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
            staff_id TEXT UNIQUE NOT NULL,
            designation TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS authors (
            author_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            bio TEXT
          );
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS categories (
            category_id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL
          );
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS digital_resources (
            resource_id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            author TEXT,
            type TEXT NOT NULL,
            file_url TEXT NOT NULL,
            mime_type TEXT,
            file_size_bytes INTEGER,
            access_level TEXT NOT NULL DEFAULT 'OPEN',
            restricted_course TEXT,
            upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            uploaded_by TEXT,
            download_count INTEGER NOT NULL DEFAULT 0,
            avg_read_time_mins INTEGER NOT NULL DEFAULT 45,
            is_active INTEGER NOT NULL DEFAULT 1
          );
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS books (
            book_id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            isbn TEXT UNIQUE,
            publisher TEXT,
            publication_year INTEGER,
            description TEXT,
            category_id TEXT REFERENCES categories(category_id),
            author_id TEXT REFERENCES authors(author_id),
            cover_image_url TEXT,
            digital_resource_id TEXT REFERENCES digital_resources(resource_id),
            total_copies INTEGER NOT NULL DEFAULT 0,
            available_copies INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS book_copies (
            copy_id TEXT PRIMARY KEY,
            book_id TEXT NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
            accession_number TEXT UNIQUE NOT NULL,
            barcode_value TEXT,
            qr_code_value TEXT,
            shelf_block TEXT,
            shelf_rack TEXT,
            shelf_shelf TEXT,
            status TEXT NOT NULL DEFAULT 'AVAILABLE',
            condition_notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS issues (
            issue_id TEXT PRIMARY KEY,
            copy_id TEXT NOT NULL REFERENCES book_copies(copy_id),
            student_id TEXT NOT NULL REFERENCES students(student_id),
            issue_date DATE NOT NULL,
            due_date DATE NOT NULL,
            return_date DATE,
            status TEXT NOT NULL DEFAULT 'ISSUED',
            issued_by TEXT REFERENCES users(user_id),
            returned_to TEXT REFERENCES users(user_id),
            renewal_count INTEGER NOT NULL DEFAULT 0,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS fines (
            fine_id TEXT PRIMARY KEY,
            issue_id TEXT NOT NULL REFERENCES issues(issue_id),
            student_id TEXT NOT NULL REFERENCES students(student_id),
            amount REAL NOT NULL,
            reason TEXT NOT NULL,
            paid INTEGER NOT NULL DEFAULT 0,
            paid_at DATETIME,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS book_reservations (
            reservation_id TEXT PRIMARY KEY,
            book_id TEXT NOT NULL REFERENCES books(book_id),
            student_id TEXT NOT NULL REFERENCES students(student_id),
            reservation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            expiry_date DATETIME,
            status TEXT NOT NULL DEFAULT 'WAITING',
            queue_position INTEGER NOT NULL DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS seats (
            seat_id TEXT PRIMARY KEY,
            seat_label TEXT UNIQUE NOT NULL,
            zone TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1
          );
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS seat_reservations (
            seat_reservation_id TEXT PRIMARY KEY,
            seat_id TEXT NOT NULL REFERENCES seats(seat_id),
            student_id TEXT NOT NULL REFERENCES students(student_id),
            date DATE NOT NULL,
            slot_start TIME NOT NULL,
            slot_end TIME NOT NULL,
            qr_token TEXT NOT NULL,
            qr_token_expires_at DATETIME,
            status TEXT NOT NULL DEFAULT 'BOOKED',
            checked_in_at DATETIME,
            checked_out_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS purchase_requests (
            request_id TEXT PRIMARY KEY,
            student_id TEXT NOT NULL REFERENCES students(student_id),
            title TEXT NOT NULL,
            author TEXT,
            isbn TEXT,
            reason TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'PENDING',
            librarian_notes TEXT,
            reviewed_by TEXT REFERENCES users(user_id),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            reviewed_at DATETIME
          );
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS demand_forecasts (
            forecast_id TEXT PRIMARY KEY,
            book_id TEXT UNIQUE NOT NULL REFERENCES books(book_id),
            predicted_demand_score REAL NOT NULL,
            priority TEXT NOT NULL,
            reasoning TEXT,
            generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS inventory_audit_log (
            audit_id TEXT PRIMARY KEY,
            copy_id TEXT NOT NULL REFERENCES book_copies(copy_id),
            scanned_by TEXT NOT NULL REFERENCES users(user_id),
            scan_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            result TEXT NOT NULL,
            expected_shelf TEXT,
            suggested_shelf TEXT,
            notes TEXT
          );
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS password_reset_tokens (
            token_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(user_id),
            otp_hash TEXT NOT NULL,
            expires_at DATETIME NOT NULL,
            used INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS notifications (
            notification_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(user_id),
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT NOT NULL,
            channel TEXT NOT NULL DEFAULT 'IN_APP',
            is_read INTEGER NOT NULL DEFAULT 0,
            metadata TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS library_settings (
            settings_id INTEGER PRIMARY KEY DEFAULT 1,
            library_name TEXT DEFAULT 'Bookify Library',
            fine_per_day REAL DEFAULT 2.00,
            max_books_per_student INTEGER DEFAULT 3,
            default_loan_days INTEGER DEFAULT 15,
            renewal_limit INTEGER DEFAULT 2,
            seat_grace_minutes INTEGER DEFAULT 15,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_by TEXT
          );
        `);

        // Views
        db.run(`
          CREATE VIEW IF NOT EXISTS v_active_issues AS
          SELECT
              i.issue_id, i.copy_id, bc.accession_number, bc.shelf_block, bc.shelf_rack, bc.shelf_shelf,
              b.book_id, b.title AS book_title, b.isbn, s.student_id, u.name AS student_name, u.email AS student_email,
              s.enrollment_no, i.issue_date, i.due_date, i.status, i.renewal_count,
              MAX(0, CAST(julianday('now') - julianday(i.due_date) AS INTEGER)) AS overdue_days,
              MAX(0, CAST(julianday(i.due_date) - julianday('now') AS INTEGER)) AS days_remaining
          FROM issues i
          JOIN book_copies bc ON bc.copy_id = i.copy_id
          JOIN books b ON b.book_id = bc.book_id
          JOIN students s ON s.student_id = i.student_id
          JOIN users u ON u.user_id = s.user_id
          WHERE i.status IN ('ISSUED', 'OVERDUE');
        `);

        db.run(`
          CREATE VIEW IF NOT EXISTS v_student_books AS
          SELECT
              i.issue_id, i.student_id, b.book_id, b.title, b.title AS book_title, b.isbn, b.cover_image_url,
              a.name AS author_name, bc.accession_number, i.issue_date, i.due_date, i.return_date, i.status,
              i.renewal_count,
              MAX(0, CAST(julianday('now') - julianday(i.due_date) AS INTEGER)) AS overdue_days,
              MAX(0, CAST(julianday(i.due_date) - julianday('now') AS INTEGER)) AS days_remaining,
              COALESCE(f.amount, 0) AS fine_amount,
              COALESCE(f.paid, 1) AS fine_paid
          FROM issues i
          JOIN book_copies bc ON bc.copy_id = i.copy_id
          JOIN books b ON b.book_id = bc.book_id
          LEFT JOIN authors a ON a.author_id = b.author_id
          LEFT JOIN fines f ON f.issue_id = i.issue_id;
        `);

        // Check if seed needed
        db.get('SELECT COUNT(*) as count FROM users', async (err, row) => {
          if (!row || row.count === 0) {
            console.log('[LOCAL DB] Seeding initial mock data into SQLite...');
            await seedLocalDb(db);
          }
          resolve();
        });
      } catch (e) {
        reject(e);
      }
    });
  });

  dbInstance = db;
  return db;
};

async function seedLocalDb(db) {
  const adminHash = await bcrypt.hash('Admin@123', 10);
  const studentHash = await bcrypt.hash('Student@123', 10);

  db.serialize(() => {
    // Settings
    db.run(`INSERT OR IGNORE INTO library_settings (settings_id, fine_per_day, max_books_per_student, default_loan_days, renewal_limit, seat_grace_minutes) VALUES (1, 2.00, 3, 15, 2, 15)`);

    // Users (Librarians & Students)
    const users = [
      ['u-head', 'Dr. Sarah Jenkins', 'head@university.edu', adminHash, 'HEAD_LIBRARIAN', '+1-555-0101'],
      ['u-lib1', 'Michael Chen', 'librarian@university.edu', adminHash, 'ASSISTANT_LIBRARIAN', '+1-555-0102'],
      ['u-std1', 'Alex Rivera', 'student1@university.edu', studentHash, 'STUDENT', '+1-555-0201'],
      ['u-std2', 'Priya Sharma', 'student2@university.edu', studentHash, 'STUDENT', '+1-555-0202'],
      ['u-std3', 'James Wilson', 'student3@university.edu', studentHash, 'STUDENT', '+1-555-0203'],
      ['u-std4', 'Emily Zhang', 'student4@university.edu', studentHash, 'STUDENT', '+1-555-0204'],
    ];

    const stmtUser = db.prepare('INSERT OR IGNORE INTO users (user_id, name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?, ?)');
    users.forEach(u => stmtUser.run(u));
    stmtUser.finalize();

    // Librarians table
    db.run(`INSERT OR IGNORE INTO librarians (librarian_id, user_id, staff_id, designation) VALUES ('l-1', 'u-head', 'LIB-001', 'Chief Librarian'), ('l-2', 'u-lib1', 'LIB-002', 'Catalog & Circulation Lead')`);

    // Students table
    db.run(`INSERT OR IGNORE INTO students (student_id, user_id, enrollment_no, department, course, year, semester) VALUES
      ('s-1', 'u-std1', 'ENR-2023-CS01', 'Computer Science', 'B.Tech CSE', 3, 5),
      ('s-2', 'u-std2', 'ENR-2023-EC04', 'Electronics', 'B.Tech ECE', 3, 5),
      ('s-3', 'u-std3', 'ENR-2022-ME12', 'Mechanical', 'B.Tech ME', 4, 7),
      ('s-4', 'u-std4', 'ENR-2024-CS88', 'Computer Science', 'B.Tech CSE', 2, 3)
    `);

    // Authors
    const authors = [
      ['a-1', 'Abraham Silberschatz', 'Database expert, co-author of Operating System Concepts & Database System Concepts.'],
      ['a-2', 'Dennis Ritchie', 'Creator of C and co-creator of UNIX.'],
      ['a-3', 'Thomas Cormen', 'Co-author of Introduction to Algorithms (CLRS).'],
      ['a-4', 'Robert C. Martin', 'Author of Clean Code and Clean Architecture.'],
      ['a-5', 'Andrew Tanenbaum', 'Author of Computer Networks and Modern Operating Systems.'],
      ['a-6', 'Martin Kleppmann', 'Author of Designing Data-Intensive Applications.'],
      ['a-7', 'Cal Newport', 'Author of Deep Work and So Good They Can\'t Ignore You.'],
      ['a-8', 'Stuart Russell & Peter Norvig', 'Authors of Artificial Intelligence: A Modern Approach.'],
    ];
    const stmtAuth = db.prepare('INSERT OR IGNORE INTO authors (author_id, name, bio) VALUES (?, ?, ?)');
    authors.forEach(a => stmtAuth.run(a));
    stmtAuth.finalize();

    // Categories
    const categories = [
      ['c-1', 'Computer Science'],
      ['c-2', 'Mathematics'],
      ['c-3', 'Electronics & Communication'],
      ['c-4', 'Management & Productivity'],
      ['c-5', 'AI & Machine Learning'],
    ];
    const stmtCat = db.prepare('INSERT OR IGNORE INTO categories (category_id, name) VALUES (?, ?)');
    categories.forEach(c => stmtCat.run(c));
    stmtCat.finalize();

    // Digital Resources
    db.run(`INSERT OR IGNORE INTO digital_resources (resource_id, title, author, type, file_url, access_level, download_count) VALUES
      ('dr-1', 'Introduction to Algorithms — 4th Edition E-Book', 'Thomas Cormen et al.', 'PDF', '/uploads/clrs.pdf', 'OPEN', 142),
      ('dr-2', 'Designing Data-Intensive Applications — PDF Archive', 'Martin Kleppmann', 'PDF', '/uploads/ddia.pdf', 'OPEN', 215),
      ('dr-3', 'Operating System Architecture — Lecture Notes', 'Faculty of CS', 'PDF', '/uploads/os_notes.pdf', 'COURSE_RESTRICTED', 45),
      ('dr-4', 'Deep Work Mastery Guide', 'Cal Newport', 'EPUB', '/uploads/deep_work.epub', 'OPEN', 88)
    `);

    // Books
    const books = [
      ['b-1', 'Database System Concepts', '978-0078022159', 'McGraw-Hill', 2019, 'The definitive reference on relational databases, SQL, normalization, and ACID transactions.', 'c-1', 'a-1', 'https://covers.openlibrary.org/b/id/8398133-L.jpg', null, 3, 2],
      ['b-2', 'The C Programming Language', '978-0131103627', 'Prentice Hall', 1988, 'The original reference for C by its creators Dennis Ritchie & Brian Kernighan.', 'c-1', 'a-2', 'https://covers.openlibrary.org/b/id/8369963-L.jpg', null, 3, 3],
      ['b-3', 'Introduction to Algorithms (CLRS)', '978-0262046305', 'MIT Press', 2022, 'The classic algorithms textbook — comprehensive, rigorous, and exhaustive.', 'c-1', 'a-3', 'https://covers.openlibrary.org/b/id/8421127-L.jpg', 'dr-1', 4, 1],
      ['b-4', 'Clean Code', '978-0132350884', 'Prentice Hall', 2008, 'Martin\'s legendary guide to writing readable, maintainable, and robust software.', 'c-1', 'a-4', 'https://covers.openlibrary.org/b/id/8397130-L.jpg', null, 2, 2],
      ['b-5', 'Clean Architecture', '978-0134494166', 'Prentice Hall', 2017, 'Universal rules and design patterns for software architecture.', 'c-1', 'a-4', 'https://covers.openlibrary.org/b/id/9001234-L.jpg', null, 2, 0],
      ['b-6', 'Computer Networks', '978-0132126953', 'Prentice Hall', 2010, 'Tanenbaum\'s authoritative text on OSI layer architectures, TCP/IP, and routing.', 'c-1', 'a-5', 'https://covers.openlibrary.org/b/id/8369948-L.jpg', null, 3, 2],
      ['b-7', 'Designing Data-Intensive Applications', '978-1449373320', 'O\'Reilly', 2017, 'The modern bible of distributed systems, storage engines, stream processing, and replication.', 'c-1', 'a-6', 'https://covers.openlibrary.org/b/id/10221537-L.jpg', 'dr-2', 3, 1],
      ['b-8', 'Deep Work', '978-1455586691', 'Grand Central', 2016, 'Rules for focused success in a distracted world.', 'c-4', 'a-7', 'https://covers.openlibrary.org/b/id/8406988-L.jpg', 'dr-4', 2, 2],
      ['b-9', 'Artificial Intelligence: A Modern Approach', '978-0134610993', 'Pearson', 2020, 'The premier AI textbook spanning heuristic search, logic, neural networks, and reinforcement learning.', 'c-5', 'a-8', 'https://covers.openlibrary.org/b/id/8583706-L.jpg', null, 3, 2],
    ];

    const stmtBook = db.prepare('INSERT OR IGNORE INTO books (book_id, title, isbn, publisher, publication_year, description, category_id, author_id, cover_image_url, digital_resource_id, total_copies, available_copies) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    books.forEach(b => stmtBook.run(b));
    stmtBook.finalize();

    // Book Copies
    const copies = [
      ['cp-1', 'b-1', 'ACC-1001', 'BAR-1001', 'QR-ACC-1001', 'A', '1', '1', 'AVAILABLE'],
      ['cp-2', 'b-1', 'ACC-1002', 'BAR-1002', 'QR-ACC-1002', 'A', '1', '2', 'AVAILABLE'],
      ['cp-3', 'b-1', 'ACC-1003', 'BAR-1003', 'QR-ACC-1003', 'A', '1', '3', 'ISSUED'],
      ['cp-4', 'b-3', 'ACC-2001', 'BAR-2001', 'QR-ACC-2001', 'A', '2', '1', 'ISSUED'],
      ['cp-5', 'b-3', 'ACC-2002', 'BAR-2002', 'QR-ACC-2002', 'A', '2', '2', 'AVAILABLE'],
      ['cp-6', 'b-5', 'ACC-3001', 'BAR-3001', 'QR-ACC-3001', 'B', '1', '1', 'ISSUED'],
      ['cp-7', 'b-5', 'ACC-3002', 'BAR-3002', 'QR-ACC-3002', 'B', '1', '2', 'ISSUED'],
      ['cp-8', 'b-7', 'ACC-4001', 'BAR-4001', 'QR-ACC-4001', 'B', '2', '1', 'ISSUED'],
      ['cp-9', 'b-7', 'ACC-4002', 'BAR-4002', 'QR-ACC-4002', 'B', '2', '2', 'AVAILABLE'],
    ];
    const stmtCp = db.prepare('INSERT OR IGNORE INTO book_copies (copy_id, book_id, accession_number, barcode_value, qr_code_value, shelf_block, shelf_rack, shelf_shelf, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    copies.forEach(cp => stmtCp.run(cp));
    stmtCp.finalize();

    // Issues (Active & overdue samples)
    const today = new Date().toISOString().slice(0, 10);
    const dueSoon = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
    const overdueDate = new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10);
    const pastIssueDate = new Date(Date.now() - 20 * 86400000).toISOString().slice(0, 10);

    db.run(`INSERT OR IGNORE INTO issues (issue_id, copy_id, student_id, issue_date, due_date, status, renewal_count) VALUES
      ('iss-1', 'cp-3', 's-1', '${pastIssueDate}', '${dueSoon}', 'ISSUED', 0),
      ('iss-2', 'cp-4', 's-1', '${pastIssueDate}', '${overdueDate}', 'OVERDUE', 1),
      ('iss-3', 'cp-6', 's-2', '${pastIssueDate}', '${dueSoon}', 'ISSUED', 0),
      ('iss-4', 'cp-7', 's-3', '${pastIssueDate}', '${overdueDate}', 'OVERDUE', 0),
      ('iss-5', 'cp-8', 's-4', '${pastIssueDate}', '${dueSoon}', 'ISSUED', 0)
    `);

    // Fines
    db.run(`INSERT OR IGNORE INTO fines (fine_id, issue_id, student_id, amount, reason, paid, notes) VALUES
      ('f-1', 'iss-2', 's-1', 10.00, 'OVERDUE', 0, '5 days overdue @ Rs 2.00/day'),
      ('f-2', 'iss-4', 's-3', 14.00, 'OVERDUE', 0, '7 days overdue @ Rs 2.00/day')
    `);

    // Seats (20 library study seats across 4 zones)
    for (let z of ['A', 'B', 'C', 'D']) {
      for (let num = 1; num <= 5; num++) {
        const label = `${z}-0${num}`;
        const seatId = `seat-${z}-${num}`;
        db.run(`INSERT OR IGNORE INTO seats (seat_id, seat_label, zone, is_active) VALUES ('${seatId}', '${label}', '${z}', 1)`);
      }
    }

    // Demand forecasts
    db.run(`INSERT OR IGNORE INTO demand_forecasts (forecast_id, book_id, predicted_demand_score, priority, reasoning) VALUES
      ('df-1', 'b-3', 0.95, 'HIGH', 'High demand: All copies frequently borrowed with active waitlist queues.'),
      ('df-2', 'b-5', 0.90, 'HIGH', 'Zero available physical copies. Recommend ordering 2 additional copies.'),
      ('df-3', 'b-7', 0.82, 'HIGH', 'Essential syllabus text for Distributed Systems course.'),
      ('df-4', 'b-1', 0.58, 'MEDIUM', 'Steady borrowing rate across CS departments.'),
      ('df-5', 'b-2', 0.25, 'LOW', 'Adequate physical copies currently available.')
    `);

    // Notifications
    db.run(`INSERT OR IGNORE INTO notifications (notification_id, user_id, title, message, type, is_read) VALUES
      ('notif-1', 'u-std1', 'Book Due in 2 Days', '"Database System Concepts" is due in 2 days. Return on time to avoid fines.', 'DUE_REMINDER', 0),
      ('notif-2', 'u-std1', 'Book Overdue Alert', '"Introduction to Algorithms" is 5 days overdue. Fine: Rs. 10.00.', 'OVERDUE', 0),
      ('notif-3', 'u-std2', 'Welcome to Bookify', 'Explore our physical catalog and digital shelf.', 'GENERAL', 1)
    `);

    console.log('[LOCAL DB] SQLite seed completed successfully!');
  });
}

module.exports = { getSqliteDb };
