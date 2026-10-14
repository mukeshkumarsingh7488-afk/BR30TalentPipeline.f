import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Clock3, MapPin, Plus, RefreshCw, Trash2, Video, X } from "lucide-react";
import { getInterviews, createInterview, updateInterview, deleteInterview } from "../../api/interview.api.js";
import { getApplications } from "../../api/application.api.js";

const unwrap = (response) => response?.data?.data ?? response?.data ?? response;
const listFrom = (response, keys = []) => {
  const value = unwrap(response);
  if (Array.isArray(value)) return value;
  for (const key of keys) if (Array.isArray(value?.[key])) return value[key];
  return [];
};
const messageFrom = (error, fallback) => error?.data?.message || error?.response?.data?.message || error?.message || fallback;
const dateText = (value) => (value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—");
const emptyForm = { applicationId: "", scheduledAt: "", durationMinutes: 30, mode: "online", meetingLink: "", location: "", interviewer: "", notes: "" };
const statusLabel = (value) =>
  String(value || "scheduled")
    .replace(/_/g, " ")
    .replace(/^./, (letter) => letter.toUpperCase());

export default function Interviews() {
  const [rows, setRows] = useState([]);
  const [applications, setApplications] = useState([]);
  const [candidateSearch, setCandidateSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getInterviews({ status, search: search.trim() });
      setRows(listFrom(response, ["interviews", "items"]));
    } catch (requestError) {
      setError(messageFrom(requestError, "Unable to load interviews."));
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  const loadApplications = useCallback(async () => {
    setApplicationsLoading(true);

    try {
      const response = await getApplications({
        page: 1,
        limit: 100,
        status: "interview",
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      setApplications(listFrom(response, ["applications", "items"]));
    } catch (requestError) {
      setError(messageFrom(requestError, "Unable to load interview candidates."));
    } finally {
      setApplicationsLoading(false);
    }
  }, []);

  const filteredApplications = useMemo(() => {
    const query = candidateSearch.trim().toLowerCase();

    if (!query) return applications;

    return applications.filter((application) => {
      const candidate = application.candidateId || {};

      return [candidate.fullName, candidate.email, candidate.mobile].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [applications, candidateSearch]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (showForm && applications.length === 0) loadApplications();
  }, [showForm, applications.length, loadApplications]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const candidate = row.candidateId || row.applicationId?.candidateId || {};
      const role = row.jobRoleId || row.applicationId?.jobRoleId || {};
      const matchesStatus = status === "all" || row.status === status;
      const searchable = [candidate.fullName, candidate.email, role.title, row.interviewer, row.location].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query)
      );
      return matchesStatus && (!query || searchable);
    });
  }, [rows, search, status]);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (!form.applicationId) throw new Error("Please select an application.");
      if (!form.scheduledAt) throw new Error("Please select the interview date and time.");
      await createInterview({ ...form, scheduledAt: new Date(form.scheduledAt).toISOString(), durationMinutes: Number(form.durationMinutes) });
      setForm(emptyForm);
      setShowForm(false);
      setNotice("Interview scheduled successfully.");
      await load();
    } catch (requestError) {
      setError(messageFrom(requestError, "Unable to schedule interview."));
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(row, nextStatus) {
    if (row.status === nextStatus) return;
    setError("");
    try {
      await updateInterview(row._id, { status: nextStatus });
      setNotice("Interview status updated.");
      await load();
    } catch (requestError) {
      setError(messageFrom(requestError, "Unable to update interview status."));
    }
  }

  async function remove(row) {
    const candidateName = row.candidateId?.fullName || "this interview";
    if (!window.confirm(`Delete the interview for ${candidateName}?`)) return;
    setError("");
    try {
      await deleteInterview(row._id);
      setNotice("Interview deleted.");
      await load();
    } catch (requestError) {
      setError(messageFrom(requestError, "Unable to delete interview."));
    }
  }

  return (
    <div className="jr-page tp-interviews-page">
      <style>{`
        .tp-i-no-candidates{display:block;color:#D97706;font-size:inherit;font-weight:inherit;margin-top:6px;padding:8px 10px;background:rgba(217,119,6,0.08);border:1px solid rgba(217,119,6,0.22);border-radius:8px}
        .tp-interviews-page{--bg:#f5f7fb;--surface:#fff;--surface-2:#f8fafc;--text:#182230;--muted:#657286;--border:#e2e8f0;--primary:#5847e8;--primary-soft:#edf2ff;--danger:#b42332;--shadow:0 2px 8px rgba(16,24,40,.04);width:100%;min-width:0;min-height:100%;padding:24px;box-sizing:border-box;color:var(--text);background:var(--bg);font-size:14px}
        :is(html[data-theme="dark"],body[data-theme="dark"],html.dark,body.dark,[data-theme="dark"],.dark) .tp-interviews-page{--bg:#0f1420;--surface:#191f2e;--surface-2:#20283a;--text:#eef2ff;--muted:#a2abc3;--border:#2b3449;--primary:#8b7cff;--primary-soft:rgba(101,86,232,.18);--danger:#ff9292;--shadow:0 2px 10px rgba(0,0,0,.16);color:var(--text);background:var(--bg);color-scheme:dark}
        .tp-i-candidate-clear{display:flex;align-items:center;justify-content:center;flex-shrink:0;width:26px;height:26px;padding:0;border:0;border-radius:5px;background:transparent;color:var(--muted);cursor:pointer}
        .tp-i-candidate-clear:hover{background:transparent;color:var(--muted)}
        .tp-i-candidate-clear:focus-visible{outline:2px solid var(--primary);outline-offset:2px}
        .tp-interviews-page *{box-sizing:border-box}.tp-i-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap;margin:0 0 20px}.tp-i-title{font-size:28px;line-height:1.2;font-weight:600;margin:0;color:var(--text)}.tp-i-subtitle{margin:8px 0 0;color:var(--muted);line-height:1.6}.tp-i-actions{display:flex;gap:8px;flex-wrap:wrap}.tp-i-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:40px;padding:9px 13px;border:1px solid var(--border);border-radius:9px;background:var(--surface);color:var(--text);font:inherit;font-weight:500;cursor:pointer;white-space:nowrap}.tp-i-btn:hover:not(:disabled){border-color:var(--primary);background:var(--surface-2)}.tp-i-btn:disabled{opacity:.6;cursor:not-allowed}.tp-i-primary{background:#5847e8;color:#fff;border-color:#5847e8}.tp-i-primary:hover:not(:disabled){background:#4837d2;color:#fff}.tp-i-panel{min-width:0;padding:16px;background:var(--surface);border:1px solid var(--border);border-radius:13px;box-shadow:var(--shadow);margin-bottom:16px}.tp-i-toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px}.tp-i-search{flex:1;min-width:220px;height:42px;display:flex;align-items:center;gap:9px;padding:0 11px;border:1px solid var(--border);border-radius:9px;background:var(--surface);color:var(--muted)}.tp-i-search:focus-within{border-color:var(--primary);box-shadow:0 0 0 3px var(--primary-soft)}.tp-i-search input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:var(--text);font:inherit}.tp-i-field{display:grid;gap:6px;min-width:0;color:var(--muted);font-size:12px}.tp-i-input,.tp-i-select,.tp-i-textarea{width:100%;min-width:0;min-height:41px;padding:9px 11px;border:1px solid var(--border);border-radius:9px;background:var(--surface);color:var(--text);font:inherit;outline:none}.tp-i-input:focus,.tp-i-select:focus,.tp-i-textarea:focus{border-color:var(--primary);box-shadow:0 0 0 3px var(--primary-soft)}.tp-i-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.tp-i-table-wrap{width:100%;overflow-x:auto;border:1px solid var(--border);border-radius:10px}.tp-i-table{width:100%;min-width:900px;border-collapse:collapse;background:var(--surface);color:var(--text)}.tp-i-table th,.tp-i-table td{padding:13px 12px;border-bottom:1px solid var(--border);text-align:left;font-size:12px;vertical-align:middle}.tp-i-table th{background:var(--surface-2);color:var(--muted);font-size:11px;font-weight:600;letter-spacing:.3px;text-transform:uppercase;white-space:nowrap}.tp-i-table tbody tr:hover{background:var(--surface-2)}.tp-i-table tbody tr:last-child td{border-bottom:0}.tp-i-badge{display:inline-flex;padding:5px 9px;border:1px solid var(--border);border-radius:20px;background:var(--surface-2);font-size:11px;text-transform:capitalize;white-space:nowrap}.tp-i-message{padding:12px 14px;margin-bottom:14px;border:1px solid var(--border);border-radius:9px;background:var(--surface);color:var(--text)}.tp-i-error{border-color:#e6b8b8;background:#fff5f5;color:#9b2525}.tp-i-notice{border-color:#a7dec5;background:#effbf5;color:#176746}.tp-i-empty{text-align:center;padding:32px 16px;color:var(--muted)}.tp-i-secondary{display:block;color:var(--muted);margin-top:4px}.tp-i-inline{display:flex;align-items:center;gap:6px}.tp-i-form-title{font-size:16px;font-weight:600;margin:0 0 14px;color:var(--text)}
        @media(max-width:700px){.tp-interviews-page{padding:18px 12px}.tp-i-title{font-size:23px}.tp-i-head{flex-direction:column}.tp-i-grid{grid-template-columns:1fr}.tp-i-panel{padding:12px}.tp-i-search{min-width:100%}}
      `}</style>
      <header className="tp-i-head">
        <div>
          <h1 className="tp-i-title">Interviews</h1>
          <p className="tp-i-subtitle">Schedule interviews from real applications and manage interview outcomes.</p>
        </div>
        <div className="tp-i-actions">
          <button type="button" className="tp-i-btn" onClick={load} disabled={loading}>
            <RefreshCw size={15} />
            Refresh
          </button>
          <button
            type="button"
            className="tp-i-btn tp-i-primary"
            onClick={() => {
              setShowForm((value) => !value);
              setError("");
              setNotice("");
            }}>
            <Plus size={15} />
            {showForm ? "Close form" : "Schedule interview"}
          </button>
        </div>
      </header>
      {error && (
        <div className="tp-i-message tp-i-error" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="tp-i-message tp-i-notice" role="status">
          {notice}
        </div>
      )}
      {showForm && (
        <form className="tp-i-panel" onSubmit={submit}>
          <h2 className="tp-i-form-title">Schedule an interview</h2>
          <div className="tp-i-grid">
            <label className="tp-i-field" style={{ gridColumn: "1/-1" }}>
              Application
              <div className="tp-i-search">
                <Search size={16} />

                <input type="text" value={candidateSearch} onChange={(event) => setCandidateSearch(event.target.value)} placeholder="Search by name, email or mobile..." aria-label="Search interview candidates" />

                {candidateSearch && (
                  <button type="button" className="tp-i-candidate-clear" aria-label="Clear candidate search" onClick={() => setCandidateSearch("")}>
                    <X size={16} />
                  </button>
                )}
              </div>
              <select
                className="tp-i-select"
                required
                value={form.applicationId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    applicationId: event.target.value,
                  }))
                }>
                <option value="">{applicationsLoading ? "Loading interview candidates..." : "Select interview candidate"}</option>

                {filteredApplications.map((application) => {
                  const candidate = application.candidateId || {};
                  const role = application.jobRoleId || {};

                  return (
                    <option key={application._id} value={application._id}>
                      {`${candidate.fullName || "Candidate"} — ${role.title || "Job role"} — ${candidate.email || ""} — ${candidate.mobile || ""}`}
                    </option>
                  );
                })}
              </select>
              <small>Only candidates with Interview application status are shown.</small>
              {!applicationsLoading && applications.length > 0 && filteredApplications.length === 0 && (
                <small className="tp-i-no-candidates" role="status">
                  No candidates found. Try another name, email or mobile number.
                </small>
              )}
            </label>
            <label className="tp-i-field">
              Date and time
              <input className="tp-i-input" type="datetime-local" required value={form.scheduledAt} onChange={(event) => setForm((current) => ({ ...current, scheduledAt: event.target.value }))} />
            </label>
            <label className="tp-i-field">
              Duration
              <select className="tp-i-select" value={form.durationMinutes} onChange={(event) => setForm((current) => ({ ...current, durationMinutes: Number(event.target.value) }))}>
                {[15, 30, 45, 60, 90, 120, 180, 240, 480].map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} minutes
                  </option>
                ))}
              </select>
            </label>
            <label className="tp-i-field">
              Interview mode
              <select className="tp-i-select" value={form.mode} onChange={(event) => setForm((current) => ({ ...current, mode: event.target.value }))}>
                <option value="online">Online</option>
                <option value="onsite">On-site</option>
                <option value="phone">Phone</option>
              </select>
            </label>
            <label className="tp-i-field">
              Interviewer
              <input className="tp-i-input" maxLength={160} value={form.interviewer} onChange={(event) => setForm((current) => ({ ...current, interviewer: event.target.value }))} placeholder="Interviewer name" />
            </label>
            {form.mode === "online" ? (
              <label className="tp-i-field">
                Meeting link
                <input className="tp-i-input" type="url" maxLength={2048} value={form.meetingLink} onChange={(event) => setForm((current) => ({ ...current, meetingLink: event.target.value }))} placeholder="https://…" />
              </label>
            ) : (
              <label className="tp-i-field">
                Location
                <input className="tp-i-input" maxLength={250} value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} placeholder="Office or phone details" />
              </label>
            )}
            <label className="tp-i-field" style={{ gridColumn: "1/-1" }}>
              Notes
              <textarea className="tp-i-textarea" rows={3} maxLength={3000} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Interview agenda or notes" />
            </label>
          </div>
          <div className="tp-i-actions" style={{ marginTop: 14 }}>
            <button className="tp-i-btn tp-i-primary" disabled={busy || applicationsLoading || applications.length === 0}>
              {busy ? "Saving…" : "Save interview"}
            </button>
            <button
              type="button"
              className="tp-i-btn"
              onClick={() => {
                setShowForm(false);
                setForm(emptyForm);
              }}>
              Cancel
            </button>
          </div>
          {!applicationsLoading && applications.length === 0 && <p className="tp-i-secondary">No candidates with Interview status are available for scheduling.</p>}
        </form>
      )}
      <section className="tp-i-panel">
        <div className="tp-i-toolbar">
          <label className="tp-i-search">
            <Search size={16} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search candidate, email, role or interviewer" />
            {search && (
              <button type="button" className="tp-i-btn" style={{ minHeight: 26, padding: "3px 5px" }} aria-label="Clear search" onClick={() => setSearch("")}>
                <X size={14} />
              </button>
            )}
          </label>
          <select className="tp-i-select" style={{ width: "auto", minWidth: 145 }} value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        {loading ? (
          <div className="tp-i-empty">Loading interviews…</div>
        ) : (
          <div className="tp-i-table-wrap">
            <table className="tp-i-table">
              <thead>
                <tr>
                  <th>Candidate / application</th>
                  <th>Schedule</th>
                  <th>Mode & details</th>
                  <th>Interviewer</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const candidate = row.candidateId || row.applicationId?.candidateId || {};
                  const role = row.jobRoleId || row.applicationId?.jobRoleId || {};
                  return (
                    <tr key={row._id}>
                      <td>
                        <strong>{candidate.fullName || "Candidate"}</strong>
                        <span className="tp-i-secondary">{candidate.email || "Email unavailable"}</span>
                        <span className="tp-i-secondary">{role.title || "Job role unavailable"}</span>
                      </td>
                      <td>
                        <span className="tp-i-inline">
                          <Clock3 size={14} />
                          {dateText(row.scheduledAt)}
                        </span>
                        <span className="tp-i-secondary">{row.durationMinutes || 30} minutes</span>
                      </td>
                      <td>
                        <span className="tp-i-inline">
                          {row.mode === "online" ? <Video size={14} /> : <MapPin size={14} />} {statusLabel(row.mode)}
                        </span>
                        {row.meetingLink ? (
                          <a className="tp-i-secondary" href={row.meetingLink} target="_blank" rel="noreferrer">
                            Open meeting link
                          </a>
                        ) : row.location ? (
                          <span className="tp-i-secondary">{row.location}</span>
                        ) : null}
                      </td>
                      <td>{row.interviewer || "—"}</td>
                      <td>
                        <select className="tp-i-select" style={{ minHeight: 32, padding: "5px 7px", fontSize: 12 }} value={row.status || "scheduled"} onChange={(event) => changeStatus(row, event.target.value)} aria-label={`Status for ${candidate.fullName || "interview"}`}>
                          <option value="scheduled">Scheduled</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td>
                        <button type="button" className="tp-i-btn" style={{ minHeight: 32, padding: "6px 8px" }} onClick={() => remove(row)} aria-label={`Delete interview for ${candidate.fullName || "candidate"}`}>
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {!filteredRows.length && (
                  <tr>
                    <td colSpan={6} className="tp-i-empty">
                      {rows.length ? "No interviews match your filters." : "No interviews scheduled yet."}
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
