import { Router } from "express";
import { getDashboardData } from "./dashboard.js";
import { query } from "../db.js";

const router = Router();

// Sends only aggregated numbers (never raw rows or passwords) to the LLM.
router.post("/summary", async (_req, res) => {
  if (!process.env.GROQ_API_KEY)
    return res.status(503).json({ error: "GROQ_API_KEY is not set on the server" });

  try {
    const data = await getDashboardData();
    const low = await query(
      "SELECT name, stock, unit FROM items WHERE stock <= low_stock_threshold"
    );

    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
        temperature: 0.3,
        max_tokens: 250,
        messages: [
          {
            role: "system",
            content:
              "You are a business analyst for a small company that sells food ingredients to other businesses. " +
              "Given JSON of business numbers (amounts are in Indian rupees), write a summary of 3 to 4 short sentences: " +
              "how sales are trending, the best selling product, and any low-stock items that need restocking. " +
              "Use only the numbers provided. Do not invent anything.",
          },
          { role: "user", content: JSON.stringify({ ...data, lowStockItems: low.rows }) },
        ],
      }),
    });

    const json = await r.json();
    if (!r.ok) throw new Error(json.error?.message || "Groq request failed");
    res.json({ summary: json.choices[0].message.content.trim() });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "AI summary unavailable right now" });
  }
});

export default router;
