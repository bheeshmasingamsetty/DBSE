CREATE DATABASE IF NOT EXISTS Bank_ACID_DB;
USE Bank_ACID_DB;

CREATE TABLE Customer (
    Customer_ID INT PRIMARY KEY,
    Customer_Name VARCHAR(100) NOT NULL,
    Phone VARCHAR(15),
    City VARCHAR(50)
);

CREATE TABLE Account (
    Account_No INT PRIMARY KEY,
    Customer_ID INT,
    Account_Type VARCHAR(20),
    Balance DECIMAL(12,2),
    Branch VARCHAR(50),
    FOREIGN KEY (Customer_ID) REFERENCES Customer(Customer_ID)
);

CREATE TABLE Bank_Transaction (
    Transaction_ID INT PRIMARY KEY AUTO_INCREMENT,
    Account_No INT,
    Transaction_Type VARCHAR(20),
    Amount DECIMAL(12,2),
    Transaction_Date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Account_No) REFERENCES Account(Account_No)
);

INSERT INTO Customer VALUES
(101,'Ravi Kumar','9876543210','Hyderabad'),
(102,'Priya Sharma','9876543211','Vijayawada'),
(103,'Arjun Reddy','9876543212','Bangalore'),
(104,'Sneha Rao','9876543213','Chennai'),
(105,'Kiran Kumar','9876543214','Hyderabad');

INSERT INTO Account VALUES
(10001,101,'Savings',50000,'Hyderabad'),
(10002,102,'Savings',75000,'Vijayawada'),
(10003,103,'Current',120000,'Bangalore'),
(10004,104,'Savings',45000,'Chennai'),
(10005,105,'Current',90000,'Hyderabad');

INSERT INTO Bank_Transaction
(Account_No, Transaction_Type, Amount)
VALUES
(10001,'DEPOSIT',10000),
(10002,'DEPOSIT',15000),
(10003,'WITHDRAW',20000),
(10004,'DEPOSIT',5000),
(10005,'WITHDRAW',10000);

SELECT * FROM Customer;
SELECT * FROM Account;
SELECT * FROM Bank_Transaction;
-- =========================================================
-- 7. COMMIT EXAMPLE
-- =========================================================

START TRANSACTION;

UPDATE Account
SET Balance = Balance + 5000
WHERE Account_No = 10001;

SELECT * FROM Account
WHERE Account_No = 10001;

COMMIT;

SELECT * FROM Account
WHERE Account_No = 10001;

-- =========================================================
-- 8. ROLLBACK EXAMPLE
-- =========================================================

START TRANSACTION;

UPDATE Account
SET Balance = Balance - 10000
WHERE Account_No = 10001;

SELECT * FROM Account
WHERE Account_No = 10001;

ROLLBACK;

SELECT * FROM Account
WHERE Account_No = 10001;

-- =========================================================
-- 9. SAVEPOINT EXAMPLE
-- =========================================================

START TRANSACTION;

UPDATE Account
SET Balance = Balance + 5000
WHERE Account_No = 10001;

SAVEPOINT Deposit1;

UPDATE Account
SET Balance = Balance - 3000
WHERE Account_No = 10002;

SAVEPOINT Withdrawal1;

UPDATE Account
SET Balance = Balance + 10000
WHERE Account_No = 10003;

ROLLBACK TO SAVEPOINT Withdrawal1;

COMMIT;

SELECT * FROM Account;

-- =========================================================
-- 10. BANK TRANSFER
-- =========================================================

START TRANSACTION;

UPDATE Account
SET Balance = Balance - 10000
WHERE Account_No = 10001;

UPDATE Account
SET Balance = Balance + 10000
WHERE Account_No = 10002;

SELECT Account_No, Balance
FROM Account
WHERE Account_No IN (10001, 10002);

COMMIT;

SELECT Account_No, Balance
FROM Account
WHERE Account_No IN (10001, 10002);

-- =========================================================
-- 11. TRANSFER WITH ROLLBACK
-- =========================================================

START TRANSACTION;

UPDATE Account
SET Balance = Balance - 20000
WHERE Account_No = 10001;

UPDATE Account
SET Balance = Balance + 20000
WHERE Account_No = 10002;

SELECT Account_No, Balance
FROM Account
WHERE Account_No IN (10001, 10002);

ROLLBACK;

SELECT Account_No, Balance
FROM Account
WHERE Account_No IN (10001, 10002);

-- =========================================================
-- 12. CHECK CURRENT ISOLATION LEVEL
-- =========================================================

SELECT @@SESSION.transaction_isolation;

-- =========================================================
-- 13. READ UNCOMMITTED
-- =========================================================

SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

START TRANSACTION;

SELECT Balance
FROM Account
WHERE Account_No = 10001;

COMMIT;

-- =========================================================
-- 14. READ COMMITTED
-- =========================================================

SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;

START TRANSACTION;

SELECT Balance
FROM Account
WHERE Account_No = 10001;

COMMIT;

-- =========================================================
-- 15. REPEATABLE READ
-- =========================================================

SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ;

START TRANSACTION;

SELECT Balance
FROM Account
WHERE Account_No = 10001;

SELECT Balance
FROM Account
WHERE Account_No = 10001;

COMMIT;

-- =========================================================
-- 16. SERIALIZABLE
-- =========================================================

SET SESSION TRANSACTION ISOLATION LEVEL SERIALIZABLE;

START TRANSACTION;

SELECT *
FROM Account
WHERE Account_No = 10001;

COMMIT;

-- =========================================================
-- 17. FINAL ACCOUNT DATA
-- =========================================================

SELECT * FROM Account;
