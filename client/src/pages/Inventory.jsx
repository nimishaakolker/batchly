import { useEffect, useState } from "react";
import { api, money } from "../api.js";
import { useAuth } from "../auth.jsx";

const empty = { name: "", unit: "kg", price: "", stock: "", low_stock_threshold: "10" };

export default function Inventory() {
  const { user } = useAuth();
  const isAdmin = user.role === "admin";
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");

  const load = () => api("/items").then(setItems).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault();
    setError("");
    try {
      await api("/items", {
        method: "POST",
        body: {
          ...form,
          price: Number(form.price),
          stock: Number(form.stock || 0),
          low_stock_threshold: Number(form.low_stock_threshold || 10),
        },
      });
      setForm(empty);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function restock(item) {
    const qty = window.prompt(`Add how many ${item.unit} of ${item.name}?`);
    if (!qty) return;
    setError("");
    try {
      await api(`/items/${item.id}/restock`, { method: "POST", body: { quantity: Number(qty) } });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <h2>Inventory</h2>
      <p className="muted">Products in stock. Orders reduce stock automatically.</p>

      {isAdmin ? (
        <form className="panel inline-form" onSubmit={add}>
          <input placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input placeholder="Unit (kg, l, pcs)" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          <input type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          <input type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          <input type="number" placeholder="Low-stock limit" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} />
          <button>Add product</button>
        </form>
      ) : (
        <p className="muted">Only admins can add or restock products.</p>
      )}
      {error && <p className="error">{error}</p>}

      <div className="table-wrap">
        <table>
          <thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Status</th>{isAdmin && <th></th>}</tr></thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <td>{i.name}</td>
                <td>{money(i.price)} / {i.unit}</td>
                <td>{i.stock} {i.unit}</td>
                <td>{i.stock <= i.low_stock_threshold ? <span className="tag">LOW STOCK</span> : "OK"}</td>
                {isAdmin && <td><button className="ghost" onClick={() => restock(i)}>Restock</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
