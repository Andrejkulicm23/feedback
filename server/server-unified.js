import express from "express";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;

const JSON_DB = path.resolve(process.cwd(), "server", "feedback.db.json");

async function ensureRatingTable(conn) {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS rating (
      id INT NOT NULL AUTO_INCREMENT,
      rating INT NOT NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function readJSON() {
  try {
    const raw = await fs.readFile(JSON_DB, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

async function writeJSON(data) {
  await fs.mkdir(path.dirname(JSON_DB), { recursive: true });
  await fs.writeFile(JSON_DB, JSON.stringify(data, null, 2), "utf-8");
}

let useMySQL = false;
let mysqlPool = null;

async function tryInitMySQL() {
  if (!DB_HOST || !DB_USER || !DB_NAME) return;
  try {
    const mysql = await import("mysql2/promise");
    mysqlPool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT ? Number(DB_PORT) : 3306,
      user: DB_USER,
      password: DB_PASSWORD || undefined,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
    });
    // test connection
    const conn = await mysqlPool.getConnection();
    try {
      await conn.query("SELECT 1");
      await ensureRatingTable(conn);
      useMySQL = true;
      console.log("Using MySQL database for feedback storage.");
    } finally {
      conn.release();
    }
  } catch (err) {
    console.warn(
      "MySQL not available, falling back to JSON file storage.",
      err && err.message ? err.message : err,
    );
    useMySQL = false;
    mysqlPool = null;
  }
}

await tryInitMySQL();

app.post("/api/feedback", async (req, res) => {
  try {
    const { rating } = req.body;
    console.log("POST /api/feedback body:", req.body);
    if (typeof rating !== "number" && typeof rating !== "string") {
      return res.status(400).json({ error: "Missing rating" });
    }

    if (useMySQL && mysqlPool) {
      const conn = await mysqlPool.getConnection();
      try {
        await ensureRatingTable(conn);
        const sql = "INSERT INTO `rating` (`rating`) VALUES (?)";
        console.log("Executing SQL:", sql, [Number(rating)]);
        const [result] = await conn.execute(sql, [Number(rating)]);
        console.log("SQL result:", result);
        return res.json({
          ok: true,
          insertId: result && result.insertId ? result.insertId : null,
        });
      } catch (err) {
        console.error(
          "DB insert error:",
          err && err.message ? err.message : err,
        );
        return res
          .status(500)
          .json({ error: err && err.message ? err.message : "db_error" });
      } finally {
        try {
          conn.release();
        } catch (e) {}
      }
    } else {
      const db = await readJSON();
      const entry = {
        id: Date.now(),
        rating: Number(rating),
      };
      db.push(entry);
      await writeJSON(db);
      return res.json({ ok: true, id: entry.id });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "failed" });
  }
});

app.get("/api/feedback", async (req, res) => {
  try {
    if (useMySQL && mysqlPool) {
      const conn = await mysqlPool.getConnection();
      try {
        await ensureRatingTable(conn);
        const [rows] = await conn.query(
          "SELECT `id`, `rating` FROM `rating` ORDER BY `id` DESC LIMIT 1000",
        );
        return res.json(rows);
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "db_error" });
      } finally {
        try {
          conn.release();
        } catch (e) {}
      }
    } else {
      const db = await readJSON();
      return res.json(db.slice().reverse());
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "failed" });
  }
});

app.listen(PORT, () => {
  console.log(
    `Feedback server listening on http://localhost:${PORT} (useMySQL=${useMySQL})`,
  );
});
