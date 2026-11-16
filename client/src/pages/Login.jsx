import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@demo.com");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-box" onSubmit={submit}>
        <h1>Batchly</h1>
        <p className="muted">Internal operations for a food-ingredient company</p>
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} />
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="error">{error}</p>}
        <button disabled={loading}>{loading ? "Logging in..." : "Log in"}</button>
        <div className="demo">
          <p className="muted">Demo accounts (password demo1234)</p>
          <button type="button" className="ghost" onClick={() => setEmail("admin@demo.com")}>
            Admin
          </button>{" "}
          <button type="button" className="ghost" onClick={() => setEmail("sales@demo.com")}>
            Sales
          </button>
        </div>
      </form>
    </div>
  );
}
