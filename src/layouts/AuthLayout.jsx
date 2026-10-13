import { Outlet } from "react-router-dom";
import { useTheme } from "../context/ThemeContext.jsx";

export default function AuthLayout() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <main className="br30-auth-layout">
      <style>{`
.br30-auth-layout { position: fixed; inset: 0; width: 100%; height: 100vh; height: 100dvh; min-width: 320px; display: grid; grid-template-columns: minmax(0, 1fr) minmax(380px, 0.85fr); overflow-x: hidden; overflow-y: auto; background: var(--crm-bg, var(--bg, #f7f8fc)); color: var(--crm-text, var(--text, #202636)); font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 16px; font-weight: 400; }
.br30-auth-layout *, .br30-auth-layout *::before, .br30-auth-layout *::after { box-sizing: border-box; }
.br30-auth-brand-panel { position: relative; display: flex; flex-direction: column; justify-content: space-between; min-width: 0; min-height: 100%; overflow: hidden; padding: 48px clamp(28px, 5vw, 76px); background: var(--crm-primary, var(--primary, #4338ca)); color: #ffffff; }
.br30-auth-brand-panel::before, .br30-auth-brand-panel::after { position: absolute; content: ""; pointer-events: none; border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 50%; }
.br30-auth-brand-panel::before { width: 500px; height: 500px; right: -220px; top: 14%; }
.br30-auth-brand-panel::after { width: 360px; height: 360px; right: -150px; top: 23%; }
.br30-auth-brand-content, .br30-auth-brand-footer, .br30-auth-logo { position: relative; z-index: 1; }
.br30-auth-logo { display: inline-flex; align-items: center; gap: 12px; width: fit-content; color: #ffffff; text-decoration: none; }
.br30-auth-logo-mark { display: grid; width: 42px; height: 42px; flex: 0 0 42px; place-items: center; border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 12px; background: rgba(255, 255, 255, 0.12); font-size: 17px; font-weight: 400; letter-spacing: -0.5px; }
.br30-auth-logo-name { font-size: 17px; font-weight: 400; letter-spacing: 0.1px; }
.br30-auth-brand-content { position: relative; z-index: 1; max-width: 540px; margin: 50px 0; }
.br30-auth-eyebrow { display: inline-flex; align-items: center; gap: 8px; margin-bottom: 24px; padding: 8px 12px; border: 1px solid rgba(255, 255, 255, 0.24); border-radius: 999px; background: rgba(255, 255, 255, 0.1); font-size: 13px; font-weight: 400; }
.br30-auth-eyebrow-dot { width: 7px; height: 7px; flex: 0 0 7px; border-radius: 50%; background: #a7f3d0; }
.br30-auth-brand-title { margin: 0 0 20px; color: #ffffff; font-size: clamp(32px, 4vw, 52px); line-height: 1.18; letter-spacing: -1.5px; font-weight: 400; }
.br30-auth-brand-description { max-width: 460px; margin: 0; color: rgba(255, 255, 255, 0.82); font-size: 16px; line-height: 1.8; font-weight: 400; }
.br30-auth-feature-list { display: grid; gap: 18px; margin-top: 36px; }
.br30-auth-feature { display: flex; align-items: center; gap: 12px; color: rgba(255, 255, 255, 0.94); font-size: 14px; line-height: 1.5; font-weight: 400; }
.br30-auth-feature-icon { display: grid; flex: 0 0 30px; width: 30px; height: 30px; place-items: center; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 9px; background: rgba(255, 255, 255, 0.1); font-size: 15px; font-weight: 400; }
.br30-auth-brand-footer { position: relative; z-index: 1; color: rgba(255, 255, 255, 0.72); font-size: 13px; line-height: 1.7; font-weight: 400; }
.br30-auth-form-panel { display: flex; min-width: 0; min-height: 100%; flex-direction: column; align-items: center; justify-content: center; padding: 32px clamp(22px, 5vw, 72px); background: var(--crm-surface, var(--surface, #ffffff)); }
.br30-auth-form-topbar { display: flex; width: 100%; max-width: 440px; align-items: center; justify-content: flex-end; margin-bottom: 28px; }
.br30-auth-theme-control { display: flex; align-items: center; gap: 8px; }
.br30-auth-theme-label { color: var(--crm-muted, var(--muted, #697386)); font-size: 12px; font-weight: 400; }
.br30-auth-theme-select { min-height: 36px; max-width: 125px; padding: 7px 28px 7px 10px; border: 1px solid var(--crm-border, var(--border, #e1e5ec)); border-radius: 9px; background: var(--crm-surface, var(--surface, #ffffff)); color: var(--crm-text, var(--text, #202636)); font-family: inherit; font-size: 13px; font-weight: 400; cursor: pointer; outline-offset: 3px; }
.br30-auth-outlet { width: 100%; max-width: 440px; min-width: 0; }
.br30-auth-mobile-brand { display: none; }
.br30-auth-logo-mark { display: block; width: 42px; height: 42px; flex: 0 0 42px; object-fit: contain; border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 12px; background: rgba(255, 255, 255, 0.12); padding: 4px; }
@media (max-width: 1100px) {
.br30-auth-layout { grid-template-columns: minmax(0, 1fr) minmax(360px, 0.95fr); }
.br30-auth-brand-panel { padding: 36px 30px; }
.br30-auth-brand-title { font-size: clamp(32px, 3.5vw, 42px); letter-spacing: -0.8px; }
.br30-auth-form-panel { padding: 28px 24px; }
}
@media (max-height: 720px) and (min-width: 701px) {
.br30-auth-layout { overflow-y: auto; }
.br30-auth-brand-panel { justify-content: flex-start; gap: 35px; padding-top: 28px; padding-bottom: 28px; }
.br30-auth-brand-content { margin: 15px 0; }
.br30-auth-brand-title { font-size: 34px; }
.br30-auth-feature-list { gap: 12px; margin-top: 22px; }
.br30-auth-form-panel { justify-content: flex-start; }
}
@media (max-width: 700px) {
.br30-auth-layout { position: fixed; inset: 0; display: flex; width: 100%; height: 100vh; height: 100dvh; min-height: 0; flex-direction: column; overflow-x: hidden; overflow-y: auto; }
.br30-auth-brand-panel { display: none; }
.br30-auth-form-panel { flex: 1 0 auto; width: 100%; min-height: 100%; justify-content: flex-start; padding: 24px 20px 32px; }
.br30-auth-mobile-brand { display: flex; align-items: center; gap: 10px; width: 100%; max-width: 440px; margin-bottom: 32px; color: var(--crm-text, var(--text, #202636)); font-size: 16px; font-weight: 400; }
.br30-auth-mobile-logo-mark { display: grid; width: 38px; height: 38px; flex: 0 0 38px; place-items: center; border-radius: 11px; background: var(--crm-primary, var(--primary, #4338ca)); color: #ffffff; font-size: 15px; font-weight: 400; }
.br30-auth-form-topbar { margin-bottom: 24px; }
}
@media (max-width: 380px) {
.br30-auth-form-panel { padding-right: 16px; padding-left: 16px; }
.br30-auth-theme-label { display: none; }
}
@media (prefers-reduced-motion: reduce) {
.br30-auth-layout *, .br30-auth-layout *::before, .br30-auth-layout *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
`}</style>

      <section className="br30-auth-brand-panel">
        <a className="br30-auth-logo" href="/" aria-label="BR30 Talent Pipeline">
          <img className="br30-auth-logo-mark" src="/favicon-32x32.png" alt="" width="42" height="42" />
          <span className="br30-auth-logo-name">BR30 Talent Pipeline</span>
        </a>

        <div className="br30-auth-brand-content">
          <div className="br30-auth-eyebrow">
            <span className="br30-auth-eyebrow-dot" />
            HR recruitment workspace
          </div>

          <h1 className="br30-auth-brand-title">
            Find the right people.
            <br />
            Build the right team.
          </h1>

          <p className="br30-auth-brand-description">Manage candidates, track applications, and organize your recruitment workflow from one focused workspace.</p>

          <div className="br30-auth-feature-list">
            <div className="br30-auth-feature">
              <span className="br30-auth-feature-icon">✓</span>
              <span>Keep candidate information organized.</span>
            </div>

            <div className="br30-auth-feature">
              <span className="br30-auth-feature-icon">↗</span>
              <span>Track applications through every stage.</span>
            </div>

            <div className="br30-auth-feature">
              <span className="br30-auth-feature-icon">⌘</span>
              <span>Manage hiring activity in one place.</span>
            </div>
          </div>
        </div>

        <footer className="br30-auth-brand-footer">
          BR30 Talent Pipeline
          <br />A dedicated workspace for recruitment teams.
        </footer>
      </section>

      <section className="br30-auth-form-panel">
        <div className="br30-auth-mobile-brand">
          <span className="br30-auth-mobile-logo-mark">B30</span>
          <span>BR30 Talent Pipeline</span>
        </div>

        <div className="br30-auth-form-topbar">
          <label className="br30-auth-theme-control">
            <span className="br30-auth-theme-label">Appearance</span>
            <select className="br30-auth-theme-select" aria-label="Choose appearance" value={theme} onChange={(event) => setTheme(event.target.value)}>
              <option value="device">Device</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
        </div>

        <div className="br30-auth-outlet" data-theme={resolvedTheme}>
          <Outlet />
        </div>
      </section>
    </main>
  );
}
