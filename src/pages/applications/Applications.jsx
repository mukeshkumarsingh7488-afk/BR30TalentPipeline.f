import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { RefreshCw, Search, X, Eye } from "lucide-react";
import { getApplications } from "../../api/application.api.js";

const unwrap = (r) => r?.data?.data ?? r?.data ?? r;
const dateText = (v) => (v ? new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");
export default function Applications() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("search") || "");
  const [status, setStatus] = useState(params.get("status") || "all");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function load() {
    setLoading(true);
    setError("");
    try {
      const r = await getApplications({ page: 1, limit: 100, search: search.trim(), status });
      const d = unwrap(r);
      setRows(Array.isArray(d) ? d : d?.applications || d?.items || []);
    } catch (e) {
      setError(e.message || "Unable to load applications.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [search, status]);
  useEffect(() => {
    setParams(
      (old) => {
        const next = new URLSearchParams(old);
        search ? next.set("search", search) : next.delete("search");
        status !== "all" ? next.set("status", status) : next.delete("status");
        return next;
      },
      { replace: true }
    );
  }, [search, status]);
  return (
    <div className="tp-page">
      <style>{`.tp-page{--bg:#f5f7fb;--surface:#fff;--surface-2:#f8fafc;--text:#182230;--muted:#657286;--border:#e2e8f0;--input-bg:#fff;--primary:#5847e8;padding:24px;color:var(--text);background:var(--bg);min-width:0;min-height:100%;box-sizing:border-box}
:is(html[data-theme="dark"],body[data-theme="dark"],html.dark,body.dark,[data-theme="dark"],.dark) .tp-page{--bg:#0f1420;--surface:#191f2e;--surface-2:#20283a;--text:#eef2ff;--muted:#a2abc3;--border:#2b3449;--input-bg:#191f2e;--primary:#8b7cff;color:var(--text);background:var(--bg);color-scheme:dark}.tp-page-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:20px}.tp-page h1{font-size:25px;font-weight:650;margin:0 0 6px}.tp-page p{color:var(--muted);font-size:13px}.tp-panel{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:18px;min-width:0}.tp-toolbar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:15px}.tp-input,.tp-select{min-height:40px;border:1px solid var(--border);border-radius:8px;padding:9px 11px;background:var(--input-bg);color:var(--text);min-width:0}.tp-search-box{display:flex;align-items:center;gap:8px;flex:1;min-width:200px;min-height:40px;padding:0 10px;border:1px solid var(--border);border-radius:8px;background:var(--input-bg);color:var(--muted);box-sizing:border-box}.tp-search-box:focus-within{outline:2px solid var(--primary);outline-offset:1px}.tp-search-box>svg{flex-shrink:0}.tp-search-input{flex:1;width:100%;min-width:0;min-height:38px;padding:8px 0;border:0;outline:none;background:transparent;color:var(--text);font:inherit;box-sizing:border-box}.tp-search-input:focus{outline:none}.tp-search-clear{display:flex;align-items:center;justify-content:center;flex-shrink:0;width:26px;height:26px;padding:0;border:0;border-radius:5px;background:transparent;color:var(--muted);cursor:pointer}.tp-search-clear:hover{background:var(--surface-2);color:var(--text)}.tp-select{min-width:150px}.tp-table-wrap{width:100%;overflow-x:auto;border:1px solid var(--border);border-radius:9px}.tp-table{width:100%;border-collapse:collapse;min-width:760px;background:var(--surface);color:var(--text)}.tp-table th,.tp-table td{padding:12px 13px;border-bottom:1px solid var(--border);text-align:left;font-size:12px;white-space:nowrap}.tp-table th{background:var(--surface-2);font-weight:600;color:var(--muted)}.tp-table tr:last-child td{border-bottom:0}.tp-link{display:inline-flex;align-items:center;gap:6px;color:var(--text);text-decoration:none;font-weight:550}.tp-link:hover{text-decoration:underline}.tp-badge{display:inline-flex;border:1px solid var(--border);border-radius:20px;padding:4px 8px;background:var(--bg);font-size:11px;text-transform:capitalize}.tp-error{padding:12px;border:1px solid #e6aaaa;background:#fff6f6;color:#a02020;border-radius:8px}.tp-toolbar label{color:var(--muted)}.tp-toolbar label svg{flex-shrink:0}.tp-toolbar .tp-input:focus,.tp-toolbar .tp-select:focus{outline:2px solid var(--primary);outline-offset:1px}.tp-muted{color:var(--muted)}.tp-action{display:inline-flex;align-items:center;gap:7px;min-height:38px;padding:8px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--text);cursor:pointer}@media(max-width:640px){.tp-page{padding:17px 12px}.tp-page-head{flex-direction:column}.tp-page h1{font-size:22px}.tp-panel{padding:12px}}`}</style>
      <div className="tp-page-head">
        <div>
          <h1>Applications</h1>
          <p>Review applicants and track each application through recruitment.</p>
        </div>
        <button className="tp-action" onClick={load}>
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>
      <section className="tp-panel">
        <div className="tp-toolbar">
          <div className="tp-search-box">
            <Search size={16} />
            <input className="tp-search-input" type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search candidate, email or phone" aria-label="Search applications" />
            {search && (
              <button type="button" className="tp-search-clear" onClick={() => setSearch("")} aria-label="Clear search" title="Clear search">
                <X size={16} />
              </button>
            )}
          </div>

          <select className="tp-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            {["all", "applied", "screening", "shortlisted", "interview", "offered", "hired", "rejected", "withdrawn"].map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All statuses" : s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
        {error && <div className="tp-error">{error}</div>}
        {loading ? (
          <p>Loading applications…</p>
        ) : (
          <div className="tp-table-wrap">
            <table className="tp-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Applied</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a._id}>
                    <td>
                      <strong>{a.candidateId?.fullName || "Candidate"}</strong>
                      <br />
                      <span className="tp-muted">{a.candidateId?.email || "—"}</span>
                    </td>
                    <td>{a.jobRoleId?.title || "—"}</td>
                    <td>{a.departmentId?.name || "—"}</td>
                    <td>
                      <span className="tp-badge">{a.status || "applied"}</span>
                    </td>
                    <td>{dateText(a.submittedAt || a.createdAt)}</td>
                    <td>
                      <Link className="tp-link" to={`/applications/${a._id}`}>
                        <Eye size={15} />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: 28 }}>
                      No applications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
