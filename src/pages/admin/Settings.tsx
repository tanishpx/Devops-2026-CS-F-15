import { useState } from "react";
import { getSession, logout } from "../../lib/auth";
import { useTheme } from "../../lib/theme";

const ADMIN_EMAILS = [
  { email: "Tanish4181@gmail.com", role: "Primary Administrator", name: "Tanish" },
  { email: "sajalsinghal62650@gmail.com", role: "Administrator", name: "Sajal Singhal" },
];

export default function Settings() {
  const { dark, toggle } = useTheme();
  const sessionUser = getSession();
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const currentUserEmail = sessionUser?.email || "Tanish4181@gmail.com";

  const handleCopy = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleSignOut = async () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      await logout();
      window.location.href = "/#/auth";
    }
  };

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Settings</h1>
          <p>Manage your profile, administrators, theme, and session.</p>
        </div>
      </div>

      <div className="st-container">
        {/* Profile */}
        <div className="st-card">
          <div className="st-card-header">
            <div className="st-card-icon">
              <i className="fa-solid fa-circle-user" />
            </div>
            <div>
              <h3>Your Profile</h3>
              <p className="st-card-desc">Current session details</p>
            </div>
            <span className="st-badge st-badge-active">Active</span>
          </div>

          <div className="st-profile">
            <div className="st-avatar">{currentUserEmail.charAt(0).toUpperCase()}</div>
            <div className="st-profile-info">
              <span className="st-label">Email</span>
              <div className="st-row">
                <strong>{currentUserEmail}</strong>
                <button type="button" className="st-copy" onClick={() => handleCopy(currentUserEmail)}>
                  {copiedEmail === currentUserEmail ? "Copied" : "Copy"}
                </button>
              </div>
              <span className="st-role">
                <i className="fa-solid fa-shield-halved" /> Administrator
              </span>
            </div>
          </div>
        </div>

        {/* Administrators */}
        <div className="st-card">
          <div className="st-card-header">
            <div className="st-card-icon">
              <i className="fa-solid fa-users-gear" />
            </div>
            <div>
              <h3>Administrators</h3>
              <p className="st-card-desc">Accounts with full access</p>
            </div>
            <span className="st-badge">{ADMIN_EMAILS.length}</span>
          </div>

          <div className="st-admin-list">
            {ADMIN_EMAILS.map((admin) => (
              <div key={admin.email} className="st-admin-item">
                <div className="st-admin-avatar">
                  <i className="fa-solid fa-user-shield" />
                </div>
                <div className="st-admin-info">
                  <div className="st-admin-top">
                    <h4>{admin.name}</h4>
                    <span className="st-role-badge">{admin.role}</span>
                  </div>
                  <div className="st-row">
                    <code className="st-email-code">{admin.email}</code>
                    <button type="button" className="st-copy" onClick={() => handleCopy(admin.email)}>
                      {copiedEmail === admin.email ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div className="st-card">
          <div className="st-card-header">
            <div className="st-card-icon">
              <i className="fa-solid fa-circle-half-stroke" />
            </div>
            <div>
              <h3>Appearance</h3>
              <p className="st-card-desc">Switch between light and dark mode</p>
            </div>
            <span className="st-badge">{dark ? "Dark" : "Light"}</span>
          </div>

          <div className="st-theme-row">
            <button
              type="button"
              className={`st-theme-btn ${!dark ? "active" : ""}`}
              onClick={() => { if (dark) toggle(); }}
            >
              <div className="st-theme-icon light">
                <i className="fa-solid fa-sun" />
              </div>
              <div className="st-theme-text">
                <strong>Light</strong>
                <small>Clean, high-contrast</small>
              </div>
              {!dark && <i className="fa-solid fa-circle-check st-check" />}
            </button>

            <button
              type="button"
              className={`st-theme-btn ${dark ? "active" : ""}`}
              onClick={() => { if (!dark) toggle(); }}
            >
              <div className="st-theme-icon dark">
                <i className="fa-solid fa-moon" />
              </div>
              <div className="st-theme-text">
                <strong>Dark</strong>
                <small>Easy on the eyes</small>
              </div>
              {dark && <i className="fa-solid fa-circle-check st-check" />}
            </button>
          </div>
        </div>

        {/* Sign Out */}
        <div className="st-card st-card-danger">
          <div className="st-card-header">
            <div className="st-card-icon danger">
              <i className="fa-solid fa-arrow-right-from-bracket" />
            </div>
            <div>
              <h3>Sign Out</h3>
              <p className="st-card-desc">Disconnect from your current session</p>
            </div>
          </div>

          <div className="st-signout-row">
            <p>Safely exit your account on this browser.</p>
            <button type="button" className="st-signout-btn" onClick={handleSignOut}>
              <i className="fa-solid fa-right-from-bracket" /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
