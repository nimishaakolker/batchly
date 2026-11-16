import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [error, setError] = useState("");

  const load = () => api("/customers").then(setCustomers).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault();
    setError("");
    try {
      await api("/customers", { method: "POST", body: form });
      setForm({ name: "", phone: "", email: "" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <h2>Customers</h2>
      <p className="muted">Businesses that buy from the company. They never log in.</p>

      <form className="panel inline-form" onSubmit={add}>
        <input placeholder="Business name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <button>Add customer</button>
      </form>
      {error && <p className="error">{error}</p>}

      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Phone</th><th>Email</th></tr></thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}><td>{c.name}</td><td>{c.phone || "-"}</td><td>{c.email || "-"}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
