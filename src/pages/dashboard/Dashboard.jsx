import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BriefcaseBusiness, CalendarDays, CheckCircle2, CircleAlert, Clock3, Download, FileText, RefreshCw, Search, Users, UserRound } from "lucide-react";
import { getDashboardOverview, getApplicationAnalytics, exportApplicationsCsv } from "../../api/dashboard.api.js";

const numberFormat = (value) => new Intl.NumberFormat("en-IN").format(Number(value) || 0);

const getPath = (object, path) => path.split(".").reduce((value, key) => value?.[key], object);

const firstValue = (object, paths, fallback = null) => {
  for (const path of paths) {
    const value = getPath(object, path);
    if (value !== undefined && value !== null) return value;
  }
  return fallback;
};

const firstArray = (object, paths) => {
  for (const path of paths) {
    const value = getPath(object, path);
    if (Array.isArray(value)) return value;
  }
  return [];
};

const unwrap = (response) => response?.data?.data ?? response?.data?.result ?? response?.data ?? response?.result ?? response ?? {};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getInitials = (value) =>
  String(value || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

const statusClass = (status) => {
  const value = String(status || "")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
  if (["hired", "accepted", "completed", "active"].includes(value)) return "success";
  if (["interview", "interviewscheduled"].includes(value)) return "info";
  if (["offered", "offerextended"].includes(value)) return "warning";
  if (["rejected", "cancelled", "withdrawn", "failed"].includes(value)) return "danger";
  if (["inreview", "underreview", "shortlisted"].includes(value)) return "review";
  return "neutral";
};

function StatCard({ title, value, subtitle, icon: Icon, color, trend }) {
  const negative = Number(trend) < 0;

  return (
    <article className="dash-stat-card">
      <div className={`dash-stat-icon ${color}`}>
        <Icon size={22} />
      </div>
      <div className="dash-stat-content">
        <p className="dash-stat-title">{title}</p>
        <div className="dash-stat-value">{numberFormat(value)}</div>
        <div className="dash-stat-footer">
          {trend !== null && trend !== undefined && (
            <span className={`dash-trend ${negative ? "negative" : "positive"}`}>
              {negative ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}
              {Math.abs(Number(trend))}%
            </span>
          )}
          <span>{subtitle}</span>
        </div>
      </div>
      <div className={`dash-spark ${color}`}>
        <svg viewBox="0 0 76 34" aria-hidden="true">
          <path d="M2 28 L13 23 L23 25 L34 14 L45 18 L57 8 L74 3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </article>
  );
}

function ApplicationsChart({ data }) {
  const rows = useMemo(
    () =>
      (Array.isArray(data) ? data : []).slice(-12).map((item, index) => ({
        label: String(firstValue(item, ["label", "month", "period", "date", "name"], index + 1)),
        total: Number(firstValue(item, ["total", "count", "applications", "value", "totalApplications"], 0)) || 0,
      })),
    [data]
  );

  if (!rows.length) {
    return (
      <div className="dash-chart-empty">
        <Activity size={26} />
        <p>No application analytics available yet.</p>
        <span>Analytics will appear when the backend returns chart data.</span>
      </div>
    );
  }

  const max = Math.max(...rows.map((item) => item.total), 1);
  const height = 190;
  const width = 680;
  const left = 42;
  const right = 12;
  const top = 14;
  const bottom = 32;
  const usableHeight = height - top - bottom;
  const usableWidth = width - left - right;
  const step = usableWidth / rows.length;
  const barWidth = Math.min(34, step * 0.58);

  return (
    <div className="dash-chart-wrap">
      <svg className="dash-bar-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Applications overview chart">
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const y = top + usableHeight * fraction;
          return (
            <g key={fraction}>
              <line x1={left} y1={y} x2={width - right} y2={y} className="dash-grid-line" />
              <text x={left - 9} y={y + 4} textAnchor="end" className="dash-axis-label">
                {Math.round(max * (1 - fraction))}
              </text>
            </g>
          );
        })}
        {rows.map((item, index) => {
          const barHeight = (item.total / max) * usableHeight;
          const x = left + index * step + (step - barWidth) / 2;
          const y = top + usableHeight - barHeight;
          return (
            <g key={`${item.label}-${index}`}>
              <rect x={x} y={y} width={barWidth} height={barHeight} rx="4" className="dash-bar">
                <title>{`${item.label}: ${numberFormat(item.total)} applications`}</title>
              </rect>
              <text x={x + barWidth / 2} y={height - 9} textAnchor="middle" className="dash-axis-label">
                {item.label.length > 7 ? item.label.slice(0, 7) : item.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="dash-chart-legend">
        <span>
          <i /> Applications
        </span>
      </div>
    </div>
  );
}

function StatusBreakdown({ data, total }) {
  const items = useMemo(() => {
    if (Array.isArray(data)) {
      return data.map((item) => ({
        label: String(firstValue(item, ["status", "name", "label", "stage"], "Unknown")),
        count: Number(firstValue(item, ["count", "total", "value", "applications"], 0)) || 0,
      }));
    }
    if (data && typeof data === "object") {
      return Object.entries(data).map(([label, value]) => ({
        label,
        count: Number(typeof value === "object" ? firstValue(value, ["count", "total", "value"], 0) : value) || 0,
      }));
    }
    return [];
  }, [data]);

  const colors = ["#6254ed", "#16b891", "#f5b942", "#4388f5", "#a78bfa", "#f07878"];
  const sum = items.reduce((acc, item) => acc + item.count, 0);
  let cumulative = 0;

  const segments = items.map((item, index) => {
    const start = cumulative;
    cumulative += sum ? (item.count / sum) * 100 : 0;
    return { ...item, color: colors[index % colors.length], start, end: cumulative };
  });

  const gradient = segments.length ? `conic-gradient(${segments.map((item) => `${item.color} ${item.start}% ${item.end}%`).join(", ")})` : "conic-gradient(var(--dash-border) 0% 100%)";

  return (
    <div className="dash-status-content">
      <div className="dash-donut" style={{ background: gradient }}>
        <div className="dash-donut-hole">
          <strong>{numberFormat(total ?? sum)}</strong>
          <span>Applications</span>
        </div>
      </div>
      <div className="dash-status-legend">
        {segments.length ? (
          segments.map((item) => (
            <div className="dash-status-row" key={item.label}>
              <i style={{ background: item.color }} />
              <span>{item.label}</span>
              <strong>{numberFormat(item.count)}</strong>
            </div>
          ))
        ) : (
          <div className="dash-muted">No status breakdown returned by the API.</div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("30");
  const [exporting, setExporting] = useState(false);

  const user = useMemo(() => {
    try {
      const saved = localStorage.getItem("br30-talent-pipeline-user");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed?.user || parsed || {};
      }
    } catch {
      // Dashboard can render without saved profile details.
    }
    return {};
  }, []);

  const userName = firstValue(user, ["name", "fullName", "firstName"], "Recruitment Team");

  const loadDashboard = useCallback(
    async ({ silent = false } = {}) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError("");

      try {
        const params = { period: Number(period) };
        const [overviewResult, analyticsResult] = await Promise.allSettled([getDashboardOverview({ params }), getApplicationAnalytics({ params })]);

        if (overviewResult.status !== "fulfilled") {
          throw overviewResult.reason || new Error("Unable to load dashboard overview.");
        }

        setOverview(unwrap(overviewResult.value));
        setAnalytics(analyticsResult.status === "fulfilled" ? unwrap(analyticsResult.value) : null);
      } catch (err) {
        setError(err?.message || "Unable to load dashboard. Please try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [period]
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const stats = useMemo(() => {
    const source = overview || {};
    const summary = firstValue(source, ["stats", "summary", "overview", "metrics"], {}) || {};

    return {
      candidates: firstValue(summary, ["totalCandidates", "candidates", "candidateCount"], firstValue(source, ["totalCandidates", "candidateCount"], 0)),
      applications: firstValue(summary, ["totalApplications", "applications", "applicationCount"], firstValue(source, ["totalApplications", "applicationCount"], 0)),
      jobs: firstValue(summary, ["activeJobRoles", "activeJobs", "totalActiveJobs", "openJobs"], firstValue(source, ["activeJobRoles", "activeJobs", "openJobs"], 0)),
      interviews: firstValue(summary, ["scheduledInterviews", "upcomingInterviews", "interviews"], firstValue(source, ["scheduledInterviews", "upcomingInterviews"], 0)),
      candidateTrend: firstValue(summary, ["candidateGrowth", "candidateTrend", "candidatesChange"], null),
      applicationTrend: firstValue(summary, ["applicationGrowth", "applicationTrend", "applicationsChange"], null),
      jobsTrend: firstValue(summary, ["jobGrowth", "jobTrend", "jobsChange"], null),
      interviewTrend: firstValue(summary, ["interviewGrowth", "interviewTrend"], null),
    };
  }, [overview]);

  const applications = useMemo(() => firstArray(overview, ["recentApplications", "applications.recent", "data.recentApplications", "recentApplications.items", "latestApplications"]), [overview]);

  const activities = useMemo(() => firstArray(overview, ["recentActivity", "recentActivities", "activities", "activity", "data.recentActivity"]), [overview]);

  const chartRows = useMemo(() => firstArray(analytics, ["monthlyApplications", "applicationsByMonth", "timeline", "series", "data", "chartData", "items"]), [analytics]);

  const statusData = useMemo(() => firstValue(analytics, ["applicationsByStatus", "statusBreakdown", "byStatus", "statuses"], firstValue(overview, ["applicationsByStatus", "statusBreakdown", "byStatus"], [])), [analytics, overview]);

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return applications;

    return applications.filter((item) => {
      const candidate = firstValue(item, ["candidate.name", "candidateName", "name", "applicant.name"], "");
      const email = firstValue(item, ["candidate.email", "email", "applicant.email"], "");
      const role = firstValue(item, ["jobRole.title", "jobRole.name", "job.title", "position", "role", "jobTitle"], "");
      const status = firstValue(item, ["status", "applicationStatus"], "");
      return [candidate, email, role, status].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [applications, search]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportApplicationsCsv({ params: { period: Number(period) } });
    } catch (err) {
      setError(err?.message || "Unable to export applications.");
    } finally {
      setExporting(false);
    }
  };

  const openPath = (path) => navigate(path);

  return (
    <div className="dash-page">
      <style>{`
        .dash-page{--dash-primary:#5145e5;--dash-bg:#f5f7fc;--dash-card:#fff;--dash-text:#17203a;--dash-muted:#73809b;--dash-border:#e7ebf3;--dash-green:#13a982;display:block;width:100%;min-width:0;background:var(--dash-bg);color:var(--dash-text);font:14px Inter,ui-sans-serif,system-ui,sans-serif}
        html[data-theme="dark"] .dash-page{--dash-bg:#111522;--dash-card:#191e2d;--dash-text:#f1f3fb;--dash-muted:#a0abc3;--dash-border:#2c3447}
        .dash-page *{box-sizing:border-box}
        .dash-page button,.dash-page input,.dash-page select{font:inherit}
        .dash-page-inner{width:100%;max-width:1800px;margin:0 auto;padding:24px}
        .dash-page-header{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:22px}
        .dash-page-title{margin:0;color:var(--dash-text);font-size:27px;font-weight:780;letter-spacing:-1px;line-height:1.3}
        .dash-page-description{margin:6px 0 0;color:var(--dash-muted);font-size:13px}
        .dash-page-actions{display:flex;align-items:center;gap:9px}
        .dash-select,.dash-btn{height:40px;padding:0 12px;border:1px solid var(--dash-border);border-radius:9px;background:var(--dash-card);color:var(--dash-text)}
        .dash-select{cursor:pointer}
        .dash-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-weight:600;cursor:pointer;transition:background .15s}
        .dash-btn:hover{background:var(--dash-bg)}
        .dash-btn:disabled{opacity:.6;cursor:not-allowed}
        .dash-stats-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:13px;margin-bottom:15px}
        .dash-stat-card{display:flex;align-items:flex-start;gap:12px;min-width:0;min-height:112px;padding:16px 14px;background:var(--dash-card);border:1px solid var(--dash-border);border-radius:13px;overflow:hidden}
        .dash-stat-icon{width:45px;height:45px;flex:0 0 45px;display:grid;place-items:center;border-radius:11px}
        .dash-stat-icon.purple{background:#eeebff;color:#5547e9}
        .dash-stat-icon.green{background:#def8ef;color:#0fa982}
        .dash-stat-icon.blue{background:#e5efff;color:#3679e8}
        .dash-stat-icon.orange{background:#fff0db;color:#e89022}
        html[data-theme="dark"] .dash-stat-icon.purple{background:#2c2851;color:#a69cff}
        html[data-theme="dark"] .dash-stat-icon.green{background:#153c35;color:#5ee2b8}
        html[data-theme="dark"] .dash-stat-icon.blue{background:#1d3150;color:#8cbaff}
        html[data-theme="dark"] .dash-stat-icon.orange{background:#45331d;color:#ffbf6e}
        .dash-stat-content{flex:1;min-width:0}
        .dash-stat-title{margin:1px 0 7px;color:var(--dash-muted);font-size:12px}
        .dash-stat-value{font-size:27px;font-weight:780;line-height:1.15;letter-spacing:-.8px}
        .dash-stat-footer{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-top:8px;color:var(--dash-muted);font-size:10px}
        .dash-trend{display:inline-flex;align-items:center;gap:2px;padding:3px 5px;border-radius:5px;font-weight:700}
        .dash-trend.positive{background:#e3f8ef;color:#0a9b72}
        .dash-trend.negative{background:#ffeded;color:#d84b58}
        .dash-spark{width:48px;flex:0 0 48px;align-self:center}
        .dash-spark svg{width:100%;height:auto}
        .dash-spark.purple{color:#6455ef}.dash-spark.green{color:#11b68b}.dash-spark.blue{color:#4388f5}.dash-spark.orange{color:#ed9630}
        .dash-content-grid{display:grid;grid-template-columns:minmax(0,1.8fr) minmax(235px,.68fr) minmax(245px,.82fr);gap:13px;align-items:stretch}
        .dash-card{min-width:0;background:var(--dash-card);border:1px solid var(--dash-border);border-radius:13px;overflow:hidden}
        .dash-card-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:17px 17px 8px}
        .dash-card-title{margin:0;color:var(--dash-text);font-size:15px;font-weight:750}
        .dash-card-subtitle{margin:5px 0 0;color:var(--dash-muted);font-size:11px}
        .dash-chart-wrap{padding:8px 12px 14px}
        .dash-bar-chart{display:block;width:100%;height:auto;overflow:visible}
        .dash-grid-line{stroke:var(--dash-border);stroke-width:1;stroke-dasharray:3 4}
        .dash-axis-label{fill:var(--dash-muted);font-size:11px}
        .dash-bar{fill:#6556ef}
        .dash-bar:hover{opacity:.7}
        .dash-chart-legend{display:flex;justify-content:center;padding-top:8px;color:var(--dash-muted);font-size:11px}
        .dash-chart-legend span{display:inline-flex;align-items:center;gap:7px}
        .dash-chart-legend i{width:9px;height:9px;border-radius:3px;background:#6556ef}
        .dash-chart-empty{min-height:230px;padding:25px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:var(--dash-muted)}
        .dash-chart-empty p{margin:10px 0 5px;color:var(--dash-text);font-weight:650}
        .dash-chart-empty span{font-size:12px;line-height:1.5}
        .dash-status-content{padding:18px 15px 20px;display:flex;flex-direction:column;align-items:center;gap:20px}
        .dash-donut{width:148px;height:148px;max-width:100%;flex:0 0 auto;border-radius:50%;display:grid;place-items:center}
        .dash-donut-hole{width:99px;height:99px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:50%;background:var(--dash-card)}
        .dash-donut-hole strong{font-size:21px;font-weight:800}
        .dash-donut-hole span{margin-top:3px;font-size:10px;color:var(--dash-muted)}
        .dash-status-legend{width:100%;display:flex;flex-direction:column;gap:12px}
        .dash-status-row{display:flex;align-items:center;gap:7px;min-width:0;font-size:11px}
        .dash-status-row i{width:9px;height:9px;flex:0 0 9px;border-radius:3px}
        .dash-status-row span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dash-muted);text-transform:capitalize}
        .dash-status-row strong{color:var(--dash-text)}
        .dash-muted{color:var(--dash-muted);font-size:12px;line-height:1.6}
        .dash-activity-list{padding:7px 17px 18px}
        .dash-activity-item{display:flex;gap:10px;padding:11px 0}
        .dash-activity-icon{width:34px;height:34px;flex:0 0 34px;display:grid;place-items:center;border-radius:50%;background:#efedff;color:#6556ef}
        .dash-activity-icon.success{background:#e1f8ef;color:#0aa47b}
        .dash-activity-icon.warning{background:#fff1dc;color:#dc902a}
        .dash-activity-copy{flex:1;min-width:0}
        .dash-activity-title{margin:0;color:var(--dash-text);font-size:12px;line-height:1.5;overflow-wrap:anywhere}
        .dash-activity-time{margin-top:4px;color:var(--dash-muted);font-size:10px}
        .dash-lower-grid{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:13px;margin-top:15px;align-items:start}
        .dash-table-toolbar{display:flex;align-items:center;gap:8px}
        .dash-text-link{display:inline-flex;align-items:center;gap:5px;border:0;background:transparent;color:var(--dash-primary);font-size:12px;font-weight:650;cursor:pointer;white-space:nowrap}
        .dash-table-search{width:190px;height:34px;display:flex;align-items:center;gap:7px;padding:0 9px;border:1px solid var(--dash-border);border-radius:8px;color:var(--dash-muted)}
        .dash-table-search input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:var(--dash-text);font-size:12px}
        .dash-table-wrap{padding:8px 15px 14px;overflow-x:auto}
        .dash-table{width:100%;border-collapse:collapse;text-align:left;white-space:nowrap}
        .dash-table th{padding:11px 9px;background:var(--dash-bg);color:var(--dash-muted);font-size:10px;font-weight:650;border-bottom:1px solid var(--dash-border)}
        .dash-table td{padding:11px 9px;border-bottom:1px solid var(--dash-border);font-size:11px;color:var(--dash-text);vertical-align:middle}
        .dash-table tr:last-child td{border-bottom:0}
        .dash-candidate-cell{display:flex;align-items:center;gap:9px;min-width:150px}
        .dash-avatar{width:33px;height:33px;flex:0 0 33px;display:grid;place-items:center;border-radius:50%;background:#e9e6ff;color:#4e42d7;font-size:11px;font-weight:750}
        .dash-candidate-name{max-width:165px;overflow:hidden;text-overflow:ellipsis;font-size:11px;font-weight:650}
        .dash-candidate-email{max-width:170px;margin-top:4px;overflow:hidden;text-overflow:ellipsis;color:var(--dash-muted);font-size:10px}
        .dash-role-name{font-weight:600}.dash-role-id{margin-top:4px;color:var(--dash-muted);font-size:10px}
        .dash-status-badge{display:inline-flex;align-items:center;padding:5px 8px;border-radius:6px;font-size:10px;font-weight:650;text-transform:capitalize}
        .dash-status-badge.success{background:#ddf7ec;color:#07966c}.dash-status-badge.info{background:#e4efff;color:#2c70d8}.dash-status-badge.warning{background:#fff0d7;color:#bc791c}.dash-status-badge.danger{background:#ffebed;color:#d74856}.dash-status-badge.review{background:#ece9ff;color:#5746db}.dash-status-badge.neutral{background:var(--dash-bg);color:var(--dash-muted)}
        .dash-row-action{width:29px;height:29px;display:grid;place-items:center;border:0;border-radius:7px;background:transparent;color:var(--dash-muted);cursor:pointer}
        .dash-row-action:hover{background:var(--dash-bg);color:var(--dash-text)}
        .dash-empty-row{text-align:center!important;padding:30px 12px!important;color:var(--dash-muted)!important;white-space:normal!important}
        .dash-quick-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;padding:12px 15px 16px}
        .dash-quick-action{min-height:85px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;padding:11px 6px;border:1px solid var(--dash-border);border-radius:10px;background:var(--dash-bg);color:var(--dash-text);font-size:11px;text-align:center;cursor:pointer}
        .dash-quick-action:hover{border-color:#b9b2ff}
        .dash-quick-action svg{color:var(--dash-primary)}
        .dash-alert{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;margin-bottom:16px;border:1px solid #ffd4d4;border-radius:10px;background:#fff5f5;color:#b42332;font-size:12px;line-height:1.5}
        .dash-alert button{margin-left:auto;border:0;background:transparent;color:inherit;cursor:pointer}
        .dash-loading{min-height:240px;display:flex;align-items:center;justify-content:center;gap:10px;color:var(--dash-muted)}
        .dash-spin{animation:dash-spin .9s linear infinite}
        .dash-bottom-note{padding:13px 0 0;color:var(--dash-muted);font-size:10px;text-align:right}
        @keyframes dash-spin{to{transform:rotate(360deg)}}
        @media(max-width:1250px){.dash-content-grid{grid-template-columns:minmax(0,1.5fr) minmax(230px,.8fr)}.dash-activity-card{grid-column:1/-1}.dash-lower-grid{grid-template-columns:minmax(0,1fr) 270px}.dash-spark{display:none}}
        @media(max-width:900px){.dash-stats-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.dash-lower-grid{grid-template-columns:1fr}.dash-content-grid{grid-template-columns:minmax(0,1fr) minmax(220px,.75fr)}.dash-activity-card{grid-column:1/-1}}
        @media(max-width:600px){.dash-page-inner{padding:17px 12px 24px}.dash-page-header{align-items:flex-start;flex-direction:column;gap:13px}.dash-page-title{font-size:23px}.dash-page-description{font-size:12px;line-height:1.5}.dash-page-actions{width:100%;justify-content:space-between}.dash-stats-grid{gap:9px}.dash-stat-card{min-height:100px;padding:12px 10px;gap:9px}.dash-stat-icon{width:36px;height:36px;flex-basis:36px}.dash-stat-icon svg{width:19px;height:19px}.dash-stat-title{font-size:10px;line-height:1.4}.dash-stat-value{font-size:22px}.dash-stat-footer{font-size:9px;gap:4px}.dash-content-grid{grid-template-columns:1fr}.dash-activity-card{grid-column:auto}.dash-card-header{padding:15px 13px 8px}.dash-status-content{flex-direction:row;align-items:center;justify-content:center;gap:15px;padding:18px 12px}.dash-donut{width:115px;height:115px}.dash-donut-hole{width:77px;height:77px}.dash-status-legend{flex:1;min-width:0}.dash-table-toolbar{flex-wrap:wrap;justify-content:flex-end}.dash-table-search{width:100%;order:2}.dash-table-wrap{padding:8px 8px 12px}.dash-quick-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.dash-select,.dash-btn{font-size:12px;padding:0 9px}.dash-card-title{font-size:14px}}
      `}</style>

      <div className="dash-page-inner">
        <div className="dash-page-header">
          <div>
            <h1 className="dash-page-title">Hello, {userName?.trim().split(/\s+/)[0] || "User"} 👋</h1>
            <p className="dash-page-description">Here's what's happening with your recruitment pipeline today.</p>
          </div>
          <div className="dash-page-actions">
            <select className="dash-select" value={period} onChange={(event) => setPeriod(event.target.value)} aria-label="Dashboard date range">
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last 12 months</option>
            </select>
            <button type="button" className="dash-btn" onClick={() => loadDashboard({ silent: true })} disabled={loading || refreshing}>
              <RefreshCw size={15} className={refreshing ? "dash-spin" : ""} /> Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="dash-alert" role="alert">
            <CircleAlert size={18} />
            <div>
              <strong>Dashboard data couldn't be fully loaded.</strong>
              <div>{error}</div>
            </div>
            <button type="button" onClick={() => loadDashboard()} aria-label="Retry">
              <RefreshCw size={16} />
            </button>
          </div>
        )}

        {loading ? (
          <div className="dash-card dash-loading">
            <RefreshCw size={21} className="dash-spin" /> Loading dashboard data...
          </div>
        ) : (
          <>
            <section className="dash-stats-grid" aria-label="Recruitment statistics">
              <StatCard title="Total Candidates" value={stats.candidates} subtitle="Candidates in your system" icon={Users} color="purple" trend={stats.candidateTrend} />
              <StatCard title="Total Applications" value={stats.applications} subtitle="Applications received" icon={FileText} color="green" trend={stats.applicationTrend} />
              <StatCard title="Active Job Roles" value={stats.jobs} subtitle="Currently active roles" icon={BriefcaseBusiness} color="blue" trend={stats.jobsTrend} />
              <StatCard title="Scheduled Interviews" value={stats.interviews} subtitle="Scheduled interviews" icon={CalendarDays} color="orange" trend={stats.interviewTrend} />
            </section>

            <section className="dash-content-grid">
              <article className="dash-card">
                <div className="dash-card-header">
                  <div>
                    <h2 className="dash-card-title">Applications Overview</h2>
                    <p className="dash-card-subtitle">Application activity for the selected period</p>
                  </div>
                  <Activity size={18} color="var(--dash-primary)" />
                </div>
                <ApplicationsChart data={chartRows} />
              </article>

              <article className="dash-card">
                <div className="dash-card-header">
                  <div>
                    <h2 className="dash-card-title">Applications by Status</h2>
                    <p className="dash-card-subtitle">Current pipeline breakdown</p>
                  </div>
                </div>
                <StatusBreakdown data={statusData} total={stats.applications} />
              </article>

              <article className="dash-card dash-activity-card">
                <div className="dash-card-header">
                  <h2 className="dash-card-title">Recent Activity</h2>
                  <button type="button" className="dash-text-link" onClick={() => openPath("/applications")}>
                    View all <ArrowRight size={14} />
                  </button>
                </div>
                <div className="dash-activity-list">
                  {activities.length ? (
                    activities.slice(0, 5).map((item, index) => {
                      const title = firstValue(item, ["title", "message", "description", "action"], "Activity update");
                      const time = firstValue(item, ["createdAt", "timestamp", "date", "time", "updatedAt"], null);
                      const type = String(firstValue(item, ["type", "status", "event"], "")).toLowerCase();
                      const Icon = type.includes("hire") || type.includes("complete") ? CheckCircle2 : type.includes("interview") ? CalendarDays : type.includes("job") ? BriefcaseBusiness : Clock3;
                      const tone = type.includes("hire") || type.includes("complete") ? "success" : type.includes("job") ? "warning" : "";
                      return (
                        <div className="dash-activity-item" key={item._id || item.id || `${title}-${index}`}>
                          <div className={`dash-activity-icon ${tone}`}>
                            <Icon size={16} />
                          </div>
                          <div className="dash-activity-copy">
                            <p className="dash-activity-title">{title}</p>
                            <div className="dash-activity-time">{formatDate(time)}</div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="dash-muted">No recent activity was returned by the backend.</div>
                  )}
                </div>
              </article>
            </section>

            <section className="dash-lower-grid">
              <article className="dash-card">
                <div className="dash-card-header">
                  <div>
                    <h2 className="dash-card-title">Recent Applications</h2>
                    <p className="dash-card-subtitle">
                      {numberFormat(filteredApplications.length)} application(s){search ? " matching your search" : ""}
                    </p>
                  </div>
                  <div className="dash-table-toolbar">
                    <button type="button" className="dash-btn" onClick={handleExport} disabled={exporting}>
                      {exporting ? <RefreshCw size={14} className="dash-spin" /> : <Download size={14} />} Export CSV
                    </button>
                    <button type="button" className="dash-text-link" onClick={() => openPath("/applications")}>
                      View all <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
                <div className="dash-table-wrap">
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>Candidate</th>
                        <th>Job Role</th>
                        <th>Department</th>
                        <th>Status</th>
                        <th>Applied On</th>
                        <th aria-label="Actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApplications.length ? (
                        filteredApplications.slice(0, 8).map((item, index) => {
                          const candidate = firstValue(item, ["candidate.name", "candidateName", "applicant.name", "name"], "Unnamed candidate");
                          const email = firstValue(item, ["candidate.email", "applicant.email", "email"], "");
                          const role = firstValue(item, ["jobRole.title", "jobRole.name", "job.title", "jobTitle", "position", "role"], "—");
                          const department = firstValue(item, ["department.name", "jobRole.department.name", "departmentName"], "—");
                          const status = firstValue(item, ["status", "applicationStatus"], "Unknown");
                          const date = firstValue(item, ["appliedAt", "createdAt", "applicationDate", "created_at"], null);
                          return (
                            <tr key={item._id || item.id || `${candidate}-${index}`}>
                              <td>
                                <div className="dash-candidate-cell">
                                  <div className="dash-avatar">{getInitials(candidate)}</div>
                                  <div>
                                    <div className="dash-candidate-name">{candidate}</div>
                                    {email && <div className="dash-candidate-email">{email}</div>}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="dash-role-name">{role}</div>
                                {firstValue(item, ["jobRole.code", "jobCode", "reference"], null) && <div className="dash-role-id">{firstValue(item, ["jobRole.code", "jobCode", "reference"])}</div>}
                              </td>
                              <td>{department}</td>
                              <td>
                                <span className={`dash-status-badge ${statusClass(status)}`}>{String(status).replace(/[_-]/g, " ")}</span>
                              </td>
                              <td>{formatDate(date)}</td>
                              <td>
                                <button type="button" className="dash-row-action" title="View applications" aria-label={`View ${candidate}'s application`} onClick={() => openPath("/applications")}>
                                  <ArrowRight size={15} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="dash-empty-row">
                            {search ? "No applications match your search." : "No recent applications were returned by the backend."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </article>

              <article className="dash-card">
                <div className="dash-card-header">
                  <div>
                    <h2 className="dash-card-title">Quick Actions</h2>
                    <p className="dash-card-subtitle">Jump straight into your workflow</p>
                  </div>
                </div>
                <div className="dash-quick-grid">
                  <button type="button" className="dash-quick-action" onClick={() => openPath("/job-roles")}>
                    <BriefcaseBusiness size={23} />
                    <span>Create Job Role</span>
                  </button>
                  <button type="button" className="dash-quick-action" onClick={() => openPath("/candidates")}>
                    <UserRound size={23} />
                    <span>Add Candidate</span>
                  </button>
                  <button type="button" className="dash-quick-action" onClick={() => openPath("/applications")}>
                    <FileText size={23} />
                    <span>View Applications</span>
                  </button>
                  <button type="button" className="dash-quick-action" onClick={() => openPath("/interviews")}>
                    <CalendarDays size={23} />
                    <span>Schedule Interview</span>
                  </button>
                </div>
              </article>
            </section>
            <div className="dash-bottom-note">Dashboard values are provided by your BR30 Talent Pipeline API.</div>
          </>
        )}
      </div>
    </div>
  );
}
