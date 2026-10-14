import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, BriefcaseBusiness, Users, FileText, Building2, CalendarDays, Activity, X, ArrowUpRight, RefreshCw } from "lucide-react";

import { getCandidates } from "../../api/candidate.api.js";
import { getJobRoles } from "../../api/job-role.api.js";
import { getApplications } from "../../api/application.api.js";
import { getDepartments } from "../../api/department.api.js";
import { getInterviews } from "../../api/interview.api.js";
import { getActivities } from "../../api/activity.api.js";

const EMPTY_RESULTS = {
  candidates: [],
  roles: [],
  applications: [],
  departments: [],
  interviews: [],
  activities: [],
};

const unwrap = (response) => response?.data?.data ?? response?.data ?? response;

const getArray = (response, keys = []) => {
  const data = unwrap(response);

  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;

  // Common paginated API response structures
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.records)) return data.records;

  return [];
};

const getId = (item) => item?._id || item?.id;

const getCandidateName = (item) => item?.fullName || item?.name || [item?.firstName, item?.lastName].filter(Boolean).join(" ") || item?.email || "Candidate";

const getJobRoleName = (item) => item?.title || item?.name || "Job role";

const getApplicationName = (item) => item?.candidateId?.fullName || item?.candidate?.fullName || item?.candidateName || item?.fullName || item?.email || "Application";

const getDepartmentName = (item) => item?.name || item?.title || "Department";

const getInterviewName = (item) => item?.candidateId?.fullName || item?.candidate?.fullName || item?.candidateName || item?.title || "Interview";

const getActivityName = (item) => item?.description || item?.action || item?.title || item?.event || item?.message || "Activity";

const getDateLabel = (value) => {
  if (!value) return "";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
};

const matchesQuery = (item, query, fields) => {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) return true;

  return fields
    .map((getValue) => getValue(item))
    .filter((value) => value !== undefined && value !== null)
    .some((value) => String(value).toLowerCase().includes(normalizedQuery));
};

export default function SearchResults() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";

  const [searchInput, setSearchInput] = useState(q);
  const [results, setResults] = useState(EMPTY_RESULTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [failedSections, setFailedSections] = useState([]);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  useEffect(() => {
    let live = true;
    const search = q.trim();

    if (!search) {
      setResults(EMPTY_RESULTS);
      setError("");
      setFailedSections([]);
      setLoading(false);

      return () => {
        live = false;
      };
    }

    const loadResults = async () => {
      setLoading(true);
      setError("");
      setFailedSections([]);

      const requests = await Promise.allSettled([
        getCandidates({ page: 1, limit: 100, search }),
        getJobRoles({ page: 1, limit: 100, search }),
        getApplications({ page: 1, limit: 100, search }),
        getDepartments({ page: 1, limit: 100, search }),
        getInterviews({ page: 1, limit: 100, search }),
        getActivities({ page: 1, limit: 100, search }),
      ]);

      if (!live) return;

      const configs = [
        {
          key: "candidates",
          title: "Candidates",
          keys: ["candidates"],
          fields: [getCandidateName, (x) => x.email, (x) => x.mobile, (x) => x.phone, (x) => x.status],
        },
        {
          key: "roles",
          title: "Job Roles",
          keys: ["jobRoles", "roles"],
          fields: [(x) => x.title, (x) => x.name, (x) => x.description, (x) => x.departmentId?.name, (x) => x.department?.name, (x) => x.status],
        },
        {
          key: "applications",
          title: "Applications",
          keys: ["applications"],
          fields: [getApplicationName, (x) => x.candidateId?.email, (x) => x.candidate?.email, (x) => x.jobRoleId?.title, (x) => x.jobRole?.title, (x) => x.status],
        },
        {
          key: "departments",
          title: "Departments",
          keys: ["departments"],
          fields: [(x) => x.name, (x) => x.title, (x) => x.description, (x) => x.status],
        },
        {
          key: "interviews",
          title: "Interviews",
          keys: ["interviews"],
          fields: [getInterviewName, (x) => x.candidateId?.email, (x) => x.candidate?.email, (x) => x.jobRoleId?.title, (x) => x.status, (x) => x.interviewType],
        },
        {
          key: "activities",
          title: "Activity Log",
          keys: ["activities", "activity", "activityLogs", "logs"],
          fields: [getActivityName, (x) => x.action, (x) => x.event, (x) => x.entityType, (x) => x.entity, (x) => x.user?.name, (x) => x.userName],
        },
      ];

      const next = { ...EMPTY_RESULTS };
      const failed = [];
      let successfulRequests = 0;

      configs.forEach((config, index) => {
        const request = requests[index];

        if (request.status !== "fulfilled") {
          failed.push(config.title);
          return;
        }

        successfulRequests += 1;

        const rows = getArray(request.value, config.keys);

        next[config.key] = rows.filter((item) => matchesQuery(item, search, config.fields));
      });

      if (!successfulRequests) {
        const firstError = requests.find((request) => request.status === "rejected")?.reason;

        setError(firstError?.response?.data?.message || firstError?.message || "Search failed. Please try again.");
      }

      setFailedSections(failed);
      setResults(next);
      setLoading(false);
    };

    loadResults().catch((err) => {
      if (!live) return;

      setError(err?.message || "Search failed. Please try again.");
      setResults(EMPTY_RESULTS);
      setLoading(false);
    });

    return () => {
      live = false;
    };
  }, [q]);

  const sections = [
    {
      title: "Candidates",
      Icon: Users,
      color: "#6757e8",
      items: results.candidates,
      label: getCandidateName,
      sub: (x) => [x.email, x.mobile || x.phone, x.status].filter(Boolean).join(" · "),
      href: (x) => {
        const id = getId(x);
        return id ? `/candidates/${id}` : "/candidates";
      },
    },
    {
      title: "Job Roles",
      Icon: BriefcaseBusiness,
      color: "#1684d8",
      items: results.roles,
      label: getJobRoleName,
      sub: (x) => [x.departmentId?.name || x.department?.name, x.status].filter(Boolean).join(" · "),
      href: () => `/job-roles?search=${encodeURIComponent(q)}`,
    },
    {
      title: "Applications",
      Icon: FileText,
      color: "#159b79",
      items: results.applications,
      label: getApplicationName,
      sub: (x) => [x.jobRoleId?.title || x.jobRole?.title, x.status, x.candidateId?.email || x.candidate?.email].filter(Boolean).join(" · "),
      href: (x) => {
        const id = getId(x);
        return id ? `/applications/${id}` : "/applications";
      },
    },
    {
      title: "Departments",
      Icon: Building2,
      color: "#bd7a17",
      items: results.departments,
      label: getDepartmentName,
      sub: (x) => x.description || x.status || "",
      href: () => "/departments",
    },
    {
      title: "Interviews",
      Icon: CalendarDays,
      color: "#cf5485",
      items: results.interviews,
      label: getInterviewName,
      sub: (x) => [x.jobRoleId?.title || x.jobRole?.title, x.status, getDateLabel(x.scheduledAt || x.startTime || x.date)].filter(Boolean).join(" · "),
      href: () => "/interviews",
    },
    {
      title: "Activity Log",
      Icon: Activity,
      color: "#7b68c9",
      items: results.activities,
      label: getActivityName,
      sub: (x) => [x.user?.name || x.userName || x.actor?.name, x.entityType || x.entity, getDateLabel(x.createdAt)].filter(Boolean).join(" · "),
      href: () => "/activity",
    },
  ];

  const totalResults = Object.values(results).reduce((total, items) => total + items.length, 0);

  const handleSubmit = (event) => {
    event.preventDefault();
    const query = searchInput.trim();

    setParams(query ? { q: query } : {});
  };

  return (
    <div className="tp-page">
      <style>{`
        .tp-page{padding:26px;color:var(--text);min-width:0}
        .tp-page h1{font-size:25px;font-weight:650;margin:0 0 6px}
        .tp-muted{color:var(--muted);font-size:13px;line-height:1.6}
        .tp-search-form{display:flex;gap:8px;margin:20px 0}
        .tp-search-form input{flex:1;min-width:0;padding:11px 13px;border:1px solid var(--border);border-radius:9px;background:var(--input-bg);color:var(--text);font:inherit;outline:none}
        .tp-search-form input:focus{border-color:var(--primary,#5145e5);box-shadow:0 0 0 3px #5145e51a}
        .tp-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:10px 14px;border:1px solid var(--border);border-radius:9px;background:var(--surface);color:var(--text);cursor:pointer;font:inherit}
        .tp-btn:hover{background:var(--input-bg)}
        .tp-search-meta{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin:12px 0 18px}
        .tp-results{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-items:start}
        .tp-panel{min-width:0;padding:17px;border:1px solid var(--border);border-radius:13px;background:var(--surface);box-shadow:0 2px 8px #00000005}
        .tp-panel-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-bottom:13px;border-bottom:1px solid var(--border)}
        .tp-panel-title{display:flex;align-items:center;gap:10px;min-width:0}
        .tp-panel-icon{width:36px;height:36px;flex:0 0 36px;display:grid;place-items:center;border-radius:10px;background:var(--input-bg)}
        .tp-panel h2{font-size:14px;font-weight:650;margin:0;color:var(--text)}
        .tp-count{display:inline-flex;align-items:center;justify-content:center;min-width:25px;height:24px;padding:0 7px;border:1px solid var(--border);border-radius:7px;color:var(--muted);font-size:11px;font-weight:600}
        .tp-result{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 2px;border-bottom:1px solid var(--border);text-decoration:none;color:var(--text);min-width:0}
        .tp-result:last-child{border-bottom:0}
        .tp-result:hover .tp-result-name{color:var(--primary,#5145e5)}
        .tp-result-copy{flex:1;min-width:0}
        .tp-result-name{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:600;color:var(--text)}
        .tp-result small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:5px;color:var(--muted);font-size:11px}
        .tp-result-arrow{flex:0 0 auto;color:var(--muted)}
        .tp-empty{padding:20px 8px;text-align:center;color:var(--muted);font-size:12px;line-height:1.6}
        .tp-error{padding:13px;border:1px solid #e6b5b5;color:#972222;background:#fff7f7;border-radius:9px;font-size:13px}
        .tp-warning{padding:10px 12px;margin:10px 0;border:1px solid var(--border);border-radius:9px;color:var(--muted);font-size:12px;line-height:1.6}
        .tp-loading{display:flex;align-items:center;gap:9px;padding:28px;color:var(--muted);font-size:13px}
        .tp-search-empty{padding:30px 15px;text-align:center;border:1px dashed var(--border);border-radius:12px;color:var(--muted)}
        .tp-search-empty-icon{margin:0 auto 10px;opacity:.55}
        @media(max-width:850px){.tp-results{grid-template-columns:1fr}}
        @media(max-width:600px){.tp-page{padding:17px 12px}.tp-page h1{font-size:22px}.tp-panel{padding:13px}.tp-search-form{gap:6px}.tp-btn{padding:10px}.tp-search-meta{align-items:flex-start}}
      `}</style>

      <h1>Search Results</h1>
      <p className="tp-muted">Search candidates, job roles, applications, departments, interviews and activity logs across your workspace.</p>

      <form className="tp-search-form" onSubmit={handleSubmit}>
        <input name="q" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search by name, email, job title, status..." aria-label="Search all records" />

        {searchInput && (
          <button
            className="tp-btn"
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setSearchInput("");
              setParams({});
            }}>
            <X size={15} />
          </button>
        )}

        <button className="tp-btn" type="submit">
          <Search size={15} />
          Search
        </button>
      </form>

      {!q.trim() && (
        <div className="tp-search-empty">
          <Search className="tp-search-empty-icon" size={30} />
          <strong>Search your workspace</strong>
          <p className="tp-muted">Enter at least one name, email, job title or keyword above.</p>
        </div>
      )}

      {error && <div className="tp-error">{error}</div>}

      {q.trim() && !error && (
        <div className="tp-search-meta">
          <div className="tp-muted">
            Results for <strong>{q}</strong>
            {!loading && ` · ${totalResults} matching records`}
          </div>

          {!loading && (
            <button
              type="button"
              className="tp-btn"
              onClick={() => {
                setResults(EMPTY_RESULTS);
                setParams({ q });
              }}>
              <RefreshCw size={14} />
              Refresh search
            </button>
          )}
        </div>
      )}

      {failedSections.length > 0 && !loading && <div className="tp-warning">Could not load: {failedSections.join(", ")}. Other available results are shown. Check the corresponding API or backend response.</div>}

      {loading ? (
        <div className="tp-loading">
          <RefreshCw size={17} />
          Searching all six modules…
        </div>
      ) : q.trim() && !error ? (
        totalResults > 0 ? (
          <div className="tp-results">
            {sections.map(({ title, Icon, color, items, label, sub, href }) => (
              <section className="tp-panel" key={title}>
                <div className="tp-panel-head">
                  <div className="tp-panel-title">
                    <span className="tp-panel-icon" style={{ color }}>
                      <Icon size={18} />
                    </span>
                    <h2>{title}</h2>
                  </div>

                  <span className="tp-count">{items.length}</span>
                </div>

                {items.map((item, index) => (
                  <Link className="tp-result" key={getId(item) || `${title}-${index}`} to={href(item)}>
                    <span className="tp-result-copy">
                      <strong className="tp-result-name">{label(item)}</strong>
                      <small>{sub(item) || "Open record to view details"}</small>
                    </span>

                    <ArrowUpRight className="tp-result-arrow" size={16} />
                  </Link>
                ))}

                {!items.length && <div className="tp-empty">No matching {title.toLowerCase()}.</div>}
              </section>
            ))}
          </div>
        ) : (
          <div className="tp-search-empty">
            <Search className="tp-search-empty-icon" size={30} />
            <strong>No results found</strong>
            <p className="tp-muted">Try a different name, email, job title or keyword.</p>
          </div>
        )
      ) : null}
    </div>
  );
}
