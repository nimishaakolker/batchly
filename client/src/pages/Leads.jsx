import { useEffect, useState } from "react";
import { api } from "../api.js";

const STATUSES = ["new", "contacted", "quoted", "won", "lost"];
const empty = { customer_id: "", title: "", notes: "", follow_up_date: "" };

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");

  const loadLeads = () =>
    api("/leads" + (filter ? `?status=${filter}` : "")).then(setLeads).catch((e) => setError(e.message));

  useEffect(() => { loadLeads(); }, [filter]);
  useEffect(() => { api("/customers").then(setCustomers).catch(() => {}); }, []);

  async function add(e) {
    e.preventDefault();
    setError("");
    try {
      await api("/leads", { method: "POST", body: { ...form, customer_id: Number(form.customer_id) } });
      setForm(empty);
      loadLeads();
    } catch (err) {
      setError(err.message);
    }
  }

  async function changeStatus(id, status) {
    setError("");
    try {
      await api(`/leads/${id}/status`, { method: "PATCH", body: { status } });
      loadLeads();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <h2>Leads</h2>
      <p className="muted">A lead is a possible sale. Move it through stages until it is won or lost.</p>

      <form className="panel inline-form" onSubmit={add}>
        <select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} required>
          <option value="">Select customer</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input placeholder="Lead title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <input placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <input type="date" value={form.follow_up_date} onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })} />
        <button>Add lead</button>
      </form>

      <div className="row-between">
        <span className="muted">{leads.length} lead(s)</span>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All stages</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="table-wrap">
        <table>
          <thead><tr><th>Customer</th><th>Lead</th><th>Notes</th><th>Follow-up</th><th>Stage</th></tr></thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id}>
                <td>{l.customer_name}</td>
                <td>{l.title}</td>
                <td>{l.notes || "-"}</td>
                <td>{l.follow_up_date ? l.follow_up_date.slice(0, 10) : "-"}</td>
                <td>
                  <select value={l.status} onChange={(e) => changeStatus(l.id, e.target.value)}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
