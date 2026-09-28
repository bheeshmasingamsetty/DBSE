CREATE DATABASE bank_db;

USE bank_db;
CREATE TABLE bank_transactions (
    txn_id INT PRIMARY KEY,
    customer_name VARCHAR(50),
    branch_name VARCHAR(50),
    transaction_type VARCHAR(20),
    amount DECIMAL(10,2),
    transaction_date DATE
);

INSERT INTO bank_transactions VALUES
(101,'Ravi','Hyderabad','Deposit',5000,'2024-01-05'),
(102,'Sita','Hyderabad','Withdrawal',2000,'2024-01-06'),
(103,'Kiran','Vijayawada','Deposit',12000,'2024-01-08'),
(104,'Anil','Vizag','Deposit',8000,'2024-01-10'),
(105,'Priya','Hyderabad','Withdrawal',3500,'2024-01-11'),
(106,'Ramesh','Vizag','Deposit',15000,'2024-01-12'),
(107,'Keerthi','Vijayawada','Withdrawal',1000,'2024-01-13'),
(108,'Rahul','Hyderabad','Deposit',9000,'2024-01-14'),
(109,'Sneha','Vizag','Withdrawal',4000,'2024-01-15'),
(110,'Madhu','Vijayawada','Deposit',11000,'2024-01-16');

SELECT * FROM bank_transactions;
-- QUESTION 1 - SUM() 
USE bank_db;

SELECT SUM(amount) AS Total_Amount
FROM bank_transactions;

# QUESTION 2 - AVG()
SELECT AVG(amount) AS Average_Transaction
FROM bank_transactions;

# QUESTION 3 - MAX()

SELECT MAX(amount) AS Highest_Transaction
FROM bank_transactions;

# QUESTION 4 - MIN()

SELECT MIN(amount) AS Lowest_Transaction
FROM bank_transactions;

# QUESTION 5 - COUNT()

SELECT COUNT(*) AS Total_Transactions
FROM bank_transactions;

# QUESTION 6 - WHERE + SUM()

SELECT SUM(amount) AS Total_Deposit
FROM bank_transactions
WHERE transaction_type = 'Deposit';

# QUESTION 7 - GROUP BY

SELECT branch_name,
       SUM(amount) AS Total_Amount
FROM bank_transactions
GROUP BY branch_name;

# QUESTION 8 - GROUP BY + HAVING

SELECT branch_name,
       SUM(amount) AS Total_Amount
FROM bank_transactions
GROUP BY branch_name
HAVING SUM(amount) > 20000;

# QUESTION 9 - GROUP BY + ORDER BY

SELECT branch_name,
       SUM(amount) AS Total_Amount
FROM bank_transactions
GROUP BY branch_name
ORDER BY Total_Amount DESC;

# QUESTION 10 - GROUP BY + HAVING + ORDER BY

SELECT branch_name,
       COUNT(*) AS Total_Transactions
FROM bank_transactions
GROUP BY branch_name
HAVING COUNT(*) >= 3
ORDER BY Total_Transactions DESC;

# QUESTION 11 - WHERE + COUNT()

SELECT COUNT(*) AS Withdrawals
FROM bank_transactions
WHERE transaction_type='Withdrawal';

# QUESTION 12 - WHERE + AVG()

SELECT AVG(amount) AS Avg_Deposit
FROM bank_transactions
WHERE transaction_type='Deposit';

# QUESTION 13 - GROUP BY + MAX()

SELECT branch_name,
       MAX(amount) AS Highest_Amount
FROM bank_transactions
GROUP BY branch_name;

# QUESTION 14 - GROUP BY + MIN()

SELECT branch_name,
       MIN(amount) AS Lowest_Amount
FROM bank_transactions
GROUP BY branch_name;

# QUESTION 15 - WHERE + ORDER BY

SELECT *
FROM bank_transactions
WHERE amount > 8000
ORDER BY amount DESC;

# QUESTION 16 - GROUP BY + COUNT()

SELECT branch_name,
       COUNT(*) AS Customer_Count
FROM bank_transactions
GROUP BY branch_name;

# QUESTION 17 - HAVING + COUNT()

SELECT branch_name,
       COUNT(*) AS Total_Transactions
FROM bank_transactions
GROUP BY branch_name
HAVING COUNT(*) > 3;

# QUESTION 18 - GROUP BY + AVG()

SELECT branch_name,
       AVG(amount) AS Avg_Amount
FROM bank_transactions
GROUP BY branch_name;

# QUESTION 19 - WHERE + GROUP BY + HAVING

SELECT branch_name,
       SUM(amount) AS Total_Deposit
FROM bank_transactions
WHERE transaction_type='Deposit'
GROUP BY branch_name
HAVING SUM(amount) > 15000;

# QUESTION 20 - GROUP BY + HAVING + ORDER BY

SELECT branch_name,
       AVG(amount) AS Avg_Amount
FROM bank_transactions
GROUP BY branch_name
HAVING AVG(amount) > 7000
ORDER BY Avg_Amount DESC;


