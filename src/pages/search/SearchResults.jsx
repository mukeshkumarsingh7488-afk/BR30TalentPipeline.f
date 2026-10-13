import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, BriefcaseBusiness, Users, FileText } from "lucide-react";
import { getCandidates } from "../../api/candidate.api.js";
import { getJobRoles } from "../../api/job-role.api.js";
import { getApplications } from "../../api/application.api.js";
const unwrap = (r) => r?.data?.data ?? r?.data ?? r;
const arr = (d, key) => (Array.isArray(d) ? d : d?.[key] || d?.items || []);
export default function SearchResults() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const [results, setResults] = useState({ candidates: [], roles: [], applications: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    if (!q.trim()) {
      setResults({ candidates: [], roles: [], applications: [] });
      return;
    }
    setLoading(true);
    setError("");
    Promise.allSettled([getCandidates({ page: 1, limit: 10, search: q }), getJobRoles({ page: 1, limit: 10, search: q, status: "all" }), getApplications({ page: 1, limit: 10, search: q, status: "all" })])
      .then((rs) => {
        if (!live) return;
        const next = { candidates: [], roles: [], applications: [] };
        rs.forEach((r, i) => {
          if (r.status === "fulfilled") next[["candidates", "roles", "applications"][i]] = arr(unwrap(r.value), ["candidates", "jobRoles", "applications"][i]);
        });
        if (rs.every((r) => r.status === "rejected")) setError(rs[0].reason?.message || "Search failed.");
        setResults(next);
      })
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [q]);
  return (
    <div className="tp-page">
      <style>{`.tp-page{padding:26px;color:var(--text);min-width:0}.tp-page h1{font-size:25px;font-weight:650;margin:0 0 6px}.tp-muted{color:var(--muted);font-size:13px}.tp-search-form{display:flex;gap:8px;margin:18px 0}.tp-search-form input{flex:1;min-width:0;padding:11px;border:1px solid var(--border);border-radius:8px;background:var(--input-bg);color:var(--text)}.tp-btn{display:inline-flex;align-items:center;gap:7px;padding:9px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--text);cursor:pointer}.tp-results{display:grid;gap:14px}.tp-panel{padding:18px;border:1px solid var(--border);border-radius:12px;background:var(--surface)}.tp-panel h2{font-size:15px;font-weight:600;margin:0 0 12px}.tp-result{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:11px 0;border-top:1px solid var(--border);text-decoration:none}.tp-result:first-of-type{border-top:0}.tp-result small{display:block;color:var(--muted);margin-top:4px}.tp-error{padding:12px;border:1px solid #e6b5b5;color:#972222;background:#fff7f7;border-radius:8px}@media(max-width:600px){.tp-page{padding:17px 12px}.tp-panel{padding:13px}.tp-page h1{font-size:22px}}`}</style>
      <h1>Search</h1>
      <p className="tp-muted">Search candidates, job roles and applications from your workspace.</p>
      <form
        className="tp-search-form"
        onSubmit={(e) => {
          e.preventDefault();
          const value = new FormData(e.currentTarget).get("q");
          setParams(value ? { q: String(value) } : {});
        }}>
        <input name="q" defaultValue={q} placeholder="Search candidates, jobs, applications…" />
        <button className="tp-btn">
          <Search size={15} />
          Search
        </button>
      </form>
      {error && <div className="tp-error">{error}</div>}
      {loading ? (
        <p>Searching…</p>
      ) : (
        <div className="tp-results">
          {[
            ["Candidates", Users, results.candidates, (x) => x.fullName || x.name, (x) => x.email, (x) => `/candidates/${x._id}`],
            ["Job roles", BriefcaseBusiness, results.roles, (x) => x.title, (x) => x.departmentId?.name || x.department?.name, (x) => `/job-roles?search=${encodeURIComponent(q)}`],
            ["Applications", FileText, results.applications, (x) => x.candidateId?.fullName || x.fullName || "Application", (x) => x.jobRoleId?.title || x.candidateId?.email, (x) => `/applications/${x._id}`],
          ].map(([title, Icon, items, label, sub, href]) => (
            <section className="tp-panel" key={title}>
              <h2>
                <Icon size={16} style={{ verticalAlign: "middle", marginRight: 8 }} />
                {title} ({items.length})
              </h2>
              {items.map((x, i) => (
                <Link className="tp-result" key={x._id || i} to={href(x)}>
                  <span>
                    <strong>{label(x)}</strong>
                    <small>{sub(x) || ""}</small>
                  </span>
                  <span>View →</span>
                </Link>
              ))}
              {!items.length && <p className="tp-muted">No matches.</p>}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
