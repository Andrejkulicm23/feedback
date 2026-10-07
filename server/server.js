import express from "express";
import fs from "fs/promises";
import path from "path";

const app = express();
const PORT = process.env.PORT || 4000;
const DB_FILE = path.resolve(process.cwd(), "server", "feedback.db.json");

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

async function readDB() {
  try {
    const raw = await fs.readFile(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

async function writeDB(data) {
  await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

app.post("/api/feedback", async (req, res) => {
  try {
    const { emoji, rating, name, comment, ts } = req.body;
    if (!emoji || !rating)
      return res.status(400).json({ error: "Missing fields" });
    const db = await readDB();
    const entry = {
      emoji,
      rating,
      name: name || null,
      comment: comment || null,
      ts: ts || new Date().toISOString(),
    };
    db.push(entry);
    await writeDB(db);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed" });
  }
});

app.get("/api/feedback", async (req, res) => {
  const db = await readDB();
  res.json(db);
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Feedback server listening on http://localhost:${PORT}`);
});
