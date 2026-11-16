import { Router } from "express";
import { query } from "../db.js";

const router = Router();

export async function getDashboardData() {
  const [cards, salesByMonth, leadsByStatus, topProducts] = await Promise.all([
    query(`SELECT
      (SELECT COALESCE(SUM(total), 0) FROM orders) AS revenue,
      (SELECT COUNT(*) FROM orders) AS orders,
      (SELECT COUNT(*) FROM leads WHERE status = 'new') AS new_leads,
      (SELECT COUNT(*) FROM items WHERE stock <= low_stock_threshold) AS low_stock`),
    query(`SELECT to_char(date_trunc('month', created_at), 'Mon YY') AS month,
                  SUM(total)::float AS sales
           FROM orders GROUP BY date_trunc('month', created_at)
           ORDER BY date_trunc('month', created_at)`),
    query(`SELECT status, COUNT(*)::int AS count FROM leads GROUP BY status`),
    query(`SELECT i.name, SUM(oi.quantity)::int AS sold
           FROM order_items oi JOIN items i ON i.id = oi.item_id
           GROUP BY i.name ORDER BY sold DESC LIMIT 5`),
  ]);

  const c = cards.rows[0];
  return {
    cards: {
      revenue: Number(c.revenue),
      orders: Number(c.orders),
      newLeads: Number(c.new_leads),
      lowStock: Number(c.low_stock),
    },
    salesByMonth: salesByMonth.rows,
    leadsByStatus: leadsByStatus.rows,
    topProducts: topProducts.rows,
  };
}

router.get("/", async (_req, res) => {
  res.json(await getDashboardData());
});

export default router;
