import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import db from "../db.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret123";

// Get user by username
function getUserByUsername(username) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
      if (err) {
        console.error("getUserByUsername error:", err);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Create user (client by default)
function createUser(username, hashedPassword, role = "client") {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
      [username, hashedPassword, role],
      function (err) {
        if (err) {
          console.error("createUser error:", err);
          reject(err);
        } else {
          resolve({ id: this.lastID, username, role });
        }
      }
    );
  });
}

/**
 * POST /api/auth/register
 * Public – creates CLIENT users with hashed password
 */
router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }
  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" });
  }

  try {
    const existing = await getUserByUsername(username);
    if (existing) {
      return res.status(400).json({ error: "Username already taken" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const newUser = await createUser(username, hashed, "client");

    const payload = {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });

    return res.status(201).json({
      token,
      username: newUser.username,
      role: newUser.role,
    });
  } catch (err) {
    console.error("Register error:", err);
    // IMPORTANT: always send JSON with an `error` field
    return res.status(500).json({ error: "Server error during register" });
  }
});

/**
 * POST /api/auth/login
 */
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  try {
    const user = await getUserByUsername(username);

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });

    return res.json({
      token,
      username: user.username,
      role: user.role,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error during login" });
  }
});

export default router;
