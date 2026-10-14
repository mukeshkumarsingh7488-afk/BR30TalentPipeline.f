import { useCallback, useEffect, useState } from "react";
import { Activity, Search, RefreshCw, Bell, UserRound, BriefcaseBusiness, CalendarDays, FileText, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { getActivities } from "../../api/activity.api.js";

const unwrap = (r) => r?.data?.data ?? r?.data ?? r;
const listFrom = (r) => {
  const d = unwrap(r);
  return Array.isArray(d) ? d : Array.isArray(d?.items) ? d.items : [];
};
const dateText = (v) => (v ? new Date(v).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—");
const iconFor = (type) => (type === "application" ? FileText : type === "candidate" ? UserRound : type === "interview" ? CalendarDays : type === "job_role" ? BriefcaseBusiness : type === "department" ? Building2 : Activity);
const targetFor = (item) =>
  item.entityType === "application" && item.entityId
    ? `/applications/${item.entityId}`
    : item.entityType === "interview"
      ? "/interviews"
      : item.entityType === "candidate" && item.entityId
        ? `/candidates/${item.entityId}`
        : item.entityType === "job_role"
          ? "/job-roles"
          : item.entityType === "department"
            ? "/departments"
            : null;

export default function ActivityLog() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(listFrom(await getActivities({ page: 1, limit: 100, search: search.trim(), entityType })));
    } catch (e) {
      setError(e?.message || "Unable to load activities.");
    } finally {
      setLoading(false);
    }
  }, [search, entityType]);
  useEffect(() => {
    load();
  }, [load]);
  return (
    <div className="tp-page">
      <style>{`.tp-page{padding:26px;color:var(--text);min-width:0}.tp-page h1{font-size:25px;font-weight:650;margin:0 0 6px}.tp-muted{color:var(--muted);font-size:13px}.al-toolbar{display:flex;gap:9px;flex-wrap:wrap;margin:18px 0}.al-search{display:flex;align-items:center;gap:8px;flex:1;min-width:220px;padding:0 11px;border:1px solid var(--border);border-radius:9px;background:var(--surface);color:var(--muted)}.al-search input{height:40px;flex:1;min-width:0;border:0;outline:0;background:transparent;color:var(--text);font:inherit}.al-select,.al-btn{height:42px;padding:0 12px;border:1px solid var(--border);border-radius:9px;background:var(--surface);color:var(--text)}.al-btn{display:inline-flex;align-items:center;gap:7px;cursor:pointer}.al-list{display:grid;gap:9px}.al-item{display:flex;align-items:flex-start;gap:12px;padding:15px;border:1px solid var(--border);border-radius:11px;background:var(--surface)}.al-icon{width:38px;height:38px;flex:0 0 38px;display:grid;place-items:center;border-radius:10px;background:var(--surface-secondary,#f0efff);color:var(--primary,#5145e5)}.al-copy{flex:1;min-width:0}.al-desc{font-size:13px;line-height:1.55;overflow-wrap:anywhere}.al-meta{display:flex;gap:10px;flex-wrap:wrap;margin-top:5px;color:var(--muted);font-size:11px}.al-link{color:var(--primary,#5145e5);text-decoration:none;font-size:12px;white-space:nowrap}.al-empty{padding:32px;text-align:center;border:1px solid var(--border);border-radius:11px;color:var(--muted)}@media(max-width:600px){.tp-page{padding:18px 12px}.al-item{padding:12px}.al-link{display:none}}`}</style>
      <h1>
        <Activity size={23} style={{ verticalAlign: "-4px", marginRight: 9 }} />
        Activity Log
      </h1>
      <p className="tp-muted">Track applications, interviews, job roles, departments and other recruitment actions.</p>
      <div className="al-toolbar">
        <label className="al-search">
          <Search size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search activity..." />
        </label>
        <select className="al-select" value={entityType} onChange={(e) => setEntityType(e.target.value)}>
          <option value="all">All activity</option>
          <option value="application">Applications</option>
          <option value="candidate">Candidates</option>
          <option value="interview">Interviews</option>
          <option value="job_role">Job roles</option>
          <option value="department">Departments</option>
        </select>
        <button className="al-btn" onClick={load} disabled={loading}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>
      {error && <div className="al-empty">{error}</div>}
      {loading ? (
        <div className="al-empty">Loading activity…</div>
      ) : items.length ? (
        <div className="al-list">
          {items.map((item) => {
            const Icon = iconFor(item.entityType);
            const target = targetFor(item);
            return (
              <article className="al-item" key={item._id}>
                <div className="al-icon">
                  <Icon size={18} />
                </div>
                <div className="al-copy">
                  <div className="al-desc">{item.description}</div>
                  <div className="al-meta">
                    <span>{item.actorId?.name || (item.action === "application_submitted" ? "Candidate" : "System")}</span>
                    <span>{dateText(item.createdAt)}</span>
                    <span>{String(item.entityType || "activity").replace("_", " ")}</span>
                  </div>
                </div>
                {target && (
                  <Link className="al-link" to={target}>
                    View →
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="al-empty">
          <Bell size={22} />
          <p>No activity found.</p>
          <span>New events will appear here after users submit applications or perform actions.</span>
        </div>
      )}
    </div>
  );
}
