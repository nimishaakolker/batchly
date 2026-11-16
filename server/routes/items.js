import { Router } from "express";
import { pool, query } from "../db.js";
import { requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", async (_req, res) => {
  const { rows } = await query("SELECT * FROM items ORDER BY name");
  res.json(rows);
});

router.post("/", requireRole("admin"), async (req, res) => {
  const { name, unit, price, stock, low_stock_threshold } = req.body;
  if (!name || price == null) return res.status(400).json({ error: "name and price required" });
  const { rows } = await query(
    `INSERT INTO items (name, unit, price, stock, low_stock_threshold)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, unit || "kg", price, stock || 0, low_stock_threshold || 10]
  );
  res.status(201).json(rows[0]);
});

router.post("/:id/restock", requireRole("admin"), async (req, res) => {
  const qty = parseInt(req.body.quantity, 10);
  if (!qty || qty <= 0) return res.status(400).json({ error: "quantity must be positive" });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      "UPDATE items SET stock = stock + $1 WHERE id = $2 RETURNING *",
      [qty, req.params.id]
    );
    if (!rows[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Item not found" });
    }
    await client.query(
      "INSERT INTO stock_movements (item_id, change, reason) VALUES ($1, $2, 'restock')",
      [req.params.id, qty]
    );
    await client.query("COMMIT");
    res.json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Restock failed" });
  } finally {
    client.release();
  }
});

export default router;
