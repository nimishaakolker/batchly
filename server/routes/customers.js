import { Router } from "express";
import { query } from "../db.js";

const router = Router();

router.get("/", async (_req, res) => {
  const { rows } = await query("SELECT * FROM customers ORDER BY name");
  res.json(rows);
});

router.post("/", async (req, res) => {
  const { name, phone, email } = req.body;
  if (!name) return res.status(400).json({ error: "Name required" });
  const { rows } = await query(
    "INSERT INTO customers (name, phone, email) VALUES ($1, $2, $3) RETURNING *",
    [name, phone || null, email || null]
  );
  res.status(201).json(rows[0]);
});

export default router;
