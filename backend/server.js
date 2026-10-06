const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 5000;
const JWT_SECRET =
  process.env.JWT_SECRET || "medivault_secret_key_2026";

app.use(
  cors({
    origin: true,
    credentials: true
  })
);

app.use(express.json());

/* =========================================================
   MYSQL
========================================================= */

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "medivault",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/* =========================================================
   DATABASE HELPERS
========================================================= */

async function columnExists(tableName, columnName) {
  const [rows] = await pool.query(
    `
    SELECT COUNT(*) AS count
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?
    `,
    [
      process.env.DB_NAME || "medivault",
      tableName,
      columnName
    ]
  );

  return rows[0].count > 0;
}

async function addColumnIfMissing(
  tableName,
  columnName,
  definition
) {
  const exists = await columnExists(
    tableName,
    columnName
  );

  if (!exists) {
    await pool.query(
      `ALTER TABLE \`${tableName}\`
       ADD COLUMN \`${columnName}\` ${definition}`
    );

    console.log(
      `Added missing column ${tableName}.${columnName}`
    );
  }
}

/* =========================================================
   DATABASE INITIALIZATION
========================================================= */

async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(190) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      mobile_number VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await addColumnIfMissing(
    "users",
    "mobile_number",
    "VARCHAR(20)"
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS medicines (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      name VARCHAR(150) NOT NULL,
      dosage VARCHAR(100),
      frequency VARCHAR(100),
      start_date DATE,
      end_date DATE,
      notes VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS prescriptions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      doctor_name VARCHAR(150),
      hospital_name VARCHAR(150),
      prescription_date DATE,
      notes VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reminders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      medicine_name VARCHAR(150) NOT NULL,
      dose VARCHAR(100),
      frequency VARCHAR(100),
      reminder_date DATE NOT NULL,
      reminder_time TIME NOT NULL,
      notes VARCHAR(255),
      status ENUM('pending','completed')
        DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS medication_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      medicine_name VARCHAR(150) NOT NULL,
      action VARCHAR(100) NOT NULL,
      action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    )
  `);

  console.log("Database initialized successfully.");
}

/* =========================================================
   AUTHENTICATION
========================================================= */

function auth(req, res, next) {
  try {
    const header =
      req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required."
      });
    }

    const token = header.substring(7);

    const decoded = jwt.verify(
      token,
      JWT_SECRET
    );

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token."
    });
  }
}

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "MediVault backend is running."
  });
});

/* =========================================================
   REGISTER
   Supports BOTH:
   /api/register
   /api/auth/register
========================================================= */

app.post(
  [
    "/api/register",
    "/api/auth/register"
  ],
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        mobile,
        phone,
        mobile_number,
        phone_number
      } = req.body;

      const finalMobile =
        mobile ||
        phone ||
        mobile_number ||
        phone_number ||
        null;

      if (!name || !email || !password) {
        return res.status(400).json({
          message:
            "Name, email and password are required."
        });
      }

      const cleanEmail =
        String(email).trim().toLowerCase();

      const [existing] = await pool.query(
        `
        SELECT id
        FROM users
        WHERE email = ?
        `,
        [cleanEmail]
      );

      if (existing.length > 0) {
        return res.status(409).json({
          message:
            "This email is already registered."
        });
      }

      const passwordHash =
        await bcrypt.hash(password, 10);

      const [result] = await pool.query(
        `
        INSERT INTO users
        (
          name,
          email,
          password_hash,
          mobile_number
        )
        VALUES (?, ?, ?, ?)
        `,
        [
          String(name).trim(),
          cleanEmail,
          passwordHash,
          finalMobile
        ]
      );

      const token = jwt.sign(
        {
          id: result.insertId,
          email: cleanEmail
        },
        JWT_SECRET,
        {
          expiresIn: "7d"
        }
      );

      return res.status(201).json({
        success: true,
        message:
          "Account created successfully.",
        token,
        user: {
          id: result.insertId,
          name: String(name).trim(),
          email: cleanEmail,
          mobile_number: finalMobile
        }
      });
    } catch (error) {
      console.error(
        "REGISTER ERROR:",
        error
      );

      return res.status(500).json({
        message:
          "Registration failed.",
        error: error.message
      });
    }
  }
);

/* =========================================================
   LOGIN
   Supports BOTH:
   /api/login
   /api/auth/login
========================================================= */

app.post(
  [
    "/api/login",
    "/api/auth/login"
  ],
  async (req, res) => {
    try {
      const {
        email,
        password
      } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          message:
            "Email and password are required."
        });
      }

      const cleanEmail =
        String(email).trim().toLowerCase();

      const [rows] = await pool.query(
        `
        SELECT *
        FROM users
        WHERE email = ?
        `,
        [cleanEmail]
      );

      if (rows.length === 0) {
        return res.status(401).json({
          message:
            "Invalid email or password."
        });
      }

      const user = rows[0];

      const validPassword =
        await bcrypt.compare(
          password,
          user.password_hash
        );

      if (!validPassword) {
        return res.status(401).json({
          message:
            "Invalid email or password."
        });
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email
        },
        JWT_SECRET,
        {
          expiresIn: "7d"
        }
      );

      return res.json({
        success: true,
        message: "Login successful.",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile_number:
            user.mobile_number || ""
        }
      });
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      return res.status(500).json({
        message: "Login failed.",
        error: error.message
      });
    }
  }
);

/* =========================================================
   PROFILE
========================================================= */

app.get(
  [
    "/api/profile",
    "/api/auth/profile",
    "/api/auth/me"
  ],
  auth,
  async (req, res) => {
    try {
      const [rows] = await pool.query(
        `
        SELECT
          id,
          name,
          email,
          mobile_number,
          created_at
        FROM users
        WHERE id = ?
        `,
        [req.user.id]
      );

      if (rows.length === 0) {
        return res.status(404).json({
          message: "User not found."
        });
      }

      res.json(rows[0]);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Could not load profile."
      });
    }
  }
);

/* =========================================================
   UPDATE PROFILE
========================================================= */

app.put(
  [
    "/api/profile",
    "/api/auth/profile"
  ],
  auth,
  async (req, res) => {
    try {
      const {
        name,
        mobile,
        phone,
        mobile_number,
        phone_number
      } = req.body;

      const finalMobile =
        mobile ||
        phone ||
        mobile_number ||
        phone_number ||
        null;

      if (!name) {
        return res.status(400).json({
          message:
            "Name is required."
        });
      }

      await pool.query(
        `
        UPDATE users
        SET
          name = ?,
          mobile_number = ?
        WHERE id = ?
        `,
        [
          name,
          finalMobile,
          req.user.id
        ]
      );

      res.json({
        success: true,
        message:
          "Profile updated successfully."
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Could not update profile."
      });
    }
  }
);

/* =========================================================
   MEDICINES
========================================================= */

app.get("/api/medicines", auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT *
       FROM medicines
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json(rows);

  } catch (err) {
    console.error("Could not load medicines:", err);

    res.status(500).json({
      message: "Could not load medicines."
    });
  }
});

app.post("/api/medicines", auth, async (req, res) => {
  try {
    const {
      name,
      dosage,
      frequency,
      reminder_time,
      duration
    } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Medicine name is required."
      });
    }

    const [result] = await pool.query(
      `INSERT INTO medicines
       (user_id, name, dose, frequency, time, duration, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        name,
        dosage || null,
        frequency || null,
        reminder_time || null,
        duration || null,
        "Active"
      ]
    );

    res.status(201).json({
      message: "Medicine added successfully.",
      id: result.insertId
    });

  } catch (err) {
    console.error("Could not add medicine:", err);

    res.status(500).json({
      message: "Could not add medicine."
    });
  }
});

app.delete("/api/medicines/:id", auth, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM medicines
       WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );

    res.json({
      message: "Medicine deleted."
    });

  } catch (err) {
    console.error("Could not delete medicine:", err);

    res.status(500).json({
      message: "Could not delete medicine."
    });
  }
});

/* =========================================================
   PRESCRIPTIONS
========================================================= */

/* GET PRESCRIPTIONS
   This was missing before.
   It loads prescriptions belonging to the logged-in user.
========================================================= */

app.get(
  "/api/prescriptions",
  auth,
  async (req, res) => {
    try {
      const [rows] = await pool.query(
        `
        SELECT
          id,
          doctor,
          prescription_date,
          diagnosis,
          medicines_count,
          created_at
        FROM prescriptions
        WHERE user_id = ?
        ORDER BY
          prescription_date DESC,
          created_at DESC
        `,
        [req.user.id]
      );

      res.json({
        prescriptions: rows
      });

    } catch (error) {
      console.error(
        "GET PRESCRIPTIONS ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Could not load prescriptions."
      });
    }
  }
);

/* POST PRESCRIPTION */

app.post(
  "/api/prescriptions",
  auth,
  async (req, res) => {
    try {
      const {
        doctor_name,
        doctor,
        prescription_date,
        diagnosis,
        medicines_count
      } = req.body;

      const doctorValue =
        doctor_name || doctor || null;

      if (
        !doctorValue ||
        !prescription_date
      ) {
        return res.status(400).json({
          message:
            "Doctor name and prescription date are required."
        });
      }

      const [result] = await pool.query(
        `
        INSERT INTO prescriptions
        (
          user_id,
          doctor,
          prescription_date,
          diagnosis,
          medicines_count
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
          req.user.id,
          doctorValue,
          prescription_date,
          diagnosis || null,
          medicines_count || 1
        ]
      );

      res.status(201).json({
        success: true,
        message:
          "Prescription saved.",
        id: result.insertId
      });

    } catch (error) {
      console.error(
        "SAVE PRESCRIPTION ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Could not save prescription."
      });
    }
  }
);

/* =========================================================
   REMINDERS
========================================================= */

app.get(
  "/api/reminders",
  auth,
  async (req, res) => {
    try {
      const [rows] = await pool.query(
        `
        SELECT *
        FROM reminders
        WHERE user_id = ?
        ORDER BY
          reminder_date ASC,
          reminder_time ASC
        `,
        [req.user.id]
      );

      res.json(rows);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Could not load reminders."
      });
    }
  }
);

app.post(
  "/api/reminders",
  auth,
  async (req, res) => {
    try {
      const {
        medicine_name,
        dose,
        frequency,
        reminder_date,
        reminder_time,
        notes
      } = req.body;

      if (
        !medicine_name ||
        !reminder_date ||
        !reminder_time
      ) {
        return res.status(400).json({
          message:
            "Medicine, date and time are required."
        });
      }

      const [result] = await pool.query(
        `
        INSERT INTO reminders
        (
          user_id,
          medicine_name,
          dose,
          frequency,
          reminder_date,
          reminder_time,
          notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          req.user.id,
          medicine_name,
          dose || null,
          frequency || null,
          reminder_date,
          reminder_time,
          notes || null
        ]
      );

      res.status(201).json({
        success: true,
        message:
          "Reminder saved successfully.",
        id: result.insertId
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Could not save reminder."
      });
    }
  }
);

/* =========================================================
   COMPLETE REMINDER
========================================================= */

app.patch(
  "/api/reminders/:id/complete",
  auth,
  async (req, res) => {
    try {
      const [rows] = await pool.query(
        `
        SELECT medicine_name
        FROM reminders
        WHERE id = ?
          AND user_id = ?
        `,
        [
          req.params.id,
          req.user.id
        ]
      );

      if (rows.length === 0) {
        return res.status(404).json({
          message:
            "Reminder not found."
        });
      }

      await pool.query(
        `
        UPDATE reminders
        SET status = 'completed'
        WHERE id = ?
          AND user_id = ?
        `,
        [
          req.params.id,
          req.user.id
        ]
      );

      await pool.query(
        `
        INSERT INTO medication_history
        (
          user_id,
          medicine_name,
          action
        )
        VALUES (?, ?, ?)
        `,
        [
          req.user.id,
          rows[0].medicine_name,
          "Taken"
        ]
      );

      res.json({
        success: true,
        message:
          "Reminder marked as taken."
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Could not complete reminder."
      });
    }
  }
);

/* =========================================================
   DELETE REMINDER
========================================================= */

app.delete(
  "/api/reminders/:id",
  auth,
  async (req, res) => {
    try {
      await pool.query(
        `
        DELETE FROM reminders
        WHERE id = ?
          AND user_id = ?
        `,
        [
          req.params.id,
          req.user.id
        ]
      );

      res.json({
        success: true,
        message:
          "Reminder deleted."
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Could not delete reminder."
      });
    }
  }
);

/* =========================================================
   MEDICATION HISTORY
========================================================= */

app.get(
  "/api/history",
  auth,
  async (req, res) => {
    try {
      const [rows] = await pool.query(
        `
        SELECT
          id,
          medicine_name,
          action,
          DATE_FORMAT(
            action_date,
            '%d %b %Y, %h:%i %p'
          ) AS action_date
        FROM medication_history
        WHERE user_id = ?
        ORDER BY action_date DESC
        `,
        [req.user.id]
      );

      res.json(rows);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Could not load history."
      });
    }
  }
);

/* =========================================================
   START SERVER
========================================================= */

async function start() {
  try {
    await initDatabase();

    app.listen(PORT, () => {
      console.log(
        `MediVault backend running at http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Could not start MediVault backend."
    );

    console.error(error);

    process.exit(1);
  }
}

start();