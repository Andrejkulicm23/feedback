import express from "express";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;
const DB_USER = process.env.DB_USER || "andrejkulicm23";
const DB_PASSWORD = process.env.DB_PASSWORD || "huntercraft2";
const DB_NAME = process.env.DB_NAME || "3it_andrejkulicm23";

const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.post("/api/feedback", async (req, res) => {
  try {
    const { rating } = req.body;
    console.log("POST /api/feedback body:", req.body);
    if (typeof rating !== "number" && typeof rating !== "string") {
      return res.status(400).json({ error: "Missing rating" });
    }

    const conn = await pool.getConnection();
    try {
      const sql = "INSERT INTO `rating` (`rating`) VALUES (?)";
      console.log("Executing SQL:", sql, [Number(rating)]);
      const [result] = await conn.execute(sql, [Number(rating)]);
      console.log("SQL result:", result);
      res.json({
        ok: true,
        insertId: result && result.insertId ? result.insertId : null,
      });
    } catch (err) {
      console.error("DB insert error:", err && err.message ? err.message : err);
      res
        .status(500)
        .json({ error: err && err.message ? err.message : "db_error" });
    } finally {
      try {
        conn.release();
      } catch (e) {}
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed" });
  }
});

app.get("/api/feedback", async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(
      "SELECT `id`, `rating` FROM `rating` ORDER BY `id` DESC LIMIT 1000",
    );
    conn.release();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed" });
  }
});

app.listen(PORT, () => {
  console.log(`MySQL feedback server listening on http://localhost:${PORT}`);
});
