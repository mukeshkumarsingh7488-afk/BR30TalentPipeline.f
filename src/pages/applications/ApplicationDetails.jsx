import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, RefreshCw, Download } from "lucide-react";
import { getApplication, updateApplicationStatus, addApplicationNote, downloadResume } from "../../api/application.api.js";
const unwrap = (r) => r?.data?.data ?? r?.data ?? r;
export default function ApplicationDetails() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    setLoading(true);
    setError("");
    try {
      const d = unwrap(await getApplication(id));
      setItem(d);
      setStatus(d.status || "applied");
    } catch (e) {
      setError(e.message || "Unable to load application.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [id]);

  async function changeStatus() {
    if (!status) {
      setSuccess("");
      setError("Please select a new status.");
      return;
    }

    if (status === item?.status) {
      setSuccess("");
      setError("Please select a different status.");
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      await updateApplicationStatus(id, status);
      setSuccess("Application status updated successfully!");
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.response?.data?.error || e.message || "Failed to update status.");
    } finally {
      setBusy(false);
    }
  }

  async function addNote() {
    if (!note.trim()) return;
    setBusy(true);
    try {
      await addApplicationNote(id, note.trim());
      setNote("");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function resume() {
    setError("");
    setBusy(true);

    try {
      const response = await downloadResume(id);
      const blob = response instanceof Blob ? response : response?.data;

      if (!(blob instanceof Blob) || blob.size === 0) {
        throw new Error("Resume PDF was not returned by the server.");
      }

      const url = URL.createObjectURL(blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" }));

      const link = document.createElement("a");
      link.href = url;
      link.download = `resume-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(url), 3000);
    } catch (e) {
      setError(e.message || "Unable to download resume.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="tp-page">
      <style>{`.tp-page{padding:26px;color:var(--text)}.tp-panel{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:16px;overflow:visible}.tp-page h1{font-size:25px;font-weight:650}.tp-muted{color:var(--muted)}
.tp-input,.tp-select{width:100%;min-height:40px;padding:9px 11px;background:var(--input-bg);color:var(--text);border:1px solid var(--border);border-radius:8px;box-sizing:border-box;font:inherit;opacity:1;pointer-events:auto}
.tp-select{display:block;appearance:auto;-webkit-appearance:menulist;cursor:pointer;position:relative;z-index:1;color-scheme:dark}
.tp-select option{background:#191f2e;color:#eef2ff}
.tp-select:focus{outline:2px solid var(--primary,#8b7cff);outline-offset:1px}
.tp-action{display:inline-flex;align-items:center;gap:7px;padding:9px 12px;background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:8px;cursor:pointer}.tp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}.tp-error{padding:12px;border-radius:8px;background:#fff3f3;color:#9f2222;border:1px solid #edbcbc}@media(max-width:600px){.tp-page{padding:17px 12px}.tp-grid{grid-template-columns:1fr}.tp-panel{padding:14px}}`}</style>
      <Link to="/applications" className="tp-action" style={{ textDecoration: "none" }}>
        <ArrowLeft size={15} />
        Applications
      </Link>
      {loading ? (
        <p>Loading application…</p>
      ) : error && !item ? (
        <div className="tp-error">{error}</div>
      ) : (
        item && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", margin: "18px 0" }}>
              <div>
                <h1 style={{ margin: "0 0 6px" }}>{item.candidateId?.fullName || "Application details"}</h1>
                <p className="tp-muted">
                  {item.jobRoleId?.title || "Job role"} · {item.departmentId?.name || "Department"}
                </p>
              </div>
              <button className="tp-action" onClick={load}>
                <RefreshCw size={15} />
                Refresh
              </button>
            </div>

            {error && (
              <div
                className="tp-error"
                role="alert"
                style={{
                  marginBottom: 14,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}>
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setError("")}
                  aria-label="Close error message"
                  title="Close"
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "inherit",
                    cursor: "pointer",
                    fontSize: 22,
                    lineHeight: 1,
                    padding: "0 4px",
                  }}>
                  ×
                </button>
              </div>
            )}
            {success && (
              <div
                role="status"
                style={{
                  marginBottom: 14,
                  padding: 12,
                  borderRadius: 8,
                  background: "#eaf8ef",
                  color: "#18743b",
                  border: "1px solid #b8e5c5",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}>
                <span>{success}</span>
                <button
                  type="button"
                  onClick={() => setSuccess("")}
                  aria-label="Close success message"
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "inherit",
                    cursor: "pointer",
                    fontSize: 22,
                    lineHeight: 1,
                  }}>
                  ×
                </button>
              </div>
            )}

            <section className="tp-panel">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <h2 style={{ margin: 0 }}>Application status</h2>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "6px 12px",
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 600,
                    textTransform: "capitalize",
                    background: String(item.status).toLowerCase() === "hired" ? "#dcfce7" : String(item.status).toLowerCase() === "rejected" ? "#fee2e2" : "#e0e7ff",
                    color: String(item.status).toLowerCase() === "hired" ? "#166534" : String(item.status).toLowerCase() === "rejected" ? "#991b1b" : "#3730a3",
                  }}>
                  {(item.status || "screening").replace(/_/g, " ")}
                </span>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                <select className="tp-select" style={{ maxWidth: 240, width: "100%" }} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Application status">
                  <option value="">Select new status</option>
                  {[
                    ["screening", "Screening"],
                    ["shortlisted", "Shortlisted"],
                    ["interview", "Interview"],
                    ["offered", "Offered"],
                    ["hired", "Hired"],
                    ["rejected", "Rejected"],
                    ["withdrawn", "Withdrawn"],
                  ].map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <button className="tp-action" onClick={changeStatus}>
                  Update status
                </button>
                <button className="tp-action" onClick={resume}>
                  <Download size={15} />
                  Download resume
                </button>
              </div>
            </section>
            <div className="tp-grid">
              <section className="tp-panel">
                <h2>Candidate information</h2>
                <p>
                  <strong>Email:</strong> {item.candidateId?.email || "—"}
                </p>
                <p>
                  <strong>Mobile:</strong> {item.candidateId?.mobile || "—"}
                </p>
                <p>
                  <strong>Location:</strong> {item.candidateId?.location || "—"}
                </p>
                <p>
                  <strong>Experience:</strong> {item.candidateId?.experienceYears ?? 0} years
                </p>
              </section>
              <section className="tp-panel">
                <h2>Application information</h2>
                <p>
                  <strong>Applied:</strong> {item.submittedAt || item.createdAt ? new Date(item.submittedAt || item.createdAt).toLocaleString("en-IN") : "—"}
                </p>
                <p>
                  <strong>Expected salary:</strong> {item.expectedSalary ?? "Not provided"}
                </p>
                <p>
                  <strong>Cover letter:</strong>
                </p>
                <p className="tp-muted" style={{ whiteSpace: "pre-wrap" }}>
                  {item.coverLetter || "No cover letter provided."}
                </p>
              </section>
            </div>
            <section className="tp-panel">
              <h2>Internal notes</h2>
              <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                <textarea className="tp-input" rows="3" style={{ flex: 1, minWidth: 220 }} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a private recruitment note…" />
                <button className="tp-action" disabled={busy || !note.trim()} onClick={addNote}>
                  Add note
                </button>
              </div>
              {(item.internalNotes || []).map((n, i) => (
                <div key={n._id || i} style={{ borderTop: "1px solid var(--border)", padding: "12px 0", marginTop: 12 }}>
                  <p>{n.text}</p>
                  <small className="tp-muted">{n.createdAt ? new Date(n.createdAt).toLocaleString("en-IN") : ""}</small>
                </div>
              ))}
            </section>
          </>
        )
      )}
    </div>
  );
}
