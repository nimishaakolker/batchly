import express from "express";
import "express-async-errors"; // lets Express 4 catch errors thrown in async routes
import cors from "cors";
import "dotenv/config";
import { requireAuth } from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";
import customerRoutes from "./routes/customers.js";
import leadRoutes from "./routes/leads.js";
import itemRoutes from "./routes/items.js";
import orderRoutes from "./routes/orders.js";
import dashboardRoutes from "./routes/dashboard.js";
import aiRoutes from "./routes/ai.js";

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/customers", requireAuth, customerRoutes);
app.use("/api/leads", requireAuth, leadRoutes);
app.use("/api/items", requireAuth, itemRoutes);
app.use("/api/orders", requireAuth, orderRoutes);
app.use("/api/dashboard", requireAuth, dashboardRoutes);
app.use("/api/ai", requireAuth, aiRoutes);

// Last-resort error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`API running on port ${port}`));
