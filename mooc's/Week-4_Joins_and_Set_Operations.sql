-- =========================================================
-- WEEK 4 - JOINS AND SET OPERATIONS
-- =========================================================

-- STEP 1: DATABASE
CREATE DATABASE IF NOT EXISTS joins_db;
USE joins_db;


-- =========================================================
-- PART 1: CROSS JOIN
-- =========================================================

CREATE TABLE class (
    id INT,
    name VARCHAR(30)
);

CREATE TABLE class_info (
    id INT,
    address VARCHAR(30)
);

INSERT INTO class VALUES
(1,'abhi'),
(2,'adam'),
(4,'alex');

INSERT INTO class_info VALUES
(1,'DELHI'),
(2,'MUMBAI'),
(3,'CHENNAI');

-- Q1 CROSS JOIN
SELECT *
FROM class
CROSS JOIN class_info;


-- =========================================================
-- PART 2: INNER JOIN
-- =========================================================

-- Add student required for INNER JOIN example
INSERT INTO class VALUES
(3,'alex');

-- Q2 INNER JOIN
SELECT *
FROM class
INNER JOIN class_info
ON class.id = class_info.id;

-- Q3 INNER JOIN - names and addresses
SELECT class.name,
       class_info.address
FROM class
INNER JOIN class_info
ON class.id = class_info.id;


-- =========================================================
-- PART 3: NATURAL JOIN
-- =========================================================

-- Q4 NATURAL JOIN
SELECT *
FROM class
NATURAL JOIN class_info;


-- =========================================================
-- PART 4: LEFT OUTER JOIN
-- =========================================================

INSERT INTO class VALUES
(5,'ashish');

INSERT INTO class_info VALUES
(7,'NOIDA'),
(8,'PANIPAT');

-- Q5 LEFT JOIN
SELECT *
FROM class
LEFT OUTER JOIN class_info
ON class.id = class_info.id;

-- Q6 LEFT JOIN - unmatched students
SELECT *
FROM class
LEFT JOIN class_info
ON class.id = class_info.id
WHERE class_info.id IS NULL;


-- =========================================================
-- PART 5: RIGHT OUTER JOIN
-- =========================================================

-- Q7 RIGHT JOIN
SELECT *
FROM class
RIGHT OUTER JOIN class_info
ON class.id = class_info.id;

-- Q8 RIGHT JOIN - unmatched addresses
SELECT *
FROM class
RIGHT JOIN class_info
ON class.id = class_info.id
WHERE class.id IS NULL;


-- =========================================================
-- PART 6: FULL OUTER JOIN
-- MySQL equivalent using UNION
-- =========================================================

-- Q9 FULL OUTER JOIN equivalent
SELECT *
FROM class
LEFT JOIN class_info
ON class.id = class_info.id

UNION

SELECT *
FROM class
RIGHT JOIN class_info
ON class.id = class_info.id;


-- Q10 FULL OUTER JOIN - unmatched records only
SELECT *
FROM class
LEFT JOIN class_info
ON class.id = class_info.id
WHERE class_info.id IS NULL

UNION

SELECT *
FROM class
RIGHT JOIN class_info
ON class.id = class_info.id
WHERE class.id IS NULL;


-- =========================================================
-- PART 7: UNION
-- =========================================================

CREATE TABLE first_table(
    id INT,
    name VARCHAR(30)
);

CREATE TABLE second_table(
    id INT,
    name VARCHAR(30)
);

INSERT INTO first_table VALUES
(1,'abhi'),
(2,'adam');

INSERT INTO second_table VALUES
(2,'adam'),
(3,'chester');

-- Q11 UNION
SELECT *
FROM first_table
UNION
SELECT *
FROM second_table;

-- Q12 UNION - names
SELECT name
FROM first_table
UNION
SELECT name
FROM second_table;


-- =========================================================
-- PART 8: UNION ALL
-- =========================================================

-- Q13 UNION ALL
SELECT *
FROM first_table
UNION ALL
SELECT *
FROM second_table;

-- Q14 UNION ALL - COUNT
SELECT COUNT(*)
FROM
(
    SELECT * FROM first_table
    UNION ALL
    SELECT * FROM second_table
) AS A;


-- =========================================================
-- PART 9: INTERSECT
-- MySQL-compatible equivalent
-- =========================================================

-- Q15 INTERSECT equivalent
SELECT f.*
FROM first_table f
INNER JOIN second_table s
ON f.id = s.id
AND f.name = s.name;

-- Q16 INTERSECT - names
SELECT DISTINCT f.name
FROM first_table f
INNER JOIN second_table s
ON f.name = s.name;


-- =========================================================
-- PART 10: MINUS
-- MySQL-compatible equivalent
-- =========================================================

-- Q17 MINUS equivalent
SELECT *
FROM first_table f
WHERE NOT EXISTS (
    SELECT 1
    FROM second_table s
    WHERE s.id = f.id
    AND s.name = f.name
);

-- Q18 MINUS - names
SELECT name
FROM first_table
WHERE name NOT IN (
    SELECT name
    FROM second_table
);


-- =========================================================
-- ADVANCED INTERVIEW QUESTIONS
-- =========================================================

-- Q19 Matching addresses
SELECT c.id,
       c.name,
       ci.address
FROM class c
INNER JOIN class_info ci
ON c.id = ci.id;


-- Q20 Address availability status
SELECT c.id,
       c.name,
       CASE
           WHEN ci.address IS NULL
           THEN 'Address Missing'
           ELSE 'Address Available'
       END AS Status
FROM class c
LEFT JOIN class_info ci
ON c.id = ci.id;