import { Router } from "express";
import { query } from "../db.js";

const router = Router();
const STATUSES = ["new", "contacted", "quoted", "won", "lost"];

router.get("/", async (req, res) => {
  const { status } = req.query;
  const params = [];
  let where = "";
  if (status) {
    params.push(status);
    where = "WHERE l.status = $1";
  }
  const { rows } = await query(
    `SELECT l.*, c.name AS customer_name, c.phone AS customer_phone
     FROM leads l JOIN customers c ON c.id = l.customer_id
     ${where} ORDER BY l.created_at DESC`,
    params
  );
  res.json(rows);
});

router.post("/", async (req, res) => {
  const { customer_id, title, notes, follow_up_date } = req.body;
  if (!customer_id || !title) return res.status(400).json({ error: "customer_id and title required" });
  const { rows } = await query(
    `INSERT INTO leads (customer_id, title, notes, follow_up_date, created_by)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [customer_id, title, notes || null, follow_up_date || null, req.user.id]
  );
  res.status(201).json(rows[0]);
});

router.patch("/:id/status", async (req, res) => {
  const { status } = req.body;
  if (!STATUSES.includes(status)) return res.status(400).json({ error: "Invalid status" });
  const { rows } = await query("UPDATE leads SET status = $1 WHERE id = $2 RETURNING *", [
    status,
    req.params.id,
  ]);
  if (!rows[0]) return res.status(404).json({ error: "Lead not found" });
  // Hook for automation later: if (status === "won") sendNotification(...)
  res.json(rows[0]);
});

export default router;
