import { NavLink, Outlet, Link } from "react-router-dom";
import { useTheme } from "../../lib/theme";
import { getSession, logout } from "../../lib/auth";
import { useState } from "react";
import logoSvg from "../../assets/logo.svg";

const NAV_ITEMS = [
  { to: "/admin/forms", icon: "fa-solid fa-file-lines", label: "Forms" },
  { to: "/admin/inbox", icon: "fa-solid fa-inbox", label: "Inbox" },
  { to: "/admin/bugs", icon: "fa-solid fa-bug", label: "Bugs" },
  { to: "/admin/insights", icon: "fa-solid fa-chart-simple", label: "Insights" },
  { to: "/admin/settings", icon: "fa-solid fa-gear", label: "Settings" },
];

export default function AdminLayout() {
  const { dark, toggle } = useTheme();
  const [user] = useState(getSession());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="admin">
      <header className="admin-bar">
        <div className="admin-bar-left">
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <i className={`fa-solid ${sidebarOpen ? "fa-xmark" : "fa-bars"}`} />
          </button>
          <Link to="/admin" className="logo">
            <img src={logoSvg} alt="BugPilot" className="logo-icon" />
            <span>BugPilot</span>
            <span className="admin-tag">Admin</span>
          </Link>
        </div>
        <div className="admin-bar-right">
          <button
            className="icon-btn"
            onClick={toggle}
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {dark ? (
              <i className="fa-solid fa-sun"></i>
            ) : (
              <i className="fa-solid fa-moon"></i>
            )}
          </button>
          {user && (
            <div className="admin-user">
              <div className="admin-user-avatar">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <span className="admin-user-email">{user.email}</span>
            </div>
          )}
          <button className="btn btn-logout" onClick={handleLogout}>
            <i className="fa-solid fa-arrow-right-from-bracket" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

      <div className="admin-body">
        <aside className={`admin-side ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-header-mobile">
            <span className="sidebar-logo">
              <img src={logoSvg} alt="BugPilot" className="sidebar-logo-icon" />
              BugPilot
            </span>
            <button className="icon-btn" onClick={closeSidebar} aria-label="Close sidebar">
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="sidebar-header-desktop">
            <span className="sidebar-section-label">Navigation</span>
          </div>
          <nav className="sidebar-nav">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
                onClick={closeSidebar}
              >
                <i className={item.icon} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-footer">
            <div className="sidebar-footer-text">
              <i className="fa-solid fa-shield-halved" />
              <span>Admin Panel</span>
            </div>
          </div>
        </aside>

        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
