import fs from "fs";
import bcrypt from "bcryptjs";
import { pool } from "./db.js";

const schema = fs.readFileSync(new URL("./schema.sql", import.meta.url), "utf8");

async function run() {
  await pool.query(schema);

  const hash = await bcrypt.hash("demo1234", 10);
  await pool.query(
    `INSERT INTO users (name, email, password_hash, role) VALUES
     ('Admin Demo', 'admin@demo.com', $1, 'admin'),
     ('Sales Demo', 'sales@demo.com', $1, 'sales')`,
    [hash]
  );

  await pool.query(`INSERT INTO items (name, unit, price, stock, low_stock_threshold) VALUES
    ('Sugar Replacer Syrup', 'kg', 850, 120, 20),
    ('Smart Protein Powder', 'kg', 1200, 80, 15),
    ('Fermentation Media', 'l', 300, 200, 40),
    ('Stevia Blend', 'kg', 650, 12, 15),
    ('Packaging Pouches', 'pcs', 12, 500, 100)`);

  await pool.query(`INSERT INTO customers (name, phone, email) VALUES
    ('Fresh Beverages Co', '9000000001', 'buyer@freshbev.example'),
    ('Healthy Bites Foods', '9000000002', 'orders@healthybites.example'),
    ('Sweet Spot Bakery', '9000000003', 'hello@sweetspot.example'),
    ('Green Cart Retail', '9000000004', 'team@greencart.example')`);

  await pool.query(`INSERT INTO leads (customer_id, title, status, notes, follow_up_date) VALUES
    (1, 'Bulk syrup trial for new cola line', 'quoted', 'Wants 60% sugar reduction', CURRENT_DATE + 3),
    (2, 'Protein powder sample request', 'contacted', NULL, CURRENT_DATE + 1),
    (3, 'Bakery sugar replacement', 'new', NULL, NULL),
    (4, 'Retail private label', 'won', 'Contract signed', NULL),
    (2, 'Second product line', 'lost', 'Budget issues', NULL),
    (1, 'Annual supply contract', 'new', NULL, CURRENT_DATE + 7)`);

  // Past orders spread across months so the dashboard chart isn't empty
  const history = [
    [1, 4, 85000, "5 months"], [2, 1, 24000, "4 months"], [3, 2, 36000, "3 months"],
    [1, 1, 51000, "2 months"], [4, 3, 18000, "2 months"], [2, 2, 60000, "1 month"],
    [3, 1, 42500, "10 days"],
  ];
  for (const [cust, item, total, ago] of history) {
    const o = await pool.query(
      `INSERT INTO orders (customer_id, total, created_by, created_at)
       VALUES ($1, $2, 1, now() - $3::interval) RETURNING id`,
      [cust, total, ago]
    );
    await pool.query(
      `INSERT INTO order_items (order_id, item_id, quantity, unit_price)
       SELECT $1, id, 10, price FROM items WHERE id = $2`,
      [o.rows[0].id, item]
    );
  }

  console.log("Database ready. Login: admin@demo.com / demo1234");
  await pool.end();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
