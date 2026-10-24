import { CarFront, LogOut, ShieldCheck } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <NavLink to="/vehicles" className="brand">
            <span className="brand-mark">
              <CarFront size={23} />
            </span>
            <span>
              TORQUE<span className="brand-dot">.</span>
            </span>
          </NavLink>
          <nav className="header-nav">
            <NavLink
              to="/vehicles"
              className={({ isActive }) => (isActive ? "nav-active" : "")}
            >
              Explore cars
            </NavLink>
            {user?.role === "ADMIN" && (
              <NavLink
                to="/admin"
                className={({ isActive }) => (isActive ? "nav-active" : "")}
              >
                <ShieldCheck size={16} /> Admin
              </NavLink>
            )}
          </nav>
          <div className="header-user">
            <span className="user-avatar">
              {user?.name?.[0]?.toUpperCase()}
            </span>
            <span className="header-name">{user?.name}</span>
            <button onClick={logout} className="logout-button" title="Log out">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
      <Outlet />
      <footer className="site-footer">
        <span className="brand footer-brand">
          TORQUE<span className="brand-dot">.</span>
        </span>
        <span>Your next journey begins here.</span>
        <span>© {new Date().getFullYear()} Torque Motors</span>
      </footer>
    </div>
  );
}
