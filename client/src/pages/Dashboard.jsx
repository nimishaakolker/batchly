import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { api, money } from "../api.js";

function Chart({ title, data, xKey, yKey, color = "#000" }) {
  return (
    <div className="panel">
      <h3>{title}</h3>
      {data.length === 0 ? (
        <p className="muted">No data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data}>
            <CartesianGrid stroke="#e5e5e5" vertical={false} />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey={yKey} fill={color} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    api("/dashboard").then(setData).catch((e) => setError(e.message));
  }, []);

  async function generateSummary() {
    setAiLoading(true);
    setAiError("");
    try {
      const res = await api("/ai/summary", { method: "POST" });
      setSummary(res.summary);
    } catch (e) {
      setAiError(e.message);
    } finally {
      setAiLoading(false);
    }
  }

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p>Loading...</p>;

  const { cards } = data;
  return (
    <>
      <h2>Dashboard</h2>

      <div className="cards">
        <div className="card"><small>Total revenue</small><strong>{money(cards.revenue)}</strong></div>
        <div className="card"><small>Orders</small><strong>{cards.orders}</strong></div>
        <div className="card"><small>New leads</small><strong>{cards.newLeads}</strong></div>
        <div className="card"><small>Low stock items</small><strong>{cards.lowStock}</strong></div>
      </div>

      <div className="panel">
        <div className="row-between">
          <h3>AI summary</h3>
          <button onClick={generateSummary} disabled={aiLoading}>
            {aiLoading ? "Thinking..." : summary ? "Regenerate" : "Generate summary"}
          </button>
        </div>
        {summary && <p className="summary">{summary}</p>}
        {aiError && <p className="error">{aiError}</p>}
        {!summary && !aiError && <p className="muted">Get a plain-English read of your numbers.</p>}
      </div>

      <div className="grid-2">
        <Chart title="Sales by month (₹)" data={data.salesByMonth} xKey="month" yKey="sales" />
        <Chart title="Leads by stage" data={data.leadsByStatus} xKey="status" yKey="count" color="#555" />
      </div>
      <Chart title="Top products (units sold)" data={data.topProducts} xKey="name" yKey="sold" color="#333" />
    </>
  );
}
