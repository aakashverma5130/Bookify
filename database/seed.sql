-- ============================================================================
-- Booksphere — Seed Data
-- Run AFTER schema.sql:  psql -U postgres -d booksphere -f database/seed.sql
-- ============================================================================

BEGIN;

-- ── Authors ──────────────────────────────────────────────────────────────────

INSERT INTO authors (author_id, name, bio) VALUES
('a1000000-0000-0000-0000-000000000001','Abraham Silberschatz','Database expert, co-author of the classic OS and DB textbooks.'),
('a1000000-0000-0000-0000-000000000002','Peter Galvin','Co-author of Operating System Concepts.'),
('a1000000-0000-0000-0000-000000000003','Greg Gagne','Co-author of Operating System Concepts.'),
('a1000000-0000-0000-0000-000000000004','Dennis Ritchie','Creator of C and co-creator of UNIX.'),
('a1000000-0000-0000-0000-000000000005','Brian Kernighan','Co-creator of C; co-author of The C Programming Language.'),
('a1000000-0000-0000-0000-000000000006','Herbert Schildt','Prolific author of Java and C++ texts.'),
('a1000000-0000-0000-0000-000000000007','James Gosling','Creator of Java.'),
('a1000000-0000-0000-0000-000000000008','Robert Sedgewick','Author of Algorithms textbooks.'),
('a1000000-0000-0000-0000-000000000009','Kevin Wayne','Co-author of Algorithms (Sedgewick & Wayne).'),
('a1000000-0000-0000-0000-000000000010','Thomas Cormen','Co-author of Introduction to Algorithms (CLRS).'),
('a1000000-0000-0000-0000-000000000011','Charles Leiserson','Co-author of CLRS.'),
('a1000000-0000-0000-0000-000000000012','Ronald Rivest','Co-author of CLRS; inventor of RSA.'),
('a1000000-0000-0000-0000-000000000013','Clifford Stein','Co-author of CLRS.'),
('a1000000-0000-0000-0000-000000000014','Andrew Tanenbaum','Author of Computer Networks and Modern Operating Systems.'),
('a1000000-0000-0000-0000-000000000015','Stuart Russell','Co-author of Artificial Intelligence: A Modern Approach.'),
('a1000000-0000-0000-0000-000000000016','Peter Norvig','Co-author of Artificial Intelligence: A Modern Approach.'),
('a1000000-0000-0000-0000-000000000017','Erich Gamma','Co-author of Design Patterns (Gang of Four).'),
('a1000000-0000-0000-0000-000000000018','Richard Helm','Co-author of Design Patterns.'),
('a1000000-0000-0000-0000-000000000019','Ralph Johnson','Co-author of Design Patterns.'),
('a1000000-0000-0000-0000-000000000020','John Vlissides','Co-author of Design Patterns.'),
('a1000000-0000-0000-0000-000000000021','Martin Fowler','Author of Refactoring and Patterns of Enterprise Application Architecture.'),
('a1000000-0000-0000-0000-000000000022','Robert C. Martin','Author of Clean Code and Clean Architecture.'),
('a1000000-0000-0000-0000-000000000023','William Stallings','Author of Computer Organization and Architecture.'),
('a1000000-0000-0000-0000-000000000024','Behrouz Forouzan','Author of Data Communications and Networking.'),
('a1000000-0000-0000-0000-000000000025','Yuval Noah Harari','Author of Sapiens and Homo Deus.'),
('a1000000-0000-0000-0000-000000000026','Nassim Nicholas Taleb','Author of The Black Swan and Antifragile.'),
('a1000000-0000-0000-0000-000000000027','Michael Lewis','Author of Moneyball and The Big Short.'),
('a1000000-0000-0000-0000-000000000028','Cal Newport','Author of Deep Work and Digital Minimalism.');

-- ── Categories ────────────────────────────────────────────────────────────────

INSERT INTO categories (category_id, name) VALUES
('c1000000-0000-0000-0000-000000000001','Computer Science'),
('c1000000-0000-0000-0000-000000000002','Mathematics'),
('c1000000-0000-0000-0000-000000000003','Electronics & Communication'),
('c1000000-0000-0000-0000-000000000004','Mechanical Engineering'),
('c1000000-0000-0000-0000-000000000005','Management & Business'),
('c1000000-0000-0000-0000-000000000006','General Non-Fiction'),
('c1000000-0000-0000-0000-000000000007','Physics'),
('c1000000-0000-0000-0000-000000000008','Chemistry');

-- ── Digital Resources ─────────────────────────────────────────────────────────

INSERT INTO digital_resources (resource_id, title, author, type, file_url, access_level, download_count) VALUES
('d1000000-0000-0000-0000-000000000001','Introduction to Algorithms — E-Book','Thomas Cormen et al.','EBOOK','/uploads/ebooks/clrs.pdf','OPEN',142),
('d1000000-0000-0000-0000-000000000002','Journal of Computer Science & Technology','Various','JOURNAL','/uploads/journals/jcst_2024.pdf','OPEN',87),
('d1000000-0000-0000-0000-000000000003','Artificial Intelligence: A Modern Approach — E-Book','Stuart Russell, Peter Norvig','EBOOK','/uploads/ebooks/aima.pdf','OPEN',203),
('d1000000-0000-0000-0000-000000000004','Advanced Database Systems — Course Notes','Various','EBOOK','/uploads/ebooks/advanced_db.pdf','COURSE_RESTRICTED',31),
('d1000000-0000-0000-0000-000000000005','Deep Work — E-Book','Cal Newport','EBOOK','/uploads/ebooks/deep_work.pdf','OPEN',67);

-- ── Books (80 titles) ─────────────────────────────────────────────────────────

INSERT INTO books (book_id, title, isbn, publisher, publication_year, description, category_id, author_id, cover_image_url, digital_resource_id) VALUES
-- Computer Science (30 books)
('b1000000-0000-0000-0000-000000000001','Database System Concepts','978-0078022159','McGraw-Hill',2019,'The definitive reference on relational databases, SQL, normalization, and transactions.','c1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','https://covers.openlibrary.org/b/id/8398133-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000002','Operating System Concepts','978-1119800361','Wiley',2021,'Comprehensive coverage of OS internals: processes, threads, scheduling, memory, and file systems.','c1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','https://covers.openlibrary.org/b/id/8394949-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000003','The C Programming Language','978-0131103627','Prentice Hall',1988,'The original reference for C by its creators.','c1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000004','https://covers.openlibrary.org/b/id/8369963-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000004','Java: The Complete Reference','978-1260440232','McGraw-Hill',2021,'Exhaustive Java reference covering core language to advanced APIs.','c1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000006','https://covers.openlibrary.org/b/id/8406786-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000005','Introduction to Algorithms','978-0262046305','MIT Press',2022,'The classic CLRS algorithms textbook — comprehensive and rigorous.','c1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000010','https://covers.openlibrary.org/b/id/8421127-L.jpg','d1000000-0000-0000-0000-000000000001'),
('b1000000-0000-0000-0000-000000000006','Algorithms','978-0321573513','Addison-Wesley',2011,'Sedgewick and Wayne''s acclaimed algorithms course textbook.','c1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000008','https://covers.openlibrary.org/b/id/7984916-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000007','Computer Networks','978-0132126953','Prentice Hall',2010,'Tanenbaum''s authoritative text on computer networking.','c1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000014','https://covers.openlibrary.org/b/id/8369948-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000008','Artificial Intelligence: A Modern Approach','978-0134610993','Prentice Hall',2020,'The leading AI textbook covering search, logic, planning, learning, and perception.','c1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000015','https://covers.openlibrary.org/b/id/8583706-L.jpg','d1000000-0000-0000-0000-000000000003'),
('b1000000-0000-0000-0000-000000000009','Design Patterns: Elements of Reusable Object-Oriented Software','978-0201633610','Addison-Wesley',1994,'The Gang of Four book — 23 patterns every software developer should know.','c1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000017','https://covers.openlibrary.org/b/id/8413930-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000010','Clean Code','978-0132350884','Prentice Hall',2008,'Martin''s guide to writing readable, maintainable code.','c1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000022','https://covers.openlibrary.org/b/id/8397130-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000011','Refactoring: Improving the Design of Existing Code','978-0134757599','Addison-Wesley',2018,'Fowler''s systematic approach to improving code structure without changing behavior.','c1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000021','https://covers.openlibrary.org/b/id/8406999-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000012','Clean Architecture','978-0134494166','Prentice Hall',2017,'Principles and patterns for software architecture.','c1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000022','https://covers.openlibrary.org/b/id/9001234-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000013','Computer Organization and Architecture','978-0134997193','Pearson',2019,'Stallings'' comprehensive treatment of computer hardware design.','c1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000023','https://covers.openlibrary.org/b/id/8394820-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000014','Data Communications and Networking','978-0073376226','McGraw-Hill',2013,'Forouzan''s accessible textbook on networking fundamentals.','c1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000024','https://covers.openlibrary.org/b/id/8406997-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000015','Modern Operating Systems','978-0136006633','Prentice Hall',2014,'Tanenbaum''s detailed treatment of modern OS design and implementation.','c1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000014','https://covers.openlibrary.org/b/id/8406994-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000016','Python Crash Course','978-1718502703','No Starch Press',2023,'A hands-on introduction to Python programming.','c1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000005','https://covers.openlibrary.org/b/id/10209952-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000017','Cracking the Coding Interview','978-0984782857','CareerCup',2015,'189 programming interview questions with solutions.','c1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000009','https://covers.openlibrary.org/b/id/8761254-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000018','Head First Design Patterns','978-0596007126','O''Reilly',2004,'Design patterns explained visually and memorably.','c1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000018','https://covers.openlibrary.org/b/id/8406996-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000019','The Pragmatic Programmer','978-0135957059','Addison-Wesley',2019,'Timeless advice for software craftsmanship.','c1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000021','https://covers.openlibrary.org/b/id/8406995-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000020','Computer Graphics: Principles and Practice','978-0321399526','Addison-Wesley',2013,'The definitive reference on computer graphics.','c1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000011','https://covers.openlibrary.org/b/id/8406993-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000021','Introduction to the Theory of Computation','978-1133187790','Cengage',2012,'Sipser''s classic text on automata, languages, and complexity.','c1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000012','https://covers.openlibrary.org/b/id/8406992-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000022','Compilers: Principles, Techniques and Tools','978-0321486813','Addison-Wesley',2006,'The Dragon Book on compiler design.','c1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000013','https://covers.openlibrary.org/b/id/8406991-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000023','Software Engineering','978-0133943030','Pearson',2015,'Sommerville''s comprehensive software engineering text.','c1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000019','https://covers.openlibrary.org/b/id/8406990-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000024','Machine Learning: A Probabilistic Perspective','978-0262018029','MIT Press',2012,'Murphy''s thorough probabilistic treatment of machine learning.','c1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000016','https://covers.openlibrary.org/b/id/8406989-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000025','Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow','978-1492032649','O''Reilly',2022,'Practical ML with Python — the go-to applied text.','c1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000020','https://covers.openlibrary.org/b/id/10221537-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000026','Deep Learning','978-0262035613','MIT Press',2016,'The foundational deep learning textbook by Goodfellow, Bengio, and Courville.','c1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000015','https://covers.openlibrary.org/b/id/8406988-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000027','Natural Language Processing with Python','978-0596516499','O''Reilly',2009,'Bird, Klein & Loper''s NLTK guide.','c1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000007','https://covers.openlibrary.org/b/id/8406987-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000028','Discrete Mathematics and Its Applications','978-0073383095','McGraw-Hill',2018,'Rosen''s accessible discrete math textbook.','c1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000013','https://covers.openlibrary.org/b/id/8406986-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000029','Introduction to Linear Algebra','978-0980232776','Wellesley-Cambridge Press',2016,'Strang''s celebrated linear algebra text.','c1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000011','https://covers.openlibrary.org/b/id/8406985-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000030','Computer Vision: Algorithms and Applications','978-1848829343','Springer',2010,'Szeliski''s comprehensive computer vision reference.','c1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000016','https://covers.openlibrary.org/b/id/8406984-L.jpg',NULL),

-- Mathematics (15 books)
('b1000000-0000-0000-0000-000000000031','Calculus: Early Transcendentals','978-1285741550','Cengage',2015,'Stewart''s calculus text, widely used in engineering programs.','c1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000011','https://covers.openlibrary.org/b/id/8406983-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000032','Probability and Statistics for Engineers and Scientists','978-0321629111','Pearson',2011,'Walpole et al. — the standard probability & stats engineering text.','c1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000012','https://covers.openlibrary.org/b/id/8406982-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000033','Advanced Engineering Mathematics','978-1118141809','Wiley',2019,'Kreyszig''s comprehensive advanced mathematics for engineers.','c1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000013','https://covers.openlibrary.org/b/id/8406981-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000034','Numerical Methods for Engineers','978-0073397924','McGraw-Hill',2014,'Chapra''s practical numerical methods textbook.','c1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000010','https://covers.openlibrary.org/b/id/8406980-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000035','Graph Theory','978-0387952840','Springer',2000,'Diestel''s rigorous graph theory textbook.','c1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000009','https://covers.openlibrary.org/b/id/8406979-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000036','Real Analysis','978-0471321484','Wiley',1996,'Royden and Fitzpatrick''s measure theory and real analysis text.','c1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000012','https://covers.openlibrary.org/b/id/8406978-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000037','Abstract Algebra','978-0471433347','Wiley',2004,'Dummit and Foote — the comprehensive abstract algebra reference.','c1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000013','https://covers.openlibrary.org/b/id/8406977-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000038','Mathematical Methods in the Physical Sciences','978-0471198260','Wiley',2005,'Boas — the essential math methods text for physics and engineering.','c1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000011','https://covers.openlibrary.org/b/id/8406976-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000039','Combinatorics and Graph Theory','978-0387797106','Springer',2008,'Harris et al. — undergraduate combinatorics text.','c1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000010','https://covers.openlibrary.org/b/id/8406975-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000040','Introduction to Probability','978-1466575578','CRC Press',2014,'Blitzstein & Hwang — elegant probability with real-world examples.','c1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000009','https://covers.openlibrary.org/b/id/8406974-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000041','Topology','978-0131816299','Prentice Hall',2000,'Munkres — the standard undergraduate topology text.','c1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000011','https://covers.openlibrary.org/b/id/8406973-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000042','Complex Analysis','978-0070006577','McGraw-Hill',1979,'Churchill and Brown''s classic complex analysis text.','c1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000010','https://covers.openlibrary.org/b/id/8406972-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000043','Differential Equations and Linear Algebra','978-0134497181','Pearson',2015,'Goode and Annin — combined DE and linear algebra treatment.','c1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000013','https://covers.openlibrary.org/b/id/8406971-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000044','The Art of Problem Solving, Volume 2','978-1934124123','AoPS',2006','Rusczyk et al. — problem-solving mathematics for competitions.','c1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000012','https://covers.openlibrary.org/b/id/8406970-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000045','A First Course in Abstract Algebra','978-0201763904','Pearson',2002','Fraleigh — accessible abstract algebra introduction.','c1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000011','https://covers.openlibrary.org/b/id/8406969-L.jpg',NULL),

-- Electronics & Communication (10 books)
('b1000000-0000-0000-0000-000000000046','Microelectronic Circuits','978-0190853464','Oxford University Press',2020,'Sedra and Smith — the standard electronics textbook.','c1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000014','https://covers.openlibrary.org/b/id/8406968-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000047','Digital Signal Processing','978-0131873742','Prentice Hall',2006','Proakis and Manolakis — the reference on DSP.','c1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000023','https://covers.openlibrary.org/b/id/8406967-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000048','Communication Systems Engineering','978-0130617934','Prentice Hall',2002','Proakis and Salehi — comprehensive communications engineering text.','c1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000024','https://covers.openlibrary.org/b/id/8406966-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000049','Electromagnetic Field Theory','978-0750685603','Elsevier',2004','Griffiths-level EM theory for engineering students.','c1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000023','https://covers.openlibrary.org/b/id/8406965-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000050','Digital Electronics and Logic Design','978-0073380643','McGraw-Hill',2019','Tocci et al. — logic circuits and digital systems.','c1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000024','https://covers.openlibrary.org/b/id/8406964-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000051','VLSI Design','978-0195393248','Oxford',2013','Weste and Harris — the standard VLSI text.','c1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000014','https://covers.openlibrary.org/b/id/8406963-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000052','Introduction to Robotics','978-0201543612','Addison-Wesley',1986','Craig''s classic robotics mechanics and control text.','c1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000015','https://covers.openlibrary.org/b/id/8406962-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000053','Control Systems Engineering','978-1118170519','Wiley',2017','Nise''s clear and practical control systems text.','c1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000016','https://covers.openlibrary.org/b/id/8406961-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000054','Antenna Theory: Analysis and Design','978-1118642061','Wiley',2016','Balanis — the definitive antenna engineering text.','c1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000023','https://covers.openlibrary.org/b/id/8406960-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000055','Wireless Communications','978-0521837163','Cambridge',2005','Tse and Viswanath — rigorous wireless communications theory.','c1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000024','https://covers.openlibrary.org/b/id/8406959-L.jpg',NULL),

-- Mechanical Engineering (5 books)
('b1000000-0000-0000-0000-000000000056','Engineering Mechanics: Dynamics','978-0133915389','Pearson',2015','Hibbeler''s standard dynamics text.','c1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000013','https://covers.openlibrary.org/b/id/8406958-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000057','Thermodynamics: An Engineering Approach','978-0073398174','McGraw-Hill',2018','Cengel and Boles — the leading thermodynamics text.','c1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000014','https://covers.openlibrary.org/b/id/8406957-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000058','Fluid Mechanics','978-1259696534','McGraw-Hill',2017','Cengel and Cimbala — practical fluid mechanics.','c1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000014','https://covers.openlibrary.org/b/id/8406956-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000059','Shigley''s Mechanical Engineering Design','978-0073398204','McGraw-Hill',2014','The standard mechanical design text for engineering students.','c1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000015','https://covers.openlibrary.org/b/id/8406955-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000060','Manufacturing Engineering and Technology','978-0133489996','Pearson',2013','Kalpakjian — comprehensive manufacturing processes text.','c1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000016','https://covers.openlibrary.org/b/id/8406954-L.jpg',NULL),

-- Management & Business (10 books)
('b1000000-0000-0000-0000-000000000061','Principles of Management','978-0073530406','McGraw-Hill',2019','Bateman and Snell — broad management principles text.','c1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000021','https://covers.openlibrary.org/b/id/8406953-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000062','Financial Accounting','978-1259914898','McGraw-Hill',2017','Libby et al. — standard financial accounting textbook.','c1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000022','https://covers.openlibrary.org/b/id/8406952-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000063','Marketing Management','978-0133856460','Pearson',2016','Kotler and Keller — the marketing bible.','c1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000021','https://covers.openlibrary.org/b/id/8406951-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000064','Human Resource Management','978-0134235324','Pearson',2016','Dessler''s comprehensive HRM text.','c1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000022','https://covers.openlibrary.org/b/id/8406950-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000065','Operations Management','978-0134130422','Pearson',2016','Heizer, Render, and Munson — operations management essentials.','c1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000021','https://covers.openlibrary.org/b/id/8406949-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000066','Moneyball','978-0393324815','W.W. Norton',2003','Lewis on data-driven decision-making in baseball — and business.','c1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000027','https://covers.openlibrary.org/b/id/8406948-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000067','Thinking, Fast and Slow','978-0374533557','Farrar, Straus and Giroux',2011','Kahneman on cognitive bias and decision-making.','c1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000026','https://covers.openlibrary.org/b/id/8406947-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000068','Zero to One','978-0804139021','Crown Business',2014','Thiel on building startups that create something new.','c1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000027','https://covers.openlibrary.org/b/id/8406946-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000069','The Lean Startup','978-0307887894','Crown Business',2011','Ries on validated learning and iterative product development.','c1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000028','https://covers.openlibrary.org/b/id/8406945-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000070','Good to Great','978-0066620992','HarperBusiness',2001','Collins on what separates great companies from merely good ones.','c1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000021','https://covers.openlibrary.org/b/id/8406944-L.jpg',NULL),

-- General Non-Fiction (10 books)
('b1000000-0000-0000-0000-000000000071','Sapiens: A Brief History of Humankind','978-0062316097','Harper',2015','Harari''s sweeping history of the human species.','c1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000025','https://covers.openlibrary.org/b/id/8406943-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000072','Homo Deus: A Brief History of Tomorrow','978-0062464316','Harper',2017','Harari on humanity''s future.','c1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000025','https://covers.openlibrary.org/b/id/8406942-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000073','The Black Swan','978-0812973815','Random House',2010','Taleb on improbable, high-impact events.','c1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000026','https://covers.openlibrary.org/b/id/8406941-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000074','Antifragile','978-0812979688','Random House',2012','Taleb on systems that gain from disorder.','c1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000026','https://covers.openlibrary.org/b/id/8406940-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000075','Deep Work','978-1455586691','Grand Central',2016','Newport on the value of focused, distraction-free work.','c1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000028','https://covers.openlibrary.org/b/id/8406939-L.jpg','d1000000-0000-0000-0000-000000000005'),
('b1000000-0000-0000-0000-000000000076','Digital Minimalism','978-0525536512','Portfolio',2019','Newport on intentional technology use.','c1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000028','https://covers.openlibrary.org/b/id/8406938-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000077','21 Lessons for the 21st Century','978-0525512172','Spiegel & Grau',2018','Harari on contemporary challenges and the near future.','c1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000025','https://covers.openlibrary.org/b/id/8406937-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000078','The Big Short','978-0393338829','W.W. Norton',2010','Lewis on the 2008 financial crisis.','c1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000027','https://covers.openlibrary.org/b/id/8406936-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000079','Outliers','978-0316017930','Little, Brown',2008','Gladwell on the hidden factors behind success.','c1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000028','https://covers.openlibrary.org/b/id/8406935-L.jpg',NULL),
('b1000000-0000-0000-0000-000000000080','The Innovator''s Dilemma','978-0062060242','HarperBusiness',2011','Christensen on disruptive innovation.','c1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000027','https://covers.openlibrary.org/b/id/8406934-L.jpg',NULL);

-- ── Users (librarians + students) ─────────────────────────────────────────────
-- Passwords: Admin@123 → $2b$12$... (pre-hashed with bcrypt 12 rounds)
-- Students:  Student@123 → same format
-- NOTE: In production, never use these known passwords. Rotate immediately.

INSERT INTO users (user_id, name, email, password_hash, role, phone, notify_email, notify_web_push) VALUES
-- Librarians
('u1000000-0000-0000-0000-000000000001','Dr. Ananya Sharma','head@booksphere.edu','$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMUMked.X9XU7qF9v/3YZLp1Hm','HEAD_LIBRARIAN','9876543210',TRUE,FALSE),
('u1000000-0000-0000-0000-000000000002','Rajan Mehta','assistant@booksphere.edu','$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMUMked.X9XU7qF9v/3YZLp1Hm','ASSISTANT_LIBRARIAN','9876543211',TRUE,FALSE),
('u1000000-0000-0000-0000-000000000003','Priya Nair','assistant2@booksphere.edu','$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMUMked.X9XU7qF9v/3YZLp1Hm','ASSISTANT_LIBRARIAN','9876543212',TRUE,FALSE),
('u1000000-0000-0000-0000-000000000004','Vikram Joshi','head2@booksphere.edu','$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMUMked.X9XU7qF9v/3YZLp1Hm','HEAD_LIBRARIAN','9876543213',TRUE,TRUE),
-- Students
('u1000000-0000-0000-0000-000000000005','Arjun Kapoor','student@booksphere.edu','$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC//C7H5/SXHVlRQE0HW','STUDENT','9000000001',TRUE,TRUE),
('u1000000-0000-0000-0000-000000000006','Sneha Patel','sneha.patel@student.edu','$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC//C7H5/SXHVlRQE0HW','STUDENT','9000000002',TRUE,FALSE),
('u1000000-0000-0000-0000-000000000007','Rohan Singh','rohan.singh@student.edu','$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC//C7H5/SXHVlRQE0HW','STUDENT','9000000003',FALSE,TRUE),
('u1000000-0000-0000-0000-000000000008','Pooja Verma','pooja.verma@student.edu','$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC//C7H5/SXHVlRQE0HW','STUDENT','9000000004',TRUE,TRUE),
('u1000000-0000-0000-0000-000000000009','Karan Malhotra','karan.malhotra@student.edu','$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC//C7H5/SXHVlRQE0HW','STUDENT','9000000005',TRUE,FALSE),
('u1000000-0000-0000-0000-000000000010','Neha Reddy','neha.reddy@student.edu','$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC//C7H5/SXHVlRQE0HW','STUDENT','9000000006',TRUE,TRUE),
('u1000000-0000-0000-0000-000000000011','Amit Kumar','amit.kumar@student.edu','$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC//C7H5/SXHVlRQE0HW','STUDENT','9000000007',TRUE,FALSE),
('u1000000-0000-0000-0000-000000000012','Divya Krishnan','divya.krishnan@student.edu','$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC//C7H5/SXHVlRQE0HW','STUDENT','9000000008',FALSE,FALSE),
('u1000000-0000-0000-0000-000000000013','Rahul Gupta','rahul.gupta@student.edu','$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC//C7H5/SXHVlRQE0HW','STUDENT','9000000009',TRUE,TRUE),
('u1000000-0000-0000-0000-000000000014','Anjali Mishra','anjali.mishra@student.edu','$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC//C7H5/SXHVlRQE0HW','STUDENT','9000000010',TRUE,FALSE),
('u1000000-0000-0000-0000-000000000015','Deepak Yadav','deepak.yadav@student.edu','$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC//C7H5/SXHVlRQE0HW','STUDENT','9000000011',TRUE,TRUE),
('u1000000-0000-0000-0000-000000000016','Meera Iyer','meera.iyer@student.edu','$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC//C7H5/SXHVlRQE0HW','STUDENT','9000000012',FALSE,TRUE),
('u1000000-0000-0000-0000-000000000017','Suresh Pillai','suresh.pillai@student.edu','$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC//C7H5/SXHVlRQE0HW','STUDENT','9000000013',TRUE,FALSE),
('u1000000-0000-0000-0000-000000000018','Kavya Nair','kavya.nair@student.edu','$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC//C7H5/SXHVlRQE0HW','STUDENT','9000000014',TRUE,TRUE),
('u1000000-0000-0000-0000-000000000019','Sanjay Bhat','sanjay.bhat@student.edu','$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC//C7H5/SXHVlRQE0HW','STUDENT','9000000015',TRUE,FALSE),
('u1000000-0000-0000-0000-000000000020','Priyanka Das','priyanka.das@student.edu','$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC//C7H5/SXHVlRQE0HW','STUDENT','9000000016',TRUE,TRUE),
('u1000000-0000-0000-0000-000000000021','Aditya Jain','aditya.jain@student.edu','$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC//C7H5/SXHVlRQE0HW','STUDENT','9000000017',FALSE,FALSE),
('u1000000-0000-0000-0000-000000000022','Lakshmi Menon','lakshmi.menon@student.edu','$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC//C7H5/SXHVlRQE0HW','STUDENT','9000000018',TRUE,TRUE),
('u1000000-0000-0000-0000-000000000023','Vivek Sharma','vivek.sharma@student.edu','$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC//C7H5/SXHVlRQE0HW','STUDENT','9000000019',TRUE,FALSE),
('u1000000-0000-0000-0000-000000000024','Riya Agarwal','riya.agarwal@student.edu','$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC//C7H5/SXHVlRQE0HW','STUDENT','9000000020',TRUE,TRUE),
('u1000000-0000-0000-0000-000000000025','Harsh Patel','harsh.patel@student.edu','$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC//C7H5/SXHVlRQE0HW','STUDENT','9000000021',TRUE,FALSE),
('u1000000-0000-0000-0000-000000000026','Ishita Roy','ishita.roy@student.edu','$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC//C7H5/SXHVlRQE0HW','STUDENT','9000000022',TRUE,TRUE),
('u1000000-0000-0000-0000-000000000027','Manish Tiwari','manish.tiwari@student.edu','$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC//C7H5/SXHVlRQE0HW','STUDENT','9000000023',FALSE,TRUE),
('u1000000-0000-0000-0000-000000000028','Shruti Pandey','shruti.pandey@student.edu','$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC//C7H5/SXHVlRQE0HW','STUDENT','9000000024',TRUE,FALSE),
('u1000000-0000-0000-0000-000000000029','Nikhil Desai','nikhil.desai@student.edu','$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC//C7H5/SXHVlRQE0HW','STUDENT','9000000025',TRUE,TRUE);

-- ── Librarians ───────────────────────────────────────────────────────────────

INSERT INTO librarians (librarian_id, user_id, staff_id, designation) VALUES
('l1000000-0000-0000-0000-000000000001','u1000000-0000-0000-0000-000000000001','STAFF-001','HEAD_LIBRARIAN'),
('l1000000-0000-0000-0000-000000000002','u1000000-0000-0000-0000-000000000002','STAFF-002','ASSISTANT_LIBRARIAN'),
('l1000000-0000-0000-0000-000000000003','u1000000-0000-0000-0000-000000000003','STAFF-003','ASSISTANT_LIBRARIAN'),
('l1000000-0000-0000-0000-000000000004','u1000000-0000-0000-0000-000000000004','STAFF-004','HEAD_LIBRARIAN');

-- ── Students ─────────────────────────────────────────────────────────────────

INSERT INTO students (student_id, user_id, enrollment_no, department, course, year, semester) VALUES
('s1000000-0000-0000-0000-000000000001','u1000000-0000-0000-0000-000000000005','EN2021CS001','Computer Science','B.Tech CSE',4,7),
('s1000000-0000-0000-0000-000000000002','u1000000-0000-0000-0000-000000000006','EN2022EC001','Electronics','B.Tech ECE',3,5),
('s1000000-0000-0000-0000-000000000003','u1000000-0000-0000-0000-000000000007','EN2023ME001','Mechanical','B.Tech ME',2,3),
('s1000000-0000-0000-0000-000000000004','u1000000-0000-0000-0000-000000000008','EN2021CS002','Computer Science','B.Tech CSE',4,7),
('s1000000-0000-0000-0000-000000000005','u1000000-0000-0000-0000-000000000009','EN2022CS001','Computer Science','B.Tech CSE',3,5),
('s1000000-0000-0000-0000-000000000006','u1000000-0000-0000-0000-000000000010','EN2023CS001','Computer Science','B.Tech CSE',2,3),
('s1000000-0000-0000-0000-000000000007','u1000000-0000-0000-0000-000000000011','EN2021MBA001','Management','MBA',2,3),
('s1000000-0000-0000-0000-000000000008','u1000000-0000-0000-0000-000000000012','EN2022MBA001','Management','MBA',1,2),
('s1000000-0000-0000-0000-000000000009','u1000000-0000-0000-0000-000000000013','EN2021CS003','Computer Science','B.Tech CSE',4,7),
('s1000000-0000-0000-0000-000000000010','u1000000-0000-0000-0000-000000000014','EN2022EC002','Electronics','B.Tech ECE',3,5),
('s1000000-0000-0000-0000-000000000011','u1000000-0000-0000-0000-000000000015','EN2021ME001','Mechanical','B.Tech ME',4,7),
('s1000000-0000-0000-0000-000000000012','u1000000-0000-0000-0000-000000000016','EN2023CS002','Computer Science','B.Tech CSE',2,3),
('s1000000-0000-0000-0000-000000000013','u1000000-0000-0000-0000-000000000017','EN2022CS002','Computer Science','B.Tech CSE',3,5),
('s1000000-0000-0000-0000-000000000014','u1000000-0000-0000-0000-000000000018','EN2021EC001','Electronics','B.Tech ECE',4,7),
('s1000000-0000-0000-0000-000000000015','u1000000-0000-0000-0000-000000000019','EN2023MBA001','Management','MBA',1,1),
('s1000000-0000-0000-0000-000000000016','u1000000-0000-0000-0000-000000000020','EN2021CS004','Computer Science','M.Tech CSE',1,2),
('s1000000-0000-0000-0000-000000000017','u1000000-0000-0000-0000-000000000021','EN2022ME001','Mechanical','B.Tech ME',3,5),
('s1000000-0000-0000-0000-000000000018','u1000000-0000-0000-0000-000000000022','EN2022CS003','Computer Science','B.Tech CSE',3,5),
('s1000000-0000-0000-0000-000000000019','u1000000-0000-0000-0000-000000000023','EN2021EC002','Electronics','B.Tech ECE',4,7),
('s1000000-0000-0000-0000-000000000020','u1000000-0000-0000-0000-000000000024','EN2023EC001','Electronics','B.Tech ECE',2,3),
('s1000000-0000-0000-0000-000000000021','u1000000-0000-0000-0000-000000000025','EN2021CS005','Computer Science','B.Tech CSE',4,7),
('s1000000-0000-0000-0000-000000000022','u1000000-0000-0000-0000-000000000026','EN2022CS004','Computer Science','B.Tech CSE',3,5),
('s1000000-0000-0000-0000-000000000023','u1000000-0000-0000-0000-000000000027','EN2023CS003','Computer Science','B.Tech CSE',2,3),
('s1000000-0000-0000-0000-000000000024','u1000000-0000-0000-0000-000000000028','EN2021MBA002','Management','MBA',2,4),
('s1000000-0000-0000-0000-000000000025','u1000000-0000-0000-0000-000000000029','EN2022EC003','Electronics','B.Tech ECE',3,5);

-- ── Book Copies (2-4 copies per key book) ────────────────────────────────────

INSERT INTO book_copies (copy_id, book_id, accession_number, status, shelf_block, shelf_rack, shelf_shelf, qr_code_value) VALUES
-- Database System Concepts (3 copies)
('cp100000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000001','ACC-CS-0001','AVAILABLE','A','R1','S1','QR-ACC-CS-0001'),
('cp100000-0000-0000-0000-000000000002','b1000000-0000-0000-0000-000000000001','ACC-CS-0002','ISSUED','A','R1','S1','QR-ACC-CS-0002'),
('cp100000-0000-0000-0000-000000000003','b1000000-0000-0000-0000-000000000001','ACC-CS-0003','AVAILABLE','A','R1','S1','QR-ACC-CS-0003'),
-- Operating System Concepts (3 copies)
('cp100000-0000-0000-0000-000000000004','b1000000-0000-0000-0000-000000000002','ACC-CS-0004','AVAILABLE','A','R1','S2','QR-ACC-CS-0004'),
('cp100000-0000-0000-0000-000000000005','b1000000-0000-0000-0000-000000000002','ACC-CS-0005','ISSUED','A','R1','S2','QR-ACC-CS-0005'),
('cp100000-0000-0000-0000-000000000006','b1000000-0000-0000-0000-000000000002','ACC-CS-0006','OVERDUE','A','R1','S2','QR-ACC-CS-0006'),
-- The C Programming Language (2 copies)
('cp100000-0000-0000-0000-000000000007','b1000000-0000-0000-0000-000000000003','ACC-CS-0007','AVAILABLE','A','R2','S1','QR-ACC-CS-0007'),
('cp100000-0000-0000-0000-000000000008','b1000000-0000-0000-0000-000000000003','ACC-CS-0008','AVAILABLE','A','R2','S1','QR-ACC-CS-0008'),
-- Java Complete Reference (2 copies)
('cp100000-0000-0000-0000-000000000009','b1000000-0000-0000-0000-000000000004','ACC-CS-0009','ISSUED','A','R2','S2','QR-ACC-CS-0009'),
('cp100000-0000-0000-0000-000000000010','b1000000-0000-0000-0000-000000000004','ACC-CS-0010','AVAILABLE','A','R2','S2','QR-ACC-CS-0010'),
-- Introduction to Algorithms CLRS (4 copies - high demand)
('cp100000-0000-0000-0000-000000000011','b1000000-0000-0000-0000-000000000005','ACC-CS-0011','ISSUED','A','R3','S1','QR-ACC-CS-0011'),
('cp100000-0000-0000-0000-000000000012','b1000000-0000-0000-0000-000000000005','ACC-CS-0012','ISSUED','A','R3','S1','QR-ACC-CS-0012'),
('cp100000-0000-0000-0000-000000000013','b1000000-0000-0000-0000-000000000005','ACC-CS-0013','ISSUED','A','R3','S1','QR-ACC-CS-0013'),
('cp100000-0000-0000-0000-000000000014','b1000000-0000-0000-0000-000000000005','ACC-CS-0014','RESERVED','A','R3','S1','QR-ACC-CS-0014'),
-- Algorithms Sedgewick (2 copies)
('cp100000-0000-0000-0000-000000000015','b1000000-0000-0000-0000-000000000006','ACC-CS-0015','AVAILABLE','A','R3','S2','QR-ACC-CS-0015'),
('cp100000-0000-0000-0000-000000000016','b1000000-0000-0000-0000-000000000006','ACC-CS-0016','ISSUED','A','R3','S2','QR-ACC-CS-0016'),
-- AI Modern Approach (3 copies)
('cp100000-0000-0000-0000-000000000017','b1000000-0000-0000-0000-000000000008','ACC-CS-0017','AVAILABLE','A','R4','S1','QR-ACC-CS-0017'),
('cp100000-0000-0000-0000-000000000018','b1000000-0000-0000-0000-000000000008','ACC-CS-0018','ISSUED','A','R4','S1','QR-ACC-CS-0018'),
('cp100000-0000-0000-0000-000000000019','b1000000-0000-0000-0000-000000000008','ACC-CS-0019','AVAILABLE','A','R4','S1','QR-ACC-CS-0019'),
-- Clean Code (2 copies)
('cp100000-0000-0000-0000-000000000020','b1000000-0000-0000-0000-000000000010','ACC-CS-0020','AVAILABLE','A','R5','S1','QR-ACC-CS-0020'),
('cp100000-0000-0000-0000-000000000021','b1000000-0000-0000-0000-000000000010','ACC-CS-0021','DAMAGED','A','R5','S1','QR-ACC-CS-0021'),
-- Design Patterns GoF (2 copies)
('cp100000-0000-0000-0000-000000000022','b1000000-0000-0000-0000-000000000009','ACC-CS-0022','AVAILABLE','A','R4','S2','QR-ACC-CS-0022'),
('cp100000-0000-0000-0000-000000000023','b1000000-0000-0000-0000-000000000009','ACC-CS-0023','ISSUED','A','R4','S2','QR-ACC-CS-0023'),
-- Deep Work (2 copies - e-book fallback demo)
('cp100000-0000-0000-0000-000000000024','b1000000-0000-0000-0000-000000000075','ACC-GN-0024','ISSUED','C','R1','S1','QR-ACC-GN-0024'),
('cp100000-0000-0000-0000-000000000025','b1000000-0000-0000-0000-000000000075','ACC-GN-0025','ISSUED','C','R1','S1','QR-ACC-GN-0025'),
-- Sapiens (2 copies)
('cp100000-0000-0000-0000-000000000026','b1000000-0000-0000-0000-000000000071','ACC-GN-0026','AVAILABLE','C','R1','S2','QR-ACC-GN-0026'),
('cp100000-0000-0000-0000-000000000027','b1000000-0000-0000-0000-000000000071','ACC-GN-0027','AVAILABLE','C','R1','S2','QR-ACC-GN-0027'),
-- Computer Networks Tanenbaum (2 copies)
('cp100000-0000-0000-0000-000000000028','b1000000-0000-0000-0000-000000000007','ACC-CS-0028','AVAILABLE','A','R2','S3','QR-ACC-CS-0028'),
('cp100000-0000-0000-0000-000000000029','b1000000-0000-0000-0000-000000000007','ACC-CS-0029','ISSUED','A','R2','S3','QR-ACC-CS-0029'),
-- Discrete Mathematics (2 copies)
('cp100000-0000-0000-0000-000000000030','b1000000-0000-0000-0000-000000000028','ACC-MA-0030','AVAILABLE','B','R1','S1','QR-ACC-MA-0030'),
('cp100000-0000-0000-0000-000000000031','b1000000-0000-0000-0000-000000000028','ACC-MA-0031','AVAILABLE','B','R1','S1','QR-ACC-MA-0031');

-- ── Issues (realistic mix of current, returned, overdue) ──────────────────────

INSERT INTO issues (issue_id, copy_id, student_id, issue_date, due_date, return_date, status, issued_by, returned_to) VALUES
-- Currently issued (due in various days)
('i1000000-0000-0000-0000-000000000001','cp100000-0000-0000-0000-000000000002','s1000000-0000-0000-0000-000000000001',CURRENT_DATE - 5,CURRENT_DATE + 10,NULL,'ISSUED','u1000000-0000-0000-0000-000000000002',NULL),
('i1000000-0000-0000-0000-000000000002','cp100000-0000-0000-0000-000000000005','s1000000-0000-0000-0000-000000000004',CURRENT_DATE - 10,CURRENT_DATE + 5,NULL,'ISSUED','u1000000-0000-0000-0000-000000000002',NULL),
('i1000000-0000-0000-0000-000000000003','cp100000-0000-0000-0000-000000000009','s1000000-0000-0000-0000-000000000002',CURRENT_DATE - 12,CURRENT_DATE + 3,NULL,'ISSUED','u1000000-0000-0000-0000-000000000003',NULL),
('i1000000-0000-0000-0000-000000000004','cp100000-0000-0000-0000-000000000011','s1000000-0000-0000-0000-000000000009',CURRENT_DATE - 14,CURRENT_DATE + 1,NULL,'ISSUED','u1000000-0000-0000-0000-000000000002',NULL),
('i1000000-0000-0000-0000-000000000005','cp100000-0000-0000-0000-000000000012','s1000000-0000-0000-0000-000000000013',CURRENT_DATE - 3,CURRENT_DATE + 12,NULL,'ISSUED','u1000000-0000-0000-0000-000000000003',NULL),
('i1000000-0000-0000-0000-000000000006','cp100000-0000-0000-0000-000000000013','s1000000-0000-0000-0000-000000000018',CURRENT_DATE - 1,CURRENT_DATE + 14,NULL,'ISSUED','u1000000-0000-0000-0000-000000000002',NULL),
('i1000000-0000-0000-0000-000000000007','cp100000-0000-0000-0000-000000000016','s1000000-0000-0000-0000-000000000005',CURRENT_DATE - 7,CURRENT_DATE + 8,NULL,'ISSUED','u1000000-0000-0000-0000-000000000003',NULL),
('i1000000-0000-0000-0000-000000000008','cp100000-0000-0000-0000-000000000018','s1000000-0000-0000-0000-000000000010',CURRENT_DATE - 8,CURRENT_DATE + 7,NULL,'ISSUED','u1000000-0000-0000-0000-000000000002',NULL),
('i1000000-0000-0000-0000-000000000009','cp100000-0000-0000-0000-000000000023','s1000000-0000-0000-0000-000000000021',CURRENT_DATE - 2,CURRENT_DATE + 13,NULL,'ISSUED','u1000000-0000-0000-0000-000000000003',NULL),
-- Deep Work copies - both out (e-book fallback demo)
('i1000000-0000-0000-0000-000000000010','cp100000-0000-0000-0000-000000000024','s1000000-0000-0000-0000-000000000016',CURRENT_DATE - 6,CURRENT_DATE + 9,NULL,'ISSUED','u1000000-0000-0000-0000-000000000002',NULL),
('i1000000-0000-0000-0000-000000000011','cp100000-0000-0000-0000-000000000025','s1000000-0000-0000-0000-000000000007',CURRENT_DATE - 4,CURRENT_DATE + 11,NULL,'ISSUED','u1000000-0000-0000-0000-000000000003',NULL),
-- Overdue issues
('i1000000-0000-0000-0000-000000000012','cp100000-0000-0000-0000-000000000006','s1000000-0000-0000-0000-000000000003',CURRENT_DATE - 25,CURRENT_DATE - 10,NULL,'OVERDUE','u1000000-0000-0000-0000-000000000002',NULL),
('i1000000-0000-0000-0000-000000000013','cp100000-0000-0000-0000-000000000029','s1000000-0000-0000-0000-000000000022',CURRENT_DATE - 20,CURRENT_DATE - 5,NULL,'OVERDUE','u1000000-0000-0000-0000-000000000003',NULL),
-- Returned issues (history)
('i1000000-0000-0000-0000-000000000014','cp100000-0000-0000-0000-000000000007','s1000000-0000-0000-0000-000000000001',CURRENT_DATE - 60,CURRENT_DATE - 45,CURRENT_DATE - 48,'RETURNED','u1000000-0000-0000-0000-000000000002','u1000000-0000-0000-0000-000000000003'),
('i1000000-0000-0000-0000-000000000015','cp100000-0000-0000-0000-000000000020','s1000000-0000-0000-0000-000000000004',CURRENT_DATE - 45,CURRENT_DATE - 30,CURRENT_DATE - 32,'RETURNED','u1000000-0000-0000-0000-000000000003','u1000000-0000-0000-0000-000000000002'),
('i1000000-0000-0000-0000-000000000016','cp100000-0000-0000-0000-000000000022','s1000000-0000-0000-0000-000000000009',CURRENT_DATE - 30,CURRENT_DATE - 15,CURRENT_DATE - 14,'RETURNED','u1000000-0000-0000-0000-000000000002','u1000000-0000-0000-0000-000000000002'),
('i1000000-0000-0000-0000-000000000017','cp100000-0000-0000-0000-000000000028','s1000000-0000-0000-0000-000000000006',CURRENT_DATE - 50,CURRENT_DATE - 35,CURRENT_DATE - 33,'RETURNED','u1000000-0000-0000-0000-000000000003','u1000000-0000-0000-0000-000000000003');

-- ── Fines ─────────────────────────────────────────────────────────────────────

INSERT INTO fines (fine_id, issue_id, student_id, amount, reason, paid, created_at, paid_at) VALUES
-- Overdue fine for student 3 (s003): 10 days overdue × Rs. 2 = Rs. 20
('f1000000-0000-0000-0000-000000000001','i1000000-0000-0000-0000-000000000012','s1000000-0000-0000-0000-000000000003',20.00,'OVERDUE',FALSE,NOW(),NULL),
-- Overdue fine for student 22 (s022): 5 days × Rs. 2 = Rs. 10
('f1000000-0000-0000-0000-000000000002','i1000000-0000-0000-0000-000000000013','s1000000-0000-0000-0000-000000000022',10.00,'OVERDUE',FALSE,NOW(),NULL),
-- Paid fine from history (student 001, returned 3 days early — no fine; this is a damage fine example)
('f1000000-0000-0000-0000-000000000003','i1000000-0000-0000-0000-000000000016','s1000000-0000-0000-0000-000000000009',50.00,'DAMAGE',TRUE,NOW() - INTERVAL '12 days',NOW() - INTERVAL '10 days');

-- ── Book Reservations (waitlists) ─────────────────────────────────────────────

INSERT INTO book_reservations (reservation_id, book_id, student_id, reservation_date, status, queue_position) VALUES
-- CLRS (Introduction to Algorithms) waitlist — 3 copies all issued
('r1000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000005','s1000000-0000-0000-0000-000000000006',NOW() - INTERVAL '3 days','WAITING',1),
('r1000000-0000-0000-0000-000000000002','b1000000-0000-0000-0000-000000000005','s1000000-0000-0000-0000-000000000012',NOW() - INTERVAL '1 day','WAITING',2),
('r1000000-0000-0000-0000-000000000003','b1000000-0000-0000-0000-000000000005','s1000000-0000-0000-0000-000000000015',NOW(),'WAITING',3),
-- Deep Work waitlist (both copies issued — e-book fallback demo)
('r1000000-0000-0000-0000-000000000004','b1000000-0000-0000-0000-000000000075','s1000000-0000-0000-0000-000000000020',NOW() - INTERVAL '2 days','WAITING',1);

-- ── Seats ─────────────────────────────────────────────────────────────────────

INSERT INTO seats (seat_id, seat_label, zone, is_active) VALUES
('se100000-0000-0000-0000-000000000001','A-01','Quiet Zone',TRUE),
('se100000-0000-0000-0000-000000000002','A-02','Quiet Zone',TRUE),
('se100000-0000-0000-0000-000000000003','A-03','Quiet Zone',TRUE),
('se100000-0000-0000-0000-000000000004','A-04','Quiet Zone',TRUE),
('se100000-0000-0000-0000-000000000005','A-05','Quiet Zone',TRUE),
('se100000-0000-0000-0000-000000000006','B-01','Group Study',TRUE),
('se100000-0000-0000-0000-000000000007','B-02','Group Study',TRUE),
('se100000-0000-0000-0000-000000000008','B-03','Group Study',TRUE),
('se100000-0000-0000-0000-000000000009','B-04','Group Study',TRUE),
('se100000-0000-0000-0000-000000000010','B-05','Group Study',TRUE),
('se100000-0000-0000-0000-000000000011','C-01','Computer Lab',TRUE),
('se100000-0000-0000-0000-000000000012','C-02','Computer Lab',TRUE),
('se100000-0000-0000-0000-000000000013','C-03','Computer Lab',TRUE),
('se100000-0000-0000-0000-000000000014','D-01','Reading Hall',TRUE),
('se100000-0000-0000-0000-000000000015','D-02','Reading Hall',TRUE),
('se100000-0000-0000-0000-000000000016','D-03','Reading Hall',TRUE),
('se100000-0000-0000-0000-000000000017','D-04','Reading Hall',TRUE),
('se100000-0000-0000-0000-000000000018','D-05','Reading Hall',TRUE),
('se100000-0000-0000-0000-000000000019','D-06','Reading Hall',TRUE),
('se100000-0000-0000-0000-000000000020','D-07','Reading Hall',TRUE);

-- ── Notifications ─────────────────────────────────────────────────────────────

INSERT INTO notifications (notification_id, user_id, title, message, type, channel, is_read) VALUES
('n1000000-0000-0000-0000-000000000001','u1000000-0000-0000-0000-000000000005','Book Due in 1 Day','Your copy of "Introduction to Algorithms" is due tomorrow. Please return or renew.','DUE_REMINDER','IN_APP',FALSE),
('n1000000-0000-0000-0000-000000000002','u1000000-0000-0000-0000-000000000008','Book Due in 5 Days','Your copy of "Operating System Concepts" is due in 5 days.','DUE_REMINDER','IN_APP',TRUE),
('n1000000-0000-0000-0000-000000000003','u1000000-0000-0000-0000-000000000007','Book Overdue — Fine Accumulating','Your copy of "Operating System Concepts" is 10 days overdue. Current fine: Rs. 20.00.','OVERDUE','IN_APP',FALSE),
('n1000000-0000-0000-0000-000000000004','u1000000-0000-0000-0000-000000000006','Reservation Ready','A copy of "Introduction to Algorithms" is now available for you! Reserved until 48 hours from now.','RESERVATION','IN_APP',FALSE),
('n1000000-0000-0000-0000-000000000005','u1000000-0000-0000-0000-000000000005','Purchase Request Approved','Your purchase request for "Clean Architecture" has been approved. It will be added to the library catalogue soon.','PURCHASE_REQUEST','IN_APP',TRUE);

-- ── Purchase Requests ─────────────────────────────────────────────────────────

INSERT INTO purchase_requests (request_id, student_id, title, author, reason, status, librarian_notes, reviewed_by, created_at, reviewed_at) VALUES
('pr100000-0000-0000-0000-000000000001','s1000000-0000-0000-0000-000000000001','Clean Architecture','Robert C. Martin','Required for my final year project on software design patterns. Currently only 1 copy in library.','APPROVED','Good request — ordering 2 copies.','u1000000-0000-0000-0000-000000000001',NOW() - INTERVAL '15 days',NOW() - INTERVAL '10 days'),
('pr100000-0000-0000-0000-000000000002','s1000000-0000-0000-0000-000000000004','Designing Data-Intensive Applications','Martin Kleppmann','Essential for distributed systems coursework. Not in library at all.','PENDING',NULL,NULL,NOW() - INTERVAL '3 days',NULL),
('pr100000-0000-0000-0000-000000000003','s1000000-0000-0000-0000-000000000009','The Rust Programming Language','Steve Klabnik','Want to learn systems programming. Very popular in industry now.','REJECTED','Currently outside our budget cycle. Will revisit next semester.','u1000000-0000-0000-0000-000000000001',NOW() - INTERVAL '30 days',NOW() - INTERVAL '25 days');

-- ── Demand Forecasts (initial AI cache) ───────────────────────────────────────

INSERT INTO demand_forecasts (forecast_id, book_id, predicted_demand_score, priority, reasoning, generated_at) VALUES
('df100000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000005',0.95,'HIGH','All 3 physical copies issued; 3 students on waitlist; 47 issues in last 90 days. Strongly recommended to purchase 2 more copies.',NOW() - INTERVAL '1 day'),
('df100000-0000-0000-0000-000000000002','b1000000-0000-0000-0000-000000000001',0.72,'HIGH','All issued copies in circulation; consistent borrowing across departments. Consider 1 additional copy.',NOW() - INTERVAL '1 day'),
('df100000-0000-0000-0000-000000000003','b1000000-0000-0000-0000-000000000002',0.68,'HIGH','One copy overdue; high borrow rate among CS students. Consider replacing overdue copy.',NOW() - INTERVAL '1 day'),
('df100000-0000-0000-0000-000000000004','b1000000-0000-0000-0000-000000000075',0.65,'HIGH','Both physical copies issued; 1 student on waitlist; e-book accessed 67 times.',NOW() - INTERVAL '1 day'),
('df100000-0000-0000-0000-000000000005','b1000000-0000-0000-0000-000000000008',0.55,'MEDIUM','1 of 3 copies issued. Steady borrowing rate. Current stock adequate.',NOW() - INTERVAL '1 day'),
('df100000-0000-0000-0000-000000000006','b1000000-0000-0000-0000-000000000010',0.48,'MEDIUM','1 copy damaged; 1 available. Moderate demand. May need replacement copy.',NOW() - INTERVAL '1 day'),
('df100000-0000-0000-0000-000000000007','b1000000-0000-0000-0000-000000000071',0.30,'LOW','Both copies available; low borrow rate. Current stock sufficient.',NOW() - INTERVAL '1 day'),
('df100000-0000-0000-0000-000000000008','b1000000-0000-0000-0000-000000000043',0.12,'LOW','No recent issues. Low student interest.',NOW() - INTERVAL '1 day');

COMMIT;

-- ── Verify seed ───────────────────────────────────────────────────────────────
SELECT 'users' AS table_name, COUNT(*) AS row_count FROM users
UNION ALL SELECT 'students', COUNT(*) FROM students
UNION ALL SELECT 'librarians', COUNT(*) FROM librarians
UNION ALL SELECT 'books', COUNT(*) FROM books
UNION ALL SELECT 'book_copies', COUNT(*) FROM book_copies
UNION ALL SELECT 'issues', COUNT(*) FROM issues
UNION ALL SELECT 'fines', COUNT(*) FROM fines
UNION ALL SELECT 'book_reservations', COUNT(*) FROM book_reservations
UNION ALL SELECT 'demand_forecasts', COUNT(*) FROM demand_forecasts
UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
ORDER BY table_name;
