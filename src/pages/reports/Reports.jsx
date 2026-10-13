import { useCallback, useEffect, useState } from "react";
import { Download, RefreshCw, FileBarChart } from "lucide-react";
import { getDashboardOverview, getApplicationAnalytics, exportApplicationsCsv } from "../../api/dashboard.api.js";
const unwrap = (r) => r?.data?.data ?? r?.data ?? r ?? {};
const n = (v) => new Intl.NumberFormat("en-IN").format(Number(v) || 0);
export default function Reports() {
  const [data, setData] = useState(null),
    [analytics, setAnalytics] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [exporting, setExporting] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [a, b] = await Promise.all([getDashboardOverview(), getApplicationAnalytics()]);
      setData(unwrap(a));
      setAnalytics(unwrap(b));
    } catch (e) {
      setError(e.message || "Unable to load reports.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  async function exportCsv() {
    setExporting(true);
    setError("");
    try {
      await exportApplicationsCsv();
    } catch (e) {
      setError(e.message || "CSV export failed.");
    } finally {
      setExporting(false);
    }
  }
  const totals = data?.totals || {},
    statuses = data?.applicationsByStatus || analytics?.applicationsByStatus || analytics?.byStatus || {};
  return (
    <div className="tp-page">
      <style>{`.tp-page{--bg:#f5f7fb;--surface:#fff;--surface-2:#f8fafc;--text:#182230;--muted:#657286;--border:#e2e8f0;--input-bg:#fff;--primary:#5847e8;padding:24px;color:var(--text);background:var(--bg);min-width:0;min-height:100%;box-sizing:border-box}
        :is(html[data-theme="dark"],body[data-theme="dark"],html.dark,body.dark,[data-theme="dark"],.dark) .tp-page{--bg:#0f1420;--surface:#191f2e;--surface-2:#20283a;--text:#eef2ff;--muted:#a2abc3;--border:#2b3449;--input-bg:#191f2e;--primary:#8b7cff;color:var(--text);background:var(--bg);color-scheme:dark}.tp-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:24px}.tp-head h1{font-size:25px;font-weight:650;margin:0 0 6px}.tp-muted{color:var(--muted);font-size:13px}.tp-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:38px;padding:8px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--text);cursor:pointer}.tp-stat-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:22px}.tp-stat{min-width:0;border:1px solid var(--border);border-radius:12px;background:var(--surface);padding:17px;box-shadow:0 1px 2px #00000006}.tp-stat-label{color:var(--muted);font-size:12px}.tp-stat-value{font-size:26px;line-height:1.25;font-weight:650;margin-top:9px;color:var(--text)}.tp-panel{border:1px solid var(--border);border-radius:12px;background:var(--surface);padding:20px}.tp-panel h2{font-size:16px;font-weight:600;margin:0 0 16px}.tp-status-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.tp-status{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);font-size:13px}.tp-status strong{font-size:14px}.tp-error{padding:12px;border:1px solid #e4b4b4;background:#fff6f6;color:#982828;border-radius:8px;margin-bottom:14px}@media(max-width:850px){.tp-stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:600px){.tp-page{padding:17px 12px}.tp-head{flex-direction:column}.tp-head h1{font-size:22px}.tp-stat-grid{gap:9px}.tp-stat{padding:12px}.tp-stat-value{font-size:22px}.tp-panel{padding:13px}.tp-status-grid{grid-template-columns:1fr}}`}</style>
      <header className="tp-head">
        <div>
          <h1>Reports</h1>
          <p className="tp-muted">Live recruitment metrics from the BR30 Talent Pipeline backend.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="tp-btn" onClick={load} disabled={loading}>
            <RefreshCw size={15} />
            Refresh
          </button>
          <button className="tp-btn" onClick={exportCsv} disabled={exporting}>
            <Download size={15} />
            {exporting ? "Exporting…" : "Export applications CSV"}
          </button>
        </div>
      </header>
      {error && <div className="tp-error">{error}</div>}
      {loading && !data ? (
        <p>Loading report data…</p>
      ) : (
        <>
          <section className="tp-stat-grid">
            {[
              ["Applications", totals.applications],
              ["Candidates", totals.candidates],
              ["Active job roles", totals.activeJobRoles],
              ["Active departments", totals.activeDepartments],
            ].map(([label, value]) => (
              <article className="tp-stat" key={label}>
                <div className="tp-stat-label">{label}</div>
                <div className="tp-stat-value">{n(value)}</div>
              </article>
            ))}
          </section>
          <section className="tp-panel">
            <h2>
              <FileBarChart size={17} style={{ verticalAlign: "middle", marginRight: 8 }} />
              Applications by status
            </h2>
            <div className="tp-status-grid">
              {["applied", "screening", "shortlisted", "interview", "offered", "hired", "rejected", "withdrawn"].map((key) => (
                <div className="tp-status" key={key}>
                  <span style={{ textTransform: "capitalize" }}>{key}</span>
                  <strong>{n(statuses[key])}</strong>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
