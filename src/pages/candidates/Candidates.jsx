import { useCallback, useEffect, useMemo, useState } from "react";

import { Link, useSearchParams } from "react-router-dom";

import { RefreshCw, Search, Eye, X, Users, GraduationCap, BriefcaseBusiness, FileText, ExternalLink } from "lucide-react";

import { getCandidates } from "../../api/candidate.api.js";
import { getResumePreview } from "../../api/application.api.js";

const unwrap = (response) => response?.data?.data ?? response?.data ?? response;

const getId = (candidate) => candidate?._id || candidate?.id || "";

const getErrorMessage = (error) => error?.response?.data?.message || error?.response?.data?.error || error?.message || "Unable to load candidates. Please try again.";

const formatCtc = (amount) => {
  if (amount === null || amount === undefined || amount === "") {
    return "Not specified";
  }

  const value = Number(amount);

  if (!Number.isFinite(value)) return "Not specified";

  return `₹${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(value)}`;
};

const getEducationSummary = (education) => {
  if (!Array.isArray(education) || education.length === 0) {
    return "Not specified";
  }

  const latest = education[0];

  return latest?.qualification || latest?.fieldOfStudy || latest?.institution || "Education added";
};

const getEmploymentLabel = (status) => {
  const labels = {
    employed: "Employed",

    unemployed: "Unemployed",

    self_employed: "Self-employed",

    student: "Student",

    serving_notice: "Serving notice",

    other: "Other",
  };

  return labels[status] || "Not specified";
};

const getResumeUrl = (candidate) => (typeof candidate?.resume === "string" ? candidate.resume : candidate?.resume?.url || candidate?.application?.resume?.url || "");

const getApplicationId = (candidate) => candidate?.application?._id || candidate?.applicationId || (Array.isArray(candidate?.applications) ? candidate.applications[0]?._id : "") || "";

const getResumeName = (candidate) => {
  const resume = candidate?.application?.resume || candidate?.resume || {};
  const name = resume?.originalName || resume?.originalname || resume?.fileName || "resume.pdf";
  return String(name).toLowerCase().endsWith(".pdf") ? String(name) : `${name}.pdf`;
};

export default function Candidates() {
  const [params, setParams] = useSearchParams();

  const [search, setSearch] = useState(params.get("search") || params.get("q") || "");

  const [rows, setRows] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [lastUpdated, setLastUpdated] = useState(null);
  const [resumeActionId, setResumeActionId] = useState("");
  const [resumeActionError, setResumeActionError] = useState("");

  const loadCandidates = useCallback(async (searchValue = "") => {
    setLoading(true);

    setError("");

    try {
      const response = await getCandidates({
        page: 1,

        limit: 100,

        search: searchValue.trim(),
      });

      const data = unwrap(response);

      const candidates = Array.isArray(data) ? data : Array.isArray(data?.candidates) ? data.candidates : Array.isArray(data?.items) ? data.items : Array.isArray(data?.data) ? data.data : [];

      setRows(candidates);

      setLastUpdated(new Date());
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCandidates(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, loadCandidates]);

  useEffect(() => {
    const nextParams = new URLSearchParams(params);

    if (search.trim()) {
      nextParams.set("search", search);

      nextParams.delete("q");
    } else {
      nextParams.delete("search");

      nextParams.delete("q");
    }

    if (nextParams.toString() !== params.toString()) {
      setParams(nextParams, { replace: true });
    }
  }, [search, params, setParams]);

  const stats = useMemo(() => {
    const total = rows.length;

    const withEducation = rows.filter((candidate) => Array.isArray(candidate.education) && candidate.education.length > 0).length;

    const withResume = rows.filter((candidate) => Boolean(getResumeUrl(candidate))).length;

    const experienced = rows.filter((candidate) => Number(candidate.experienceYears || 0) > 0).length;

    return {
      total,

      withEducation,

      withResume,

      experienced,
    };
  }, [rows]);

  const handleResumeAction = async (candidate, mode = "preview") => {
    const applicationId = getApplicationId(candidate);
    if (!applicationId) {
      setResumeActionError(`Application ID is missing for ${candidate?.fullName || "this candidate"}.`);
      return;
    }

    let openedWindow = null;
    let objectUrl = "";
    setResumeActionId(`${applicationId}:${mode}`);
    setResumeActionError("");

    try {
      // Open a tab synchronously for preview to avoid browser popup blockers.
      if (mode === "preview") {
        openedWindow = window.open("about:blank", "_blank");
        if (!openedWindow) throw new Error("Please allow pop-ups to preview the resume.");
        openedWindow.opener = null;
        openedWindow.document.title = "Loading resume...";
        openedWindow.document.body.innerHTML = '<p style="font-family:Arial,sans-serif;padding:24px">Loading resume...</p>';
      }

      // http.js returns the Blob directly and adds the logged-in Bearer token.
      const pdfBlob = await getResumePreview(applicationId);

      if (!(pdfBlob instanceof Blob) || pdfBlob.size === 0) {
        throw new Error("The server did not return a valid PDF file.");
      }
      if (pdfBlob.type && !pdfBlob.type.includes("pdf") && !pdfBlob.type.includes("octet-stream")) {
        throw new Error("The server response is not a PDF. Check the backend resume endpoint.");
      }

      const pdf = pdfBlob.type === "application/pdf" ? pdfBlob : new Blob([pdfBlob], { type: "application/pdf" });
      objectUrl = URL.createObjectURL(pdf);

      if (mode === "download") {
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = getResumeName(candidate);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 3000);
        objectUrl = "";
      } else if (openedWindow) {
        openedWindow.location.href = objectUrl;
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 5 * 60 * 1000);
        objectUrl = "";
      }
    } catch (actionError) {
      if (openedWindow && !openedWindow.closed) openedWindow.close();
      setResumeActionError(actionError?.message || "Unable to open or download the resume.");
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setResumeActionId("");
    }
  };

  const clearSearch = () => {
    setSearch("");
  };

  return (
    <div className="jr-page candidate-page">
      <style>{`

.candidate-page{--bg:#f5f7fb;--surface:#ffffff;--surface-2:#f8fafc;--text:#182230;--muted:#657286;--border:#e2e8f0;--primary:#5847e8;--primary-soft:#edf2ff;--success:#137a50;--success-soft:#e9f8f0;--danger:#b42332;--danger-soft:#fff0f1;--shadow:0 2px 8px rgba(16,24,40,.04);width:100%;min-width:0;min-height:calc(100vh - 120px);padding:24px;box-sizing:border-box;color:var(--text);background:var(--bg);font-size:14px;color-scheme:light}

:is(html[data-theme="dark"],body[data-theme="dark"],html.dark,body.dark,[data-theme="dark"],.dark) .candidate-page,.candidate-page:is([data-theme="dark"],.dark){--bg:#0f1420;--surface:#191f2e;--surface-2:#20283a;--text:#eef2ff;--muted:#a2abc3;--border:#2b3449;--primary:#8b7cff;--primary-soft:rgba(101,86,232,.18);--success:#54d99e;--success-soft:rgba(38,181,120,.14);--danger:#ff9292;--danger-soft:rgba(220,90,90,.14);--shadow:0 2px 10px rgba(0,0,0,.16);color:var(--text);background:var(--bg);color-scheme:dark}

.candidate-page *{box-sizing:border-box}

.candidate-page .jr-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin:0 0 24px;flex-wrap:wrap}

.candidate-page .jr-title{font-size:28px;line-height:1.2;font-weight:600;margin:0;color:var(--text)}

.candidate-page .jr-subtitle{margin:8px 0 0;color:var(--muted);line-height:1.65;max-width:680px}

.candidate-page .jr-btn{border:1px solid var(--border);border-radius:10px;padding:10px 13px;display:inline-flex;align-items:center;justify-content:center;gap:8px;font:inherit;font-weight:500;cursor:pointer;transition:background .15s,border-color .15s,color .15s;color:var(--text);background:var(--surface);white-space:nowrap;text-decoration:none}

.candidate-page .jr-btn:disabled{opacity:.55;cursor:not-allowed}

.candidate-page .jr-btn:hover:not(:disabled){border-color:var(--primary);background:var(--surface-2)}

.candidate-page .jr-primary{background:#5847e8;border-color:#5847e8;color:#fff}

.candidate-page .jr-primary:hover:not(:disabled){background:#4837d2;border-color:#4837d2;color:#fff}

.candidate-page .jr-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:18px}

.candidate-page .jr-stat,.candidate-page .jr-panel{background:var(--surface);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow)}

.candidate-page .jr-stat{padding:16px;min-width:0}

.candidate-page .jr-stat-top{display:flex;align-items:center;justify-content:space-between;gap:8px;color:var(--muted);font-size:12px}

.candidate-page .jr-stat-number{font-size:27px;font-weight:600;margin-top:11px;color:var(--text);overflow-wrap:anywhere}

.candidate-page .jr-stat-icon{width:34px;height:34px;border-radius:10px;background:var(--primary-soft);color:var(--primary);display:grid;place-items:center;flex-shrink:0}

.candidate-page .jr-panel{padding:16px;margin-bottom:16px;min-width:0;overflow:hidden}

.candidate-page .jr-toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:15px}

.candidate-page .jr-search{position:relative;display:flex;align-items:center;gap:9px;min-width:200px;flex:1;color:var(--muted);border:1px solid var(--border);border-radius:10px;padding:0 11px;background:var(--surface);height:42px}

.candidate-page .jr-search:focus-within{border-color:var(--primary);box-shadow:0 0 0 3px var(--primary-soft)}

.candidate-page .jr-search input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:var(--text);font:inherit}

.candidate-page .jr-search input::placeholder{color:var(--muted);opacity:.85}

.candidate-page .jr-search button{border:0;background:transparent;color:var(--muted);padding:3px;display:grid;place-items:center;cursor:pointer;border-radius:5px}

.candidate-page .jr-search button:hover{background:var(--surface-2)}

.candidate-page .jr-count{color:var(--muted);font-size:12px;white-space:nowrap}

.candidate-page .jr-table-wrap{width:100%;max-width:100%;overflow:auto;border-radius:10px;overscroll-behavior:contain;scrollbar-gutter:stable}

.candidate-page .jr-table-wrap::-webkit-scrollbar{width:8px;height:8px}

.candidate-page .jr-table-wrap::-webkit-scrollbar-thumb{background:var(--border);border-radius:8px}

.candidate-page .jr-table-wrap::-webkit-scrollbar-thumb:hover{background:var(--muted)}

.candidate-page .jr-table{width:100%;border-collapse:collapse;min-width:1160px;text-align:left;background:var(--surface);color:var(--text)}

.candidate-page .jr-table th{font-size:11px;font-weight:600;letter-spacing:.4px;text-transform:uppercase;color:var(--muted);padding:12px;border-bottom:1px solid var(--border);background:var(--surface-2);white-space:nowrap;position:sticky;top:0;z-index:2}

.candidate-page .jr-table td{padding:13px 12px;border-bottom:1px solid var(--border);vertical-align:middle;color:var(--text);font-size:12px;line-height:1.55}

.candidate-page .jr-table tbody tr{background:var(--surface);transition:background .15s}

.candidate-page .jr-table tbody tr:nth-child(even){background:var(--surface-2)}

.candidate-page .jr-table tbody tr:hover{background:var(--primary-soft)}

.candidate-page .jr-table tbody tr:last-child td{border-bottom:0}

.candidate-page .jr-candidate{display:flex;align-items:center;gap:10px;min-width:185px}

.candidate-page .jr-avatar{width:38px;height:38px;flex-shrink:0;border-radius:10px;display:grid;place-items:center;overflow:hidden;background:var(--primary-soft);color:var(--primary);font-weight:600;font-size:13px;border:1px solid var(--border)}

.candidate-page .jr-avatar img{width:100%;height:100%;object-fit:cover;display:block}

.candidate-page .jr-candidate-name{font-weight:600;color:var(--text);overflow-wrap:anywhere}

.candidate-page .jr-secondary{color:var(--muted);font-size:12px;line-height:1.55;overflow-wrap:anywhere}

.candidate-page .jr-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:500;white-space:nowrap}

.candidate-page .jr-active{background:var(--success-soft);color:var(--success)}

.candidate-page .jr-inactive{background:var(--danger-soft);color:var(--danger)}

.candidate-page .jr-actions{display:flex;gap:6px;align-items:center}

.candidate-page .jr-icon-btn{width:33px;height:33px;padding:0;border:1px solid var(--border);background:var(--surface);color:var(--muted);border-radius:8px;display:grid;place-items:center;cursor:pointer;transition:background .15s,border-color .15s,color .15s}

.candidate-page .jr-icon-btn:hover{border-color:var(--primary);color:var(--primary);background:var(--surface-2)}

.candidate-page .jr-view-link{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:32px;padding:6px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--text);font-size:12px;text-decoration:none;white-space:nowrap}

.candidate-page .jr-view-link:hover{border-color:var(--primary);color:var(--primary);background:var(--primary-soft)}

.candidate-page .jr-empty{padding:42px 18px;text-align:center;color:var(--muted);display:flex;align-items:center;flex-direction:column;gap:10px}

.candidate-page .jr-empty strong{color:var(--text);font-size:14px;font-weight:600}

.candidate-page .jr-state{padding:14px;border:1px solid var(--border);border-radius:10px;color:var(--muted);background:var(--surface);display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}

.candidate-page .jr-notice{padding:12px 14px;border-radius:9px;margin-bottom:14px;background:var(--primary-soft);border:1px solid var(--border);color:var(--text);line-height:1.5;overflow-wrap:anywhere}

.candidate-page .jr-error{background:var(--danger-soft);border-color:var(--danger);color:var(--danger)}

.candidate-page .jr-footer{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;padding:12px 2px 0;color:var(--muted);font-size:12px}

.candidate-page .jr-inline-link{display:inline-flex;align-items:center;gap:5px;color:var(--primary);text-decoration:none;font-size:12px;font-weight:500}

.candidate-page .jr-inline-link:hover{text-decoration:underline}

.candidate-page .jr-metric{font-weight:500;color:var(--text);white-space:nowrap}

@media(max-width:1100px){.candidate-page .jr-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}

@media(max-width:900px){.candidate-page{padding:20px}.candidate-page .jr-panel{padding:14px}}

@media(max-width:600px){.candidate-page{padding:14px}.candidate-page .jr-head{margin-bottom:16px;gap:12px}.candidate-page .jr-title{font-size:24px}.candidate-page .jr-subtitle{font-size:13px}.candidate-page .jr-head>div:last-child{width:100%}.candidate-page .jr-head>div:last-child .jr-btn{flex:1}.candidate-page .jr-stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.candidate-page .jr-stat{padding:12px}.candidate-page .jr-stat-number{font-size:23px}.candidate-page .jr-stat-top{font-size:11px}.candidate-page .jr-stat-icon{width:30px;height:30px}.candidate-page .jr-panel{padding:11px}.candidate-page .jr-toolbar{gap:8px}.candidate-page .jr-search{flex:1 1 100%;min-width:0}.candidate-page .jr-table{min-width:1160px}}

@media(prefers-reduced-motion:reduce){.candidate-page .jr-btn,.candidate-page .jr-icon-btn,.candidate-page .jr-table tbody tr{transition:none}}

      `}</style>

      <header className="jr-head">
        <div>
          <h1 className="jr-title">Candidates</h1>

          <p className="jr-subtitle">Manage candidate profiles, experience, education, compensation expectations and application documents.</p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="jr-btn" onClick={() => loadCandidates(search)} disabled={loading}>
            <RefreshCw size={15} />

            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>

      <section className="jr-stats">
        {[
          {
            label: "Candidates loaded",

            value: stats.total,

            icon: Users,
          },

          {
            label: "Education added",

            value: stats.withEducation,

            icon: GraduationCap,
          },

          {
            label: "Resumes available",

            value: stats.withResume,

            icon: FileText,
          },

          {
            label: "With experience",

            value: stats.experienced,

            icon: BriefcaseBusiness,
          },
        ].map(({ label, value, icon: Icon }) => (
          <div className="jr-stat" key={label}>
            <div className="jr-stat-top">
              <span>{label}</span>

              <span className="jr-stat-icon">
                <Icon size={17} />
              </span>
            </div>

            <div className="jr-stat-number">{value}</div>
          </div>
        ))}
      </section>

      <section className="jr-panel">
        <div
          style={{
            display: "flex",

            alignItems: "center",

            justifyContent: "space-between",

            gap: 12,

            flexWrap: "wrap",

            marginBottom: 15,
          }}>
          <div>
            <h2
              style={{
                fontSize: 15,

                fontWeight: 600,

                margin: 0,

                color: "var(--text)",
              }}>
              Candidate Directory
            </h2>

            <p className="jr-secondary" style={{ margin: "5px 0 0" }}>
              Review candidate profiles and recruitment details.
            </p>
          </div>

          <span className="jr-count">
            {rows.length} {rows.length === 1 ? "candidate" : "candidates"}
          </span>
        </div>

        <div className="jr-toolbar">
          <label className="jr-search">
            <Search size={17} />

            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, mobile, skills or company..." aria-label="Search candidates" />

            {search && (
              <button type="button" onClick={clearSearch} aria-label="Clear search" title="Clear search">
                <X size={16} />
              </button>
            )}
          </label>
        </div>

        {error && (
          <div className="jr-notice jr-error" role="alert">
            <div
              style={{
                display: "flex",

                justifyContent: "space-between",

                alignItems: "center",

                gap: 12,

                flexWrap: "wrap",
              }}>
              <span>{error}</span>

              <button type="button" className="jr-btn" onClick={() => loadCandidates(search)} disabled={loading}>
                Try again
              </button>
            </div>
          </div>
        )}

        {resumeActionError && (
          <div className="jr-notice jr-error" role="alert" style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span>{resumeActionError}</span>
              <button type="button" className="jr-btn" onClick={() => setResumeActionError("")}>
                Dismiss
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="jr-state">
            <span>Loading candidates...</span>

            <RefreshCw size={16} />
          </div>
        ) : (
          <div className="jr-table-wrap">
            <table className="jr-table">
              <thead>
                <tr>
                  <th>Candidate</th>

                  <th>Contact</th>

                  <th>Education</th>

                  <th>Experience</th>

                  <th>Current role</th>

                  <th>Current CTC</th>

                  <th>Expected CTC</th>

                  <th>Notice period</th>

                  <th>Resume</th>

                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((candidate) => {
                  const id = getId(candidate);

                  const resumeUrl = getResumeUrl(candidate);

                  const imageUrl = typeof candidate.profileImage === "string" ? candidate.profileImage : candidate.profileImage?.url || "";

                  const initials = String(candidate.fullName || "C")
                    .trim()

                    .split(/\s+/)

                    .slice(0, 2)

                    .map((part) => part[0] || "")

                    .join("")

                    .toUpperCase();

                  return (
                    <tr key={id}>
                      <td>
                        <div className="jr-candidate">
                          <div className="jr-avatar">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={`${candidate.fullName || "Candidate"} profile`}
                                loading="lazy"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              initials
                            )}
                          </div>

                          <div style={{ minWidth: 0 }}>
                            <div className="jr-candidate-name">{candidate.fullName || "Unnamed candidate"}</div>

                            <div className="jr-secondary">{candidate.location || "Location not specified"}</div>

                            <div className="jr-secondary">{getEmploymentLabel(candidate.employmentStatus)}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div>{candidate.email || "—"}</div>

                        <div className="jr-secondary">{candidate.mobile || "Mobile not specified"}</div>
                      </td>

                      <td>
                        <div>{getEducationSummary(candidate.education)}</div>

                        {Array.isArray(candidate.education) && candidate.education.length > 1 && <div className="jr-secondary">+{candidate.education.length - 1} more records</div>}
                      </td>

                      <td>
                        <span className="jr-metric">{Number(candidate.experienceYears || 0)} years</span>
                      </td>

                      <td>
                        <div>{candidate.currentJobTitle || "Not specified"}</div>

                        <div className="jr-secondary">{candidate.currentCompany || "Company not specified"}</div>
                      </td>

                      <td>
                        <span className="jr-metric">{formatCtc(candidate.currentCtc)}</span>
                      </td>

                      <td>
                        <span className="jr-metric">{formatCtc(candidate.expectedCtc)}</span>
                      </td>

                      <td>{candidate.noticePeriodDays == null ? "Not specified" : `${candidate.noticePeriodDays} days`}</td>

                      <td>
                        {getApplicationId(candidate) ? (
                          <div className="jr-actions">
                            <button type="button" className="jr-view-link" onClick={() => handleResumeAction(candidate, "preview")} disabled={resumeActionId.startsWith(`${getApplicationId(candidate)}:`)} aria-label={`View resume for ${candidate.fullName || "candidate"}`}>
                              <FileText size={14} />
                              {resumeActionId === `${getApplicationId(candidate)}:preview` ? "Opening..." : "View resume"}
                              <ExternalLink size={12} />
                            </button>
                            <button type="button" className="jr-icon-btn" onClick={() => handleResumeAction(candidate, "download")} disabled={resumeActionId.startsWith(`${getApplicationId(candidate)}:`)} aria-label={`Download resume for ${candidate.fullName || "candidate"}`} title="Download resume">
                              {resumeActionId === `${getApplicationId(candidate)}:download` ? "…" : <FileText size={15} />}
                            </button>
                          </div>
                        ) : resumeUrl ? (
                          <span className="jr-badge jr-inactive" title="This candidate record has no linked application ID">
                            Application unavailable
                          </span>
                        ) : (
                          <span className="jr-badge jr-inactive">Not available</span>
                        )}
                      </td>

                      <td>
                        <div className="jr-actions">
                          <Link className="jr-view-link" to={`/candidates/${id}`} aria-label={`View ${candidate.fullName || "candidate"} profile`}>
                            <Eye size={14} />
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!rows.length && (
                  <tr>
                    <td colSpan={10}>
                      <div className="jr-empty">
                        <Users size={30} />

                        <strong>No candidates found</strong>

                        <span>Try another search term or refresh the candidate list.</span>

                        {search && (
                          <button type="button" className="jr-btn" onClick={clearSearch}>
                            <X size={14} />
                            Clear search
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="jr-footer">
          <span>
            Showing {rows.length} loaded {rows.length === 1 ? "candidate" : "candidates"}
          </span>

          <span>
            {lastUpdated && !loading
              ? `Last updated ${lastUpdated.toLocaleTimeString("en-IN", {
                  hour: "2-digit",

                  minute: "2-digit",
                })}`
              : "Candidate directory"}
          </span>
        </div>
      </section>
    </div>
  );
}
