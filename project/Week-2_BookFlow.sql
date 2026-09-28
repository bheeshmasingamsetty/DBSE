-- =========================================================
-- WEEK 2 - BOOKFLOW
-- =========================================================

-- Step 1: Select Database
USE bookflow_db;


-- =========================================================
-- Step 8: Create Loans Table
-- =========================================================

CREATE TABLE IF NOT EXISTS Loans (
    loan_id INT PRIMARY KEY,
    member_id INT,
    book_id INT,
    loan_date DATE,
    FOREIGN KEY (member_id) REFERENCES Members(member_id),
    FOREIGN KEY (book_id) REFERENCES Books(book_id)
);


-- =========================================================
-- Step 9 & 10: Insert 10 Loans and Display
-- Member IDs are 1, 2, 3 in your existing database
-- =========================================================

INSERT INTO Loans (loan_id, member_id, book_id, loan_date) VALUES
(1, 1, 1, '2025-01-05'),
(2, 2, 2, '2025-01-08'),
(3, 3, 3, '2025-01-10'),
(4, 1, 2, '2025-02-01'),
(5, 2, 1, '2025-02-05'),
(6, 3, 2, '2025-02-12'),
(7, 1, 3, '2025-03-01'),
(8, 2, 3, '2025-03-07'),
(9, 3, 1, '2025-03-15'),
(10, 1, 1, '2025-04-01');

SELECT * FROM Loans;


-- =========================================================
-- Step 11: JOIN Query
-- =========================================================

SELECT
    m.full_name AS Member_Name,
    b.title AS Book_Title
FROM Loans l
INNER JOIN Members m
    ON l.member_id = m.member_id
INNER JOIN Books b
    ON l.book_id = b.book_id;


-- =========================================================
-- Step 12: GROUP BY Query
-- =========================================================

SELECT
    published_year,
    COUNT(book_id) AS Total_Books
FROM Books
GROUP BY published_year
ORDER BY published_year;


-- =========================================================
-- Step 13: Create Donation_History Table
-- =========================================================

CREATE TABLE IF NOT EXISTS Donation_History (
    donation_id INT PRIMARY KEY,
    book_id INT,
    donor_name VARCHAR(100),
    donation_date DATE,
    FOREIGN KEY (book_id) REFERENCES Books(book_id)
);


-- =========================================================
-- Step 14-16: Donation Transaction
-- =========================================================

START TRANSACTION;

INSERT INTO Books (
    book_id,
    title,
    isbn,
    published_year
)
VALUES (
    4,
    'Animal Farm',
    '9780451526342',
    1945
);

INSERT INTO Donation_History (
    donation_id,
    book_id,
    donor_name,
    donation_date
)
VALUES (
    1,
    4,
    'Raj Kumar',
    CURDATE()
);

COMMIT;


-- =========================================================
-- Display Donation History
-- =========================================================

SELECT * FROM Donation_History;


-- =========================================================
-- Display Books after Donation
-- =========================================================

SELECT * FROM Books;


-- =========================================================
-- Step 17: Create Index on ISBN
-- =========================================================

CREATE INDEX idx_books_isbn
ON Books(isbn);


-- =========================================================
-- Step 18: Search Book using ISBN
-- =========================================================

SELECT *
FROM Books
WHERE isbn = '9780451526342';