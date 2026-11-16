import { Router } from "express";
import { pool, query } from "../db.js";

const router = Router();

router.get("/", async (_req, res) => {
  const { rows } = await query(
    `SELECT o.id, o.total, o.created_at, c.name AS customer_name
     FROM orders o JOIN customers c ON c.id = o.customer_id
     ORDER BY o.created_at DESC LIMIT 100`
  );
  res.json(rows);
});

// body: { customer_id, lines: [{ item_id, quantity }] }
// This is the "ERP moment": one order -> stock reduced -> movement logged,
// all inside ONE transaction. If anything fails, nothing is saved.
router.post("/", async (req, res) => {
  const { customer_id, lines } = req.body;
  if (!customer_id || !Array.isArray(lines) || lines.length === 0)
    return res.status(400).json({ error: "customer_id and at least one line required" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const order = (
      await client.query(
        "INSERT INTO orders (customer_id, created_by) VALUES ($1, $2) RETURNING id",
        [customer_id, req.user.id]
      )
    ).rows[0];

    let total = 0;
    for (const line of lines) {
      const qty = parseInt(line.quantity, 10);
      if (!qty || qty <= 0) throw new Error("Invalid quantity");

      // FOR UPDATE locks the row so two orders can't both take the last stock
      const item = (
        await client.query("SELECT * FROM items WHERE id = $1 FOR UPDATE", [line.item_id])
      ).rows[0];
      if (!item) throw new Error(`Item ${line.item_id} not found`);
      if (item.stock < qty) throw new Error(`Not enough stock for ${item.name}`);

      await client.query("UPDATE items SET stock = stock - $1 WHERE id = $2", [qty, item.id]);
      await client.query(
        "INSERT INTO order_items (order_id, item_id, quantity, unit_price) VALUES ($1, $2, $3, $4)",
        [order.id, item.id, qty, item.price]
      );
      await client.query(
        "INSERT INTO stock_movements (item_id, change, reason) VALUES ($1, $2, $3)",
        [item.id, -qty, `order #${order.id}`]
      );
      total += Number(item.price) * qty;
    }

    await client.query("UPDATE orders SET total = $1 WHERE id = $2", [total, order.id]);
    await client.query("COMMIT");
    res.status(201).json({ id: order.id, total });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

export default router;
