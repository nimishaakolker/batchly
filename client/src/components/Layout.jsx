import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";

const links = [
  ["/", "Dashboard"],
  ["/leads", "Leads"],
  ["/customers", "Customers"],
  ["/inventory", "Inventory"],
  ["/orders", "Orders"],
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="shell">
      <aside className="sidebar">
        <h1>Batchly</h1>
        <nav>
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === "/"}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="user">
          <div>{user.name}</div>
          <small>{user.role}</small>
          <button
            className="ghost"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
