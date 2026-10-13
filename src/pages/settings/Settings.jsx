import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { Monitor, Sun, Moon, UserRound } from "lucide-react";
export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  return (
    <div className="tp-page">
      <style>{`.tp-page{padding:26px;color:var(--text);min-width:0}.tp-page h1{font-size:25px;font-weight:650;margin:0 0 6px}.tp-muted{color:var(--muted);font-size:13px}.tp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:22px}.tp-panel{border:1px solid var(--border);border-radius:12px;background:var(--surface);padding:20px;min-width:0}.tp-panel h2{font-size:16px;font-weight:600;margin:0 0 7px}.tp-theme-options{display:grid;gap:9px;margin-top:18px}.tp-theme-option{display:flex;align-items:center;gap:10px;width:100%;padding:12px;border:1px solid var(--border);border-radius:9px;background:var(--surface);color:var(--text);text-align:left;cursor:pointer}.tp-theme-option.active{border-color:var(--text);background:var(--bg)}.tp-theme-option span{margin-left:auto;font-size:11px;color:var(--muted)}.tp-detail{display:grid;grid-template-columns:110px minmax(0,1fr);gap:12px;padding:11px 0;border-bottom:1px solid var(--border);font-size:13px;overflow-wrap:anywhere}.tp-detail:last-child{border-bottom:0}.tp-label{color:var(--muted)}@media(max-width:650px){.tp-page{padding:17px 12px}.tp-grid{grid-template-columns:1fr}.tp-panel{padding:15px}}`}</style>
      <h1>Settings</h1>
      <p className="tp-muted">Manage your workspace appearance and account information.</p>
      <div className="tp-grid">
        <section className="tp-panel">
          <h2>Appearance</h2>
          <p className="tp-muted">Default theme is light. Choose a theme for the dashboard.</p>
          <div className="tp-theme-options">
            {[
              ["light", "Light", Sun],
              ["dark", "Dark", Moon],
              ["device", "Device preference", Monitor],
            ].map(([key, label, Icon]) => (
              <button key={key} className={`tp-theme-option ${theme === key ? "active" : ""}`} onClick={() => setTheme(key)}>
                <Icon size={17} />
                {label}
                {theme === key && <span>Selected</span>}
              </button>
            ))}
          </div>
          <p className="tp-muted" style={{ marginTop: 12 }}>
            Current appearance: {resolvedTheme}
          </p>
        </section>
        <section className="tp-panel">
          <h2>
            <UserRound size={17} style={{ verticalAlign: "middle", marginRight: 7 }} />
            Account information
          </h2>
          <div style={{ marginTop: 12 }}>
            <div className="tp-detail">
              <span className="tp-label">Name</span>
              <strong>{user?.name || user?.fullName || "—"}</strong>
            </div>
            <div className="tp-detail">
              <span className="tp-label">Email</span>
              <strong>{user?.email || "—"}</strong>
            </div>
            <div className="tp-detail">
              <span className="tp-label">Role</span>
              <strong>{user?.role || "—"}</strong>
            </div>
            <div className="tp-detail">
              <span className="tp-label">Account status</span>
              <strong>{user?.isActive === false ? "Inactive" : "Active"}</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
