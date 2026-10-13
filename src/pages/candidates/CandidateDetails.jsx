import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, RefreshCw, ExternalLink, FileText, Image as ImageIcon, X, Download, Code2, Globe, UserRound, BriefcaseBusiness, Eye, Mail, Phone, MapPin, GraduationCap, Wallet, CalendarDays, FolderKanban, Building2, Clock3, CheckCircle2, Link2, ClipboardList, Award } from "lucide-react";
import { getCandidate } from "../../api/candidate.api.js";
import { getResumePreview, downloadResume } from "../../api/application.api.js";

const unwrap = (response) => response?.data?.data ?? response?.data ?? response;

const firstValue = (...values) => values.find((value) => value !== null && value !== undefined && String(value).trim() !== "") ?? "";

const getFileUrl = (...values) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (value && typeof value === "object") {
      const url = value.url || value.secure_url || value.href;

      if (typeof url === "string" && url.trim()) {
        return url.trim();
      }
    }
  }

  return "";
};

const getLink = (value) => {
  if (typeof value !== "string" || !value.trim()) return "";

  try {
    const cleaned = value.trim();
    const url = new URL(/^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`);

    if (!["http:", "https:"].includes(url.protocol)) return "";
    if (!url.hostname.includes(".")) return "";

    return url.href;
  } catch {
    return "";
  }
};

const asArray = (value) => {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const formatMoney = (amount, currency = "INR") => {
  if (amount === null || amount === undefined || amount === "") {
    return "Not provided";
  }

  const value = Number(amount);

  if (!Number.isFinite(value)) return "Not provided";

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString("en-IN")}`;
  }
};

const formatDate = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const titleCase = (value) => {
  if (!value) return "Not provided";

  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const displayValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  if (typeof value === "boolean") return value ? "Yes" : "No";

  return value;
};

const getApplication = (candidate) => {
  if (candidate.application && typeof candidate.application === "object") {
    return candidate.application;
  }

  if (Array.isArray(candidate.applications) && candidate.applications.length) {
    return candidate.applications[0];
  }

  return {};
};

const getEducation = (candidate, application) => {
  const value = firstValue(Array.isArray(candidate.education) ? candidate.education : "", Array.isArray(application.education) ? application.education : "");

  return Array.isArray(value) ? value : [];
};

const getProjects = (candidate, application) => {
  const candidateProjects = Array.isArray(candidate.projects) ? candidate.projects : [];

  const applicationProjects = Array.isArray(application.projects) ? application.projects : [];

  return candidateProjects.length ? candidateProjects : applicationProjects;
};

const getEmploymentLabel = (value) => {
  const labels = {
    employed: "Employed",
    unemployed: "Unemployed",
    self_employed: "Self-employed",
    student: "Student",
    serving_notice: "Serving notice",
    other: "Other",
  };

  return labels[value] || titleCase(value);
};

function InfoItem({ label, value, icon: Icon, children }) {
  return (
    <div className="cd-info-item">
      <span className="cd-info-label">
        {Icon && <Icon size={13} />}
        {label}
      </span>
      {children || <div className="cd-info-value">{displayValue(value)}</div>}
    </div>
  );
}

function Section({ title, icon: Icon, children, action }) {
  return (
    <section className="cd-section">
      <header className="cd-section-head">
        <div className="cd-section-heading">
          <span className="cd-section-icon">
            <Icon size={17} />
          </span>
          <h2>{title}</h2>
        </div>
        {action}
      </header>
      <div className="cd-section-body">{children}</div>
    </section>
  );
}

function EmptyState({ children = "No information provided." }) {
  return <p className="cd-empty-text">{children}</p>;
}

export default function CandidateDetails() {
  const { id } = useParams();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);

  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState("");

  const load = useCallback(async () => {
    if (!id) {
      setError("Candidate ID is missing from the URL.");
      setItem(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await getCandidate(id);
      const data = unwrap(response);
      const candidate = data?.candidate ?? data;

      if (!candidate || typeof candidate !== "object" || !candidate._id) {
        setItem(null);
        setError("Candidate not found.");
        return;
      }

      setItem(candidate);
    } catch (err) {
      setItem(null);
      setError(err?.response?.data?.message || err?.response?.data?.error || err?.message || "Unable to load candidate details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!preview) return undefined;

    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setPreview(null);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;

      if (preview.blobUrl && preview.url) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [preview]);

  const candidate = item || {};
  const application = getApplication(candidate);

  const linkedin = getLink(firstValue(candidate.linkedinUrl, candidate.linkedin, candidate.linkedinProfile, candidate.linkedinProfileUrl, candidate.socialLinks?.linkedin, application.linkedinUrl));

  const github = getLink(firstValue(candidate.githubUrl, candidate.github, candidate.githubProfile, candidate.githubProfileUrl, candidate.socialLinks?.github, application.githubUrl));

  const portfolio = getLink(firstValue(candidate.portfolioUrl, candidate.portfolio, candidate.portfolioLink, candidate.portfolioWebsite, candidate.website, candidate.socialLinks?.portfolio, application.portfolioUrl));

  const resumeUrl = getFileUrl(candidate.resumeUrl, candidate.resume, application.resumeUrl, application.resume, candidate.documents?.resume, candidate.files?.resume);

  const imageUrl = getFileUrl(candidate.profileImageUrl, candidate.profileImage, candidate.imageUrl, candidate.photoUrl, candidate.avatarUrl, candidate.photo, candidate.image, application.profileImage);

  const skills = asArray(firstValue(candidate.skills, application.skills));

  const education = getEducation(candidate, application);
  const projects = getProjects(candidate, application);

  const coverLetter = firstValue(application.coverLetter, candidate.coverLetter);

  const openResume = async (mode = "preview") => {
    if (!application?._id) {
      setResumeError("Application ID is missing.");
      return;
    }

    let objectUrl = "";
    let openedWindow = null;

    try {
      setResumeLoading(true);
      setResumeError("");

      // Open the tab immediately to avoid popup blockers.
      if (mode === "open") {
        openedWindow = window.open("about:blank", "_blank");

        if (!openedWindow) {
          throw new Error("Allow pop-ups to open the resume.");
        }

        openedWindow.opener = null;
        openedWindow.document.title = "Loading resume...";
        openedWindow.document.body.innerHTML = '<p style="font-family:Arial,sans-serif;padding:24px">Loading resume...</p>';
      }

      // The custom http.js returns the Blob directly, not response.data.
      const pdfBlob = mode === "download" ? await downloadResume(application._id) : await getResumePreview(application._id);

      if (!(pdfBlob instanceof Blob) || pdfBlob.size === 0) {
        throw new Error("The server did not return a valid PDF file.");
      }

      if (pdfBlob.type && !pdfBlob.type.includes("pdf") && !pdfBlob.type.includes("octet-stream")) {
        throw new Error("The server response is not a PDF.");
      }

      objectUrl = URL.createObjectURL(pdfBlob.type === "application/pdf" ? pdfBlob : new Blob([pdfBlob], { type: "application/pdf" }));

      if (mode === "preview") {
        setPreview({
          title: resumeName,
          url: objectUrl,
          type: "pdf",
          blobUrl: true,
        });

        // The preview effect will revoke this URL when the modal closes.
        objectUrl = "";
        return;
      }

      if (mode === "open") {
        openedWindow.location.href = objectUrl;

        // Keep the URL alive long enough for the new tab to load the PDF.
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 5 * 60 * 1000);
        objectUrl = "";
        return;
      }

      if (mode === "download") {
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = resumeName.toLowerCase().endsWith(".pdf") ? resumeName : `${resumeName}.pdf`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        objectUrl = "";
      }
    } catch (err) {
      if (openedWindow && !openedWindow.closed) {
        openedWindow.close();
      }

      setResumeError(err?.message || "Unable to open or download the resume.");
    } finally {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }

      setResumeLoading(false);
    }
  };

  const expectedSalary = firstValue(application.expectedSalary, application.expectedAnnualSalary);

  const salaryCurrency = firstValue(application.salaryCurrency, "INR");

  const applicationStatus = firstValue(application.status, candidate.applicationStatus);

  const jobRole = application.jobRoleId;
  const department = application.departmentId;

  const resumeFile = application.resume || candidate.resume || {};
  const resumeName = resumeFile?.originalName || resumeFile?.originalname || "Resume document";

  const resumeSize = firstValue(resumeFile?.bytes, resumeFile?.sizeBytes, resumeFile?.size);

  const initials = String(candidate.fullName || "C")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();

  return (
    <div className="jr-page cd-page">
      <style>{`
.cd-page{--bg:#f5f7fb;--surface:#fff;--surface-2:#f8fafc;--text:#182230;--muted:#657286;--border:#e2e8f0;--primary:#5847e8;--primary-soft:#edf2ff;--success:#137a50;--success-soft:#e9f8f0;--danger:#b42332;--danger-soft:#fff0f1;--shadow:0 2px 8px rgba(16,24,40,.04);width:100%;min-width:0;min-height:calc(100vh - 120px);padding:24px;box-sizing:border-box;color:var(--text);background:var(--bg);font-size:14px;color-scheme:light}
:is(html[data-theme="dark"],body[data-theme="dark"],html.dark,body.dark,[data-theme="dark"],.dark) .cd-page,.cd-page:is([data-theme="dark"],.dark){--bg:#0f1420;--surface:#191f2e;--surface-2:#20283a;--text:#eef2ff;--muted:#a2abc3;--border:#2b3449;--primary:#8b7cff;--primary-soft:rgba(101,86,232,.18);--success:#54d99e;--success-soft:rgba(38,181,120,.14);--danger:#ff9292;--danger-soft:rgba(220,90,90,.14);--shadow:0 2px 10px rgba(0,0,0,.16);color:var(--text);background:var(--bg);color-scheme:dark}
.cd-page *{box-sizing:border-box}
.cd-page .cd-breadcrumb{display:inline-flex;align-items:center;gap:8px;margin-bottom:22px;color:var(--muted);font-size:13px;text-decoration:none}
.cd-page .cd-breadcrumb:hover{color:var(--primary)}
.cd-page .cd-header{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;margin-bottom:22px}
.cd-page .cd-profile{display:flex;align-items:center;gap:15px;min-width:0}
.cd-page .cd-avatar{width:68px;height:68px;flex-shrink:0;border-radius:14px;border:1px solid var(--border);background:var(--surface-2);object-fit:cover}
.cd-page .cd-avatar-fallback{display:grid;place-items:center;color:var(--primary);font-size:21px;font-weight:600;background:var(--primary-soft)}
.cd-page .cd-name{font-size:26px;line-height:1.25;font-weight:600;letter-spacing:-.4px;margin:0 0 7px;color:var(--text);overflow-wrap:anywhere}
.cd-page .cd-subtitle{font-size:13px;color:var(--muted);margin:0;line-height:1.65}
.cd-page .cd-header-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.cd-page .cd-btn{border:1px solid var(--border);border-radius:10px;padding:10px 13px;min-height:39px;display:inline-flex;align-items:center;justify-content:center;gap:8px;font:inherit;font-weight:500;cursor:pointer;transition:background .15s,border-color .15s,color .15s;color:var(--text);background:var(--surface);white-space:nowrap;text-decoration:none}
.cd-page .cd-btn:hover{border-color:var(--primary);background:var(--surface-2)}
.cd-page .cd-btn:disabled{opacity:.55;cursor:not-allowed}
.cd-page .cd-primary{background:#5847e8;border-color:#5847e8;color:#fff}
.cd-page .cd-primary:hover{background:#4837d2;border-color:#4837d2;color:#fff}
.cd-page .cd-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:18px}
.cd-page .cd-stat{padding:15px;background:var(--surface);border:1px solid var(--border);border-radius:13px;box-shadow:var(--shadow);min-width:0}
.cd-page .cd-stat-top{display:flex;justify-content:space-between;align-items:center;gap:8px;color:var(--muted);font-size:12px}
.cd-page .cd-stat-icon{width:32px;height:32px;display:grid;place-items:center;flex-shrink:0;border-radius:9px;background:var(--primary-soft);color:var(--primary)}
.cd-page .cd-stat-value{margin-top:10px;font-size:20px;line-height:1.4;font-weight:600;color:var(--text);overflow-wrap:anywhere}
.cd-page .cd-section{margin-bottom:16px;background:var(--surface);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow);overflow:hidden;min-width:0}
.cd-page .cd-section-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 17px;background:var(--surface-2);border-bottom:1px solid var(--border)}
.cd-page .cd-section-heading{display:flex;align-items:center;gap:10px;min-width:0}
.cd-page .cd-section-icon{width:31px;height:31px;flex-shrink:0;display:grid;place-items:center;border-radius:9px;background:var(--primary-soft);color:var(--primary)}
.cd-page .cd-section-head h2{margin:0;font-size:14px;font-weight:600;color:var(--text)}
.cd-page .cd-section-body{padding:19px}
.cd-page .cd-info-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px 24px}
.cd-page .cd-info-item{min-width:0}
.cd-page .cd-info-label{display:flex;align-items:center;gap:6px;margin-bottom:7px;color:var(--muted);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.035em}
.cd-page .cd-info-label svg{flex-shrink:0}
.cd-page .cd-info-value{font-size:13px;line-height:1.7;color:var(--text);overflow-wrap:anywhere;white-space:pre-wrap}
.cd-page .cd-muted{color:var(--muted)}
.cd-page .cd-description{font-size:13px;line-height:1.8;color:var(--text);white-space:pre-wrap;overflow-wrap:anywhere}
.cd-page .cd-skills{display:flex;flex-wrap:wrap;gap:8px}
.cd-page .cd-skill{padding:6px 10px;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--text);font-size:12px;overflow-wrap:anywhere}
.cd-page .cd-grid-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.cd-page .cd-item-card{min-width:0;padding:15px;border:1px solid var(--border);border-radius:11px;background:var(--surface)}
.cd-page .cd-item-card h3{margin:0 0 6px;font-size:14px;font-weight:600;line-height:1.5;color:var(--text);overflow-wrap:anywhere}
.cd-page .cd-item-card p{margin:6px 0 0;font-size:12px;line-height:1.7;color:var(--muted);white-space:pre-wrap;overflow-wrap:anywhere}
.cd-page .cd-item-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
.cd-page .cd-item-number{width:29px;height:29px;display:grid;place-items:center;flex-shrink:0;border:1px solid var(--border);border-radius:8px;background:var(--surface-2);color:var(--primary);font-size:12px;font-weight:600}
.cd-page .cd-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:500;white-space:nowrap;background:var(--primary-soft);color:var(--primary)}
.cd-page .cd-badge-success{background:var(--success-soft);color:var(--success)}
.cd-page .cd-badge-danger{background:var(--danger-soft);color:var(--danger)}
.cd-page .cd-links{display:flex;flex-wrap:wrap;gap:9px}
.cd-page .cd-link{display:inline-flex;align-items:center;gap:8px;padding:9px 12px;border:1px solid var(--border);border-radius:9px;background:var(--surface);color:var(--text);font-size:12px;font-weight:500;text-decoration:none;transition:border-color .15s,color .15s}
.cd-page .cd-link:hover{border-color:var(--primary);color:var(--primary)}
.cd-page .cd-file-card{display:flex;align-items:flex-start;gap:13px;min-width:0;padding:15px;border:1px solid var(--border);border-radius:11px;background:var(--surface)}
.cd-page .cd-file-icon{width:42px;height:42px;display:grid;place-items:center;flex-shrink:0;border-radius:10px;background:var(--primary-soft);color:var(--primary)}
.cd-page .cd-file-info{min-width:0;flex:1}
.cd-page .cd-file-info strong{display:block;margin-bottom:5px;font-size:13px;font-weight:600;color:var(--text);overflow-wrap:anywhere}
.cd-page .cd-file-info>span{display:block;font-size:11px;line-height:1.7;color:var(--muted);overflow-wrap:anywhere}
.cd-page .cd-file-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:11px}
.cd-page .cd-small-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:7px 9px;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--text);font-size:11px;font-weight:500;text-decoration:none;cursor:pointer}
.cd-page .cd-small-btn:hover{background:var(--surface-2);border-color:var(--primary);color:var(--primary)}
.cd-page .cd-empty{padding:18px;border:1px dashed var(--border);border-radius:10px;background:var(--surface-2);color:var(--muted);font-size:12px;line-height:1.7}
.cd-page .cd-loading{display:flex;align-items:center;justify-content:center;gap:10px;min-height:180px;color:var(--muted)}
.cd-page .cd-error{padding:15px;border:1px solid var(--danger);background:var(--danger-soft);color:var(--danger);border-radius:10px;font-size:13px;line-height:1.7}
.cd-page .cd-preview-backdrop{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(4,8,20,.78);backdrop-filter:blur(5px)}
.cd-page .cd-preview-modal{display:flex;flex-direction:column;width:min(1100px,96vw);height:min(850px,92vh);min-height:300px;background:var(--surface);border:1px solid var(--border);border-radius:13px;overflow:hidden;box-shadow:0 25px 90px rgba(0,0,0,.4)}
.cd-page .cd-preview-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 15px;border-bottom:1px solid var(--border);background:var(--surface)}
.cd-page .cd-preview-title{font-size:14px;font-weight:600;color:var(--text);overflow-wrap:anywhere}
.cd-page .cd-preview-controls{display:flex;align-items:center;gap:8px}
.cd-page .cd-preview-content{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;overflow:auto;padding:12px;background:var(--surface-2)}
.cd-page .cd-preview-image{display:block;max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain}
.cd-page .cd-preview-frame{width:100%;height:100%;min-height:0;border:0;background:#fff}
@media(max-width:1050px){.cd-page .cd-info-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.cd-page .cd-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:700px){.cd-page{padding:17px 12px}.cd-page .cd-header{align-items:flex-start}.cd-page .cd-profile{align-items:flex-start;gap:11px}.cd-page .cd-avatar{width:53px;height:53px;border-radius:11px}.cd-page .cd-name{font-size:21px}.cd-page .cd-subtitle{font-size:12px}.cd-page .cd-header-actions{width:100%}.cd-page .cd-header-actions .cd-btn{flex:1}.cd-page .cd-section-body{padding:14px}.cd-page .cd-section-head{padding:12px}.cd-page .cd-info-grid,.cd-page .cd-grid-cards{grid-template-columns:1fr;gap:17px}.cd-page .cd-stats{gap:9px}.cd-page .cd-stat{padding:12px}.cd-page .cd-stat-value{font-size:18px}.cd-page .cd-stat-top{font-size:11px}.cd-page .cd-stat-icon{width:29px;height:29px}.cd-page .cd-preview-backdrop{padding:8px}.cd-page .cd-preview-modal{width:100%;height:90vh}.cd-page .cd-preview-head{align-items:flex-start}.cd-page .cd-preview-controls{gap:5px}.cd-page .cd-preview-controls .cd-small-btn{padding:7px}}
@media(prefers-reduced-motion:reduce){.cd-page *{transition:none!important}}
      `}</style>

      <Link className="cd-breadcrumb" to="/candidates">
        <ArrowLeft size={16} />
        Back to Candidates
      </Link>

      {loading ? (
        <div className="cd-loading">
          <RefreshCw size={17} />
          Loading candidate details...
        </div>
      ) : error ? (
        <div className="cd-error" role="alert">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}>
            <span>{error}</span>
            <button type="button" className="cd-btn" onClick={load}>
              <RefreshCw size={14} />
              Try again
            </button>
          </div>
        </div>
      ) : item ? (
        <>
          <header className="cd-header">
            <div className="cd-profile">
              {imageUrl ? (
                <img
                  className="cd-avatar"
                  src={imageUrl}
                  alt={`${candidate.fullName || "Candidate"} profile`}
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="cd-avatar cd-avatar-fallback">{initials || <UserRound size={25} />}</div>
              )}

              <div style={{ minWidth: 0 }}>
                <h1 className="cd-name">{candidate.fullName || "Candidate profile"}</h1>
                <p className="cd-subtitle">
                  {candidate.currentJobTitle || "Candidate profile"}
                  {candidate.currentCompany ? ` · ${candidate.currentCompany}` : ""}
                </p>
                <p className="cd-subtitle" style={{ marginTop: 5 }}>
                  {candidate.location || "Location not provided"}
                </p>
              </div>
            </div>

            <div className="cd-header-actions">
              <button type="button" className="cd-btn" onClick={load} disabled={loading}>
                <RefreshCw size={15} />
                Refresh
              </button>
            </div>
          </header>

          <section className="cd-stats">
            {[
              {
                label: "Experience",
                value: `${Number(candidate.experienceYears || 0)} years`,
                icon: BriefcaseBusiness,
              },
              {
                label: "Education records",
                value: education.length,
                icon: GraduationCap,
              },
              {
                label: "Skills",
                value: skills.length,
                icon: Award,
              },
              {
                label: "Projects",
                value: projects.length,
                icon: FolderKanban,
              },
            ].map(({ label, value, icon: Icon }) => (
              <div className="cd-stat" key={label}>
                <div className="cd-stat-top">
                  <span>{label}</span>
                  <span className="cd-stat-icon">
                    <Icon size={16} />
                  </span>
                </div>
                <div className="cd-stat-value">{value}</div>
              </div>
            ))}
          </section>

          <Section title="Personal Information" icon={UserRound}>
            <div className="cd-info-grid">
              <InfoItem label="Full name" value={candidate.fullName} />
              <InfoItem label="Email address" value={candidate.email} icon={Mail} />
              <InfoItem label="Mobile number" value={candidate.mobile} icon={Phone} />
              <InfoItem label="Location" value={candidate.location} icon={MapPin} />
              <InfoItem label="Candidate ID" value={candidate._id} />
              <InfoItem label="Profile created" value={formatDate(candidate.createdAt)} icon={CalendarDays} />
              <InfoItem label="Last updated" value={formatDate(candidate.updatedAt)} icon={Clock3} />
            </div>
          </Section>

          <Section title="Professional & Employment Details" icon={BriefcaseBusiness}>
            <div className="cd-info-grid">
              <InfoItem label="Current job title" value={candidate.currentJobTitle} />
              <InfoItem label="Current company" value={candidate.currentCompany} icon={Building2} />
              <InfoItem label="Employment status" value={getEmploymentLabel(candidate.employmentStatus)} />
              <InfoItem label="Total experience" value={candidate.experienceYears == null ? "Not provided" : `${candidate.experienceYears} years`} />
              <InfoItem label="Notice period" value={candidate.noticePeriodDays == null ? "Not provided" : `${candidate.noticePeriodDays} days`} icon={Clock3} />
              <InfoItem label="Candidate source" value={titleCase(candidate.source)} />
            </div>
          </Section>

          <Section title="Compensation Details" icon={Wallet}>
            <div className="cd-info-grid">
              <InfoItem label="Current CTC" value={formatMoney(candidate.currentCtc)} />
              <InfoItem label="Expected CTC" value={formatMoney(candidate.expectedCtc)} />
              <InfoItem label="Application expected salary" value={expectedSalary === "" ? "Not provided" : formatMoney(expectedSalary, salaryCurrency)} />
              <InfoItem label="Application currency" value={salaryCurrency} />
            </div>
          </Section>

          <Section title="Education & Qualifications" icon={GraduationCap}>
            {education.length ? (
              <div className="cd-grid-cards">
                {education.map((entry, index) => (
                  <article className="cd-item-card" key={`${entry.qualification || "education"}-${index}`}>
                    <div className="cd-item-top">
                      <div style={{ minWidth: 0 }}>
                        <h3>{entry.qualification || entry.fieldOfStudy || "Education record"}</h3>
                        <p style={{ marginTop: 0 }}>{entry.institution || "Institution not provided"}</p>
                      </div>
                      <span className="cd-item-number">{index + 1}</span>
                    </div>

                    <div className="cd-info-grid" style={{ marginTop: 17 }}>
                      <InfoItem label="Qualification" value={entry.qualification} />
                      <InfoItem label="Field of study" value={entry.fieldOfStudy} />
                      <InfoItem label="Institution" value={entry.institution} />
                      <InfoItem label="Graduation year" value={entry.graduationYear} />
                      <InfoItem label="Grade / score" value={entry.grade} />
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState>No education details were provided in the available candidate data.</EmptyState>
            )}
          </Section>

          <Section title="Skills & Expertise" icon={Award}>
            {skills.length ? (
              <div className="cd-skills">
                {skills.map((skill, index) => (
                  <span className="cd-skill" key={`${skill}-${index}`}>
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <EmptyState>No skills were provided.</EmptyState>
            )}
          </Section>

          <Section title="Projects & Portfolio Work" icon={FolderKanban}>
            {projects.length ? (
              <div className="cd-grid-cards">
                {projects.map((project, index) => {
                  const projectUrl = getLink(project.url);
                  const technologies = asArray(project.technologies);

                  return (
                    <article className="cd-item-card" key={`${project.name || "project"}-${index}`}>
                      <div className="cd-item-top">
                        <div style={{ minWidth: 0 }}>
                          <h3>{project.name || `Project ${index + 1}`}</h3>
                          {project.description && <p>{project.description}</p>}
                        </div>
                        <span className="cd-item-number">{index + 1}</span>
                      </div>

                      {technologies.length > 0 && (
                        <div style={{ marginTop: 14 }}>
                          <span className="cd-info-label">Technologies used</span>
                          <div className="cd-skills">
                            {technologies.map((technology, technologyIndex) => (
                              <span className="cd-skill" key={`${technology}-${technologyIndex}`}>
                                {technology}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {projectUrl && (
                        <div style={{ marginTop: 14 }}>
                          <a className="cd-link" href={projectUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink size={14} />
                            Open project
                          </a>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <EmptyState>No project details were provided.</EmptyState>
            )}
          </Section>

          <Section title="Links & Social Profiles" icon={Globe}>
            <div className="cd-links">
              {linkedin && (
                <a className="cd-link" href={linkedin} target="_blank" rel="noopener noreferrer">
                  <Globe size={16} />
                  LinkedIn profile
                  <ExternalLink size={13} />
                </a>
              )}

              {github && (
                <a className="cd-link" href={github} target="_blank" rel="noopener noreferrer">
                  <Code2 size={16} />
                  GitHub profile
                  <ExternalLink size={13} />
                </a>
              )}

              {portfolio && (
                <a className="cd-link" href={portfolio} target="_blank" rel="noopener noreferrer">
                  <Link2 size={16} />
                  Portfolio website
                  <ExternalLink size={13} />
                </a>
              )}

              {!linkedin && !github && !portfolio && <EmptyState>No LinkedIn, GitHub or portfolio links were provided.</EmptyState>}
            </div>
          </Section>

          <Section title="Application Information" icon={ClipboardList}>
            <div className="cd-info-grid">
              <InfoItem label="Application status" value={applicationStatus ? titleCase(applicationStatus) : "Not available in candidate response"} />
              <InfoItem label="Job role" value={typeof jobRole === "object" ? jobRole?.title || jobRole?.name : jobRole} />
              <InfoItem label="Department" value={typeof department === "object" ? department?.name || department?.title : department} />
              <InfoItem label="Application submitted" value={formatDate(application.submittedAt || application.createdAt)} />
              <InfoItem label="Application reviewed" value={formatDate(application.reviewedAt)} />
              <InfoItem label="Application ID" value={application._id} />
            </div>
          </Section>

          <Section title="Cover Letter & Additional Information" icon={FileText}>
            {coverLetter ? <div className="cd-description">{coverLetter}</div> : <EmptyState>No cover letter was provided.</EmptyState>}

            {application.internalNotes && typeof application.internalNotes === "string" && (
              <div style={{ marginTop: 18 }}>
                <span className="cd-info-label">Additional notes</span>
                <div className="cd-description">{application.internalNotes}</div>
              </div>
            )}
          </Section>

          <Section title="Resume & Profile Image" icon={FileText}>
            <div className="cd-grid-cards">
              <div className="cd-file-card">
                <div className="cd-file-icon">
                  <FileText size={22} />
                </div>

                <div className="cd-file-info">
                  <strong>{resumeName}</strong>
                  {resumeError && (
                    <div className="cd-error" role="alert">
                      {resumeError}
                    </div>
                  )}
                  <span>{resumeUrl ? "Resume URL is available in the returned data." : "Resume is not available in this candidate response."}</span>

                  {resumeSize !== "" && <span>File size: {Number(resumeSize) >= 1024 * 1024 ? `${(Number(resumeSize) / (1024 * 1024)).toFixed(2)} MB` : `${Math.max(0, Number(resumeSize))} bytes`}</span>}

                  {resumeUrl && (
                    <div className="cd-file-actions">
                      <div className="cd-file-actions">
                        <button type="button" className="cd-small-btn" onClick={() => openResume("preview")} disabled={resumeLoading}>
                          <Eye size={14} />
                          Preview
                        </button>

                        <button type="button" className="cd-small-btn" onClick={() => openResume("open")} disabled={resumeLoading}>
                          <ExternalLink size={14} />
                          {resumeLoading ? "Opening..." : "Open"}
                        </button>

                        <button type="button" className="cd-small-btn" onClick={() => openResume("download")} disabled={resumeLoading}>
                          <Download size={14} />
                          Download
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="cd-file-card">
                <div className="cd-file-icon">
                  <ImageIcon size={22} />
                </div>

                <div className="cd-file-info">
                  <strong>Candidate profile image</strong>
                  <span>{imageUrl ? "Profile image is available." : "No profile image was provided."}</span>

                  {imageUrl && (
                    <div className="cd-file-actions">
                      <button
                        type="button"
                        className="cd-small-btn"
                        onClick={() =>
                          setPreview({
                            title: "Candidate profile image",
                            url: imageUrl,
                            type: "image",
                          })
                        }>
                        <Eye size={14} />
                        Preview image
                      </button>

                      <a className="cd-small-btn" href={imageUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink size={14} />
                        Open image
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {!resumeUrl && (
              <div className="cd-empty" style={{ marginTop: 12 }}>
                If the resume was uploaded with the job application, its metadata may belong to the Application record instead of the Candidate record. The candidate endpoint must return the appropriate resume data, or the application resume-download endpoint must be used.
              </div>
            )}
          </Section>

          {preview && (
            <div
              className="cd-preview-backdrop"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  setPreview(null);
                }
              }}>
              <section className="cd-preview-modal" role="dialog" aria-modal="true" aria-label={preview.title}>
                <div className="cd-preview-head">
                  <span className="cd-preview-title">{preview.title}</span>

                  <div className="cd-preview-controls">
                    <a className="cd-small-btn" href={preview.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={14} />
                      Open separately
                    </a>

                    <button type="button" className="cd-btn" onClick={() => setPreview(null)} aria-label="Close preview">
                      <X size={17} />
                    </button>
                  </div>
                </div>

                <div className="cd-preview-content">{preview.type === "image" ? <img className="cd-preview-image" src={preview.url} alt="Candidate profile preview" /> : <iframe className="cd-preview-frame" src={preview.url} title="Candidate resume PDF preview" />}</div>
              </section>
            </div>
          )}
        </>
      ) : (
        <div className="cd-empty">Candidate not found.</div>
      )}
    </div>
  );
}
