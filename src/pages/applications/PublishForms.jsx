import { useCallback, useEffect, useMemo, useState } from "react";

import { Copy, ExternalLink, FileText, Globe, LoaderCircle, Pause, RefreshCw, Search, Trash2 } from "lucide-react";

import { deletePublicForm, getPublicForms, setPublicFormStatus } from "../../api/public-form.api.js";

const readData = (response) => response?.data?.data ?? response?.data ?? response ?? [];

const errorMessage = (error) => error?.response?.data?.message || error?.response?.data?.error || error?.message || "Something went wrong. Please try again.";

const getId = (item) => String(item?._id || item?.id || "");

const getList = (response) => {
  const data = readData(response);

  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.items)) return data.items;

  if (Array.isArray(data?.forms)) return data.forms;

  return [];
};

export default function PublishForms() {
  const [forms, setForms] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");

  const [busyId, setBusyId] = useState("");

  const PUBLIC_APP_BASE_URL = (import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin).replace(/\/+$/, "");
  const applicationUrl = `${PUBLIC_APP_BASE_URL}/apply`;

  const load = useCallback(async () => {
    setLoading(true);

    setError("");

    try {
      const response = await getPublicForms();

      setForms(getList(response));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return forms;

    return forms.filter((item) => [item.title, item.jobRole, item.publicId, item.status, item.department].filter(Boolean).join(" ").toLowerCase().includes(query));
  }, [forms, search]);

  const publishedCount = forms.filter((item) => item.status === "PUBLISHED").length;

  const draftCount = forms.filter((item) => !item.status || item.status === "DRAFT").length;

  const pausedCount = forms.filter((item) => item.status === "PAUSED").length;

  const copyText = async (value, successMessage) => {
    setError("");

    setNotice("");

    try {
      await navigator.clipboard.writeText(value);

      setNotice(successMessage);
    } catch {
      setNotice(`Copy this link manually: ${value}`);
    }
  };

  const onStatus = async (item, status) => {
    const id = getId(item);

    if (!id) {
      setError("Unable to identify this form.");

      return;
    }

    setBusyId(id);

    setError("");

    setNotice("");

    try {
      await setPublicFormStatus(id, status);

      if (status === "PUBLISHED") {
        setNotice("Form published successfully.");
      } else if (status === "PAUSED") {
        setNotice("Form paused. New submissions are disabled.");
      } else {
        setNotice("Form moved to draft.");
      }

      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusyId("");
    }
  };

  const onDelete = async (item) => {
    const id = getId(item);

    if (!id) {
      setError("Unable to identify this form.");

      return;
    }

    if (!window.confirm(`Delete "${item.title || "this form"}"? This cannot be undone.`)) {
      return;
    }

    setBusyId(id);

    setError("");

    setNotice("");

    try {
      await deletePublicForm(id);

      setNotice("Form deleted successfully.");

      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="pf-page">
      <style>{`
.pf-page{box-sizing:border-box;--pf-bg:var(--tp-bg,#f7f8fc);--pf-card:var(--tp-card,#fff);--pf-text:var(--tp-text,#202636);--pf-muted:var(--tp-muted,#667085);--pf-border:var(--tp-border,#e5e7eb);padding:24px;color:var(--pf-text);background:var(--pf-bg);min-height:100%;font-family:Inter,system-ui,sans-serif}
.pf-page *{box-sizing:border-box}.pf-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:22px}.pf-head h1{font-size:24px;line-height:1.3;margin:0 0 7px;font-weight:500}.pf-head p{margin:0;color:var(--pf-muted);line-height:1.6;font-size:13px}.pf-head-actions{display:flex;gap:8px;flex-wrap:wrap}.pf-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:40px;padding:0 13px;border:1px solid var(--pf-border);border-radius:8px;background:var(--pf-card);color:var(--pf-text);font:inherit;font-size:12px;font-weight:500;text-decoration:none;cursor:pointer;white-space:normal}.pf-btn.primary{background:#222;color:#fff;border-color:#222}.pf-btn:disabled{opacity:.55;cursor:wait}.pf-card{background:var(--pf-card);border:1px solid var(--pf-border);border-radius:12px;padding:20px;min-width:0}.pf-card h2{font-size:15px;font-weight:500;margin:0}.pf-sub{font-size:12px;color:var(--pf-muted);line-height:1.6;margin:6px 0 0}.pf-universal{display:flex;align-items:center;justify-content:space-between;gap:22px;padding:20px;margin-bottom:16px}.pf-universal-info{display:flex;align-items:flex-start;gap:14px;min-width:0}.pf-universal-icon{width:42px;height:42px;display:grid;place-items:center;flex-shrink:0;border:1px solid var(--pf-border);border-radius:9px;background:var(--pf-card)}.pf-universal-info h2{margin:1px 0 5px;font-size:15px}.pf-universal-info p{margin:0;color:var(--pf-muted);font-size:12px;line-height:1.65}.pf-link-box{display:flex;align-items:center;gap:8px;padding:10px;margin-top:16px;border:1px solid var(--pf-border);border-radius:8px;background:var(--pf-card);min-width:0}.pf-link-box code{flex:1;min-width:0;overflow-wrap:anywhere;color:var(--pf-text);font-size:12px}.pf-icon-btn{width:35px;height:35px;display:grid;place-items:center;flex-shrink:0;border:1px solid var(--pf-border);border-radius:7px;background:var(--pf-card);color:var(--pf-text);cursor:pointer}.pf-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:16px}.pf-stat{border:1px solid var(--pf-border);border-radius:9px;padding:13px;background:var(--pf-card);min-width:0}.pf-stat strong{display:block;font-size:20px;font-weight:500}.pf-stat span{font-size:11px;color:var(--pf-muted)}.pf-list-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}.pf-search-wrap{position:relative;max-width:270px;width:100%}.pf-search-wrap>svg{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:#777;pointer-events:none}.pf-search{box-sizing:border-box;width:100%;min-height:40px;padding:9px 12px 9px 35px;border:1px solid var(--pf-border);border-radius:7px;background:var(--pf-card);color:var(--pf-text);font:inherit;font-size:12px;outline:none}.pf-search:focus{border-color:#888}.pf-form-list{display:grid;gap:10px}.pf-item{border:1px solid var(--pf-border);border-radius:9px;padding:15px;min-width:0}.pf-item-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.pf-item h3{font-size:14px;font-weight:500;margin:0 0 5px;overflow-wrap:anywhere}.pf-meta{font-size:12px;color:var(--pf-muted);line-height:1.7;overflow-wrap:anywhere}.pf-badge{display:inline-flex;align-items:center;white-space:nowrap;border-radius:20px;padding:4px 8px;font-size:10px;font-weight:500;background:#f2f2f2;color:#444}.pf-badge.PUBLISHED{background:#f0f7f1;color:#285b35}.pf-badge.PAUSED{background:#f7f3e9;color:#715b27}.pf-url{display:flex;align-items:center;gap:8px;margin-top:12px;padding:9px;border-radius:7px;background:var(--pf-card);border:1px solid var(--pf-border);min-width:0}.pf-url code{flex:1;min-width:0;overflow-wrap:anywhere;color:var(--pf-text);font-size:11px}.pf-item-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}.pf-item-actions .pf-btn{min-height:34px;padding:0 10px;font-size:12px}.pf-empty{padding:30px 15px;text-align:center;color:var(--pf-muted);border:1px dashed var(--pf-border);border-radius:9px;line-height:1.7;font-size:13px;overflow-wrap:anywhere}.pf-empty svg{margin-bottom:9px}.pf-alert{padding:11px 13px;border:1px solid #e5baba;background:var(--pf-card)8f8;color:#922b2b;border-radius:8px;margin-bottom:14px;font-size:13px;line-height:1.5;overflow-wrap:anywhere}.pf-notice{padding:11px 13px;border:1px solid #d8e6da;background:#f8fbf8;color:#315d38;border-radius:8px;margin-bottom:14px;font-size:13px;line-height:1.5;overflow-wrap:anywhere}
@media(max-width:760px){.pf-page{padding:18px}.pf-head{flex-direction:column}.pf-head-actions{width:100%}.pf-head-actions .pf-btn{flex:1}.pf-universal{align-items:flex-start;flex-direction:column}.pf-universal>.pf-btn{width:100%}}
@media(max-width:520px){.pf-page{padding:14px 11px}.pf-head h1{font-size:22px}.pf-card{padding:14px}.pf-universal-info{gap:10px}.pf-universal-icon{width:38px;height:38px}.pf-stats{grid-template-columns:1fr;gap:8px}.pf-stat{padding:11px}.pf-stat strong{font-size:18px}.pf-list-head{align-items:stretch;flex-direction:column}.pf-search-wrap{max-width:none}.pf-item{padding:12px}.pf-item-top{gap:8px}.pf-item-actions .pf-btn{flex:1}.pf-link-box{align-items:flex-start}.pf-link-box code{font-size:11px}}
`}</style>

      <div className="pf-head">
        <div>
          <h1>Publish Forms</h1>

          <p>Manage one public application form for all active job roles.</p>
        </div>

        <div className="pf-head-actions">
          <button type="button" className="pf-btn" onClick={() => window.open(applicationUrl, "_blank", "noopener,noreferrer")}>
            <ExternalLink size={15} />
            Preview Application
          </button>

          <button type="button" className="pf-btn" onClick={load} disabled={loading}>
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="pf-alert" role="alert">
          {error}
        </div>
      )}

      {notice && (
        <div className="pf-notice" role="status">
          {notice}
        </div>
      )}

      <section className="pf-card pf-universal">
        <div className="pf-universal-info">
          <div className="pf-universal-icon">
            <FileText size={21} />
          </div>

          <div>
            <h2>All-in-One Application Form</h2>

            <p>Share one link with every candidate. Applicants can select their preferred active job role and complete the same application form.</p>
          </div>
        </div>

        <button type="button" className="pf-btn primary" onClick={() => window.open(applicationUrl, "_blank", "noopener,noreferrer")}>
          <ExternalLink size={15} />
          Open Form
        </button>

        <div style={{ display: "none" }} aria-hidden="true" />
      </section>

      <section className="pf-card" style={{ marginBottom: 18 }}>
        <div className="pf-link-box" style={{ marginTop: 0 }}>
          <code>{applicationUrl}</code>

          <button type="button" className="pf-icon-btn" title="Copy All-in-One application link" aria-label="Copy All-in-One application link" onClick={() => copyText(applicationUrl, "All-in-One application link copied.")}>
            <Copy size={15} />
          </button>
        </div>

        <p className="pf-sub">This is the single link to share on your website, job posts and recruitment messages.</p>
      </section>

      <div className="pf-stats">
        <div className="pf-stat">
          <strong>{forms.length}</strong>

          <span>Existing forms</span>
        </div>

        <div className="pf-stat">
          <strong>{publishedCount}</strong>

          <span>Published legacy forms</span>
        </div>

        <div className="pf-stat">
          <strong>{draftCount + pausedCount}</strong>

          <span>Drafts and paused</span>
        </div>
      </div>

      <section className="pf-card">
        <div className="pf-list-head">
          <div>
            <h2>Existing Forms</h2>

            <p className="pf-sub">Manage previously created forms without changing their URLs.</p>
          </div>

          <div className="pf-search-wrap">
            <Search size={15} />

            <input className="pf-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search existing forms..." aria-label="Search existing forms" />
          </div>
        </div>

        {loading ? (
          <div className="pf-empty">
            <LoaderCircle size={22} />

            <div>Loading forms...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="pf-empty">
            <FileText size={27} />

            <div>
              <strong>{search ? "No matching forms" : "No existing forms"}</strong>

              <div>{search ? "Try a different search." : "You can use the All-in-One Application Form above. No separate form needs to be created."}</div>
            </div>
          </div>
        ) : (
          <div className="pf-form-list">
            {filtered.map((item) => {
              const itemId = getId(item);

              const status = item.status || "DRAFT";

              const busy = busyId === itemId;

              const roleName = typeof item.jobRole === "object" ? item.jobRole?.title || "Job role" : item.jobRole || "Job role";

              const legacyUrl = item.publicId ? `${window.location.origin}/f/${item.publicId}` : "";

              return (
                <article className="pf-item" key={itemId || item.publicId}>
                  <div className="pf-item-top">
                    <div>
                      <h3>{item.title || "Untitled form"}</h3>

                      <div className="pf-meta">
                        {roleName}
                        {item.department ? ` · ${item.department}` : ""}
                        <br />
                        Public ID: {item.publicId || "Not assigned"}
                      </div>
                    </div>

                    <span className={`pf-badge ${status}`}>{status}</span>
                  </div>

                  {legacyUrl && (
                    <div className="pf-url">
                      <code>{legacyUrl}</code>

                      <button type="button" className="pf-icon-btn" title="Copy legacy form URL" aria-label="Copy legacy form URL" onClick={() => copyText(legacyUrl, "Existing form link copied.")}>
                        <Copy size={14} />
                      </button>
                    </div>
                  )}

                  <div className="pf-item-actions">
                    {status === "PUBLISHED" && legacyUrl && (
                      <>
                        <a className="pf-btn" href={legacyUrl} target="_blank" rel="noreferrer">
                          <ExternalLink size={14} />
                          Test form
                        </a>

                        <button className="pf-btn" type="button" disabled={busy} onClick={() => onStatus(item, "PAUSED")}>
                          {busy ? <LoaderCircle size={14} /> : <Pause size={14} />}
                          Pause
                        </button>
                      </>
                    )}

                    {status !== "PUBLISHED" && (
                      <button className="pf-btn primary" type="button" disabled={busy} onClick={() => onStatus(item, "PUBLISHED")}>
                        {busy ? <LoaderCircle size={14} /> : <Globe size={14} />}
                        Publish
                      </button>
                    )}

                    {status === "PAUSED" && (
                      <button className="pf-btn" type="button" disabled={busy} onClick={() => onStatus(item, "DRAFT")}>
                        Move to draft
                      </button>
                    )}

                    <button className="pf-btn" type="button" disabled={busy} onClick={() => onDelete(item)}>
                      {busy ? <LoaderCircle size={14} /> : <Trash2 size={14} />}
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
