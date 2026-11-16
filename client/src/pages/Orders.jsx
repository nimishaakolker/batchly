import { useEffect, useState } from "react";
import { api, money } from "../api.js";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState([{ item_id: "", quantity: 1 }]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadOrders = () => api("/orders").then(setOrders).catch((e) => setError(e.message));
  const loadItems = () => api("/items").then(setItems).catch(() => {});

  useEffect(() => {
    loadOrders();
    loadItems();
    api("/customers").then(setCustomers).catch(() => {});
  }, []);

  const priceOf = (id) => Number(items.find((i) => i.id === Number(id))?.price || 0);
  const total = lines.reduce((sum, l) => sum + priceOf(l.item_id) * Number(l.quantity || 0), 0);

  function updateLine(index, patch) {
    setLines(lines.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const res = await api("/orders", {
        method: "POST",
        body: {
          customer_id: Number(customerId),
          lines: lines.map((l) => ({ item_id: Number(l.item_id), quantity: Number(l.quantity) })),
        },
      });
      setSuccess(`Order #${res.id} placed for ${money(res.total)}. Stock updated.`);
      setLines([{ item_id: "", quantity: 1 }]);
      setCustomerId("");
      loadOrders();
      loadItems();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <h2>Orders</h2>
      <p className="muted">Placing an order saves it and reduces stock in one step.</p>

      <form className="panel" onSubmit={submit}>
        <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
          <option value="">Select customer</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {lines.map((l, index) => (
          <div className="line" key={index}>
            <select value={l.item_id} onChange={(e) => updateLine(index, { item_id: e.target.value })} required>
              <option value="">Select product</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>{i.name} ({i.stock} {i.unit} left)</option>
              ))}
            </select>
            <input type="number" min="1" value={l.quantity} onChange={(e) => updateLine(index, { quantity: e.target.value })} />
            <span>{money(priceOf(l.item_id) * Number(l.quantity || 0))}</span>
            {lines.length > 1 && (
              <button type="button" className="ghost" onClick={() => setLines(lines.filter((_, i) => i !== index))}>
                Remove
              </button>
            )}
          </div>
        ))}

        <div className="row-between">
          <button type="button" className="ghost" onClick={() => setLines([...lines, { item_id: "", quantity: 1 }])}>
            + Add product
          </button>
          <strong>Total: {money(total)}</strong>
        </div>
        <button>Place order</button>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
      </form>

      <h3>Past orders</h3>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Date</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>#{o.id}</td>
                <td>{o.customer_name}</td>
                <td>{money(o.total)}</td>
                <td>{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
