import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, RefreshCw, Pencil, Trash2, X, Building2, CheckCircle2, XCircle, RotateCcw, Save, Power } from "lucide-react";
import { getDepartments, createDepartment, updateDepartment, setDepartmentStatus, deleteDepartment } from "../../api/department.api.js";

const EMPTY_FORM = { name: "", description: "", isActive: true };

const unwrap = (response) => response?.data?.data ?? response?.data ?? [];

const getId = (item) => item?._id || item?.id || "";

const errorMessage = (error) => error?.response?.data?.message || error?.response?.data?.error || error?.message || "Something went wrong. Please try again.";

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadDepartments = useCallback(async () => {
    setLoading(true);
    setPageError("");
    try {
      const response = await getDepartments({
        page: 1,
        limit: 100,
        search: search.trim() || undefined,
        status: statusFilter,
        sortBy: "name",
        sortOrder: "asc",
      });
      const data = unwrap(response);
      const list = Array.isArray(data) ? data : Array.isArray(data?.departments) ? data.departments : [];
      setDepartments(list);
    } catch (error) {
      setPageError(errorMessage(error));
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const stats = useMemo(
    () => ({
      total: departments.length,
      active: departments.filter((item) => item.isActive === true).length,
      inactive: departments.filter((item) => item.isActive === false).length,
    }),
    [departments]
  );

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const openCreate = () => {
    setEditingDepartment(null);
    setForm(EMPTY_FORM);
    setNotice("");
    setModalOpen(true);
  };

  const openEdit = (department) => {
    setEditingDepartment(department);
    setForm({
      name: department.name || "",
      description: department.description || "",
      isActive: department.isActive !== false,
    });
    setNotice("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingDepartment(null);
    setForm(EMPTY_FORM);
    setNotice("");
  };

  const saveDepartment = async (event) => {
    event.preventDefault();
    setNotice("");

    const name = form.name.trim();
    if (name.length < 2) {
      setNotice("Department name must contain at least 2 characters.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        description: form.description.trim(),
        isActive: Boolean(form.isActive),
      };

      if (editingDepartment) {
        await updateDepartment(getId(editingDepartment), payload);
      } else {
        await createDepartment(payload);
      }

      setModalOpen(false);
      setEditingDepartment(null);
      setForm(EMPTY_FORM);
      setNotice(editingDepartment ? "Department updated successfully." : "Department created successfully.");
      await loadDepartments();
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (department) => {
    const id = getId(department);
    if (!id) return;

    setBusyId(id);
    setNotice("");
    try {
      await setDepartmentStatus(id, department.isActive === false);
      setNotice(department.isActive === false ? "Department activated successfully." : "Department deactivated successfully.");
      await loadDepartments();
    } catch (error) {
      setPageError(errorMessage(error));
    } finally {
      setBusyId("");
    }
  };

  const removeDepartment = async () => {
    if (!deleteTarget) return;
    const id = getId(deleteTarget);
    setBusyId(id);
    setNotice("");
    setPageError("");
    try {
      await deleteDepartment(id);
      setDeleteTarget(null);
      setNotice("Department deactivated successfully.");
      await loadDepartments();
    } catch (error) {
      setPageError(errorMessage(error));
    } finally {
      setBusyId("");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  return (
    <div className="dept-page">
      <style>{`
     /* ==================== DEPARTMENTS THEME ==================== */
.dept-page{--dept-bg:#f5f7fb;--dept-surface:#ffffff;--dept-surface-2:#f8fafc;--dept-input-bg:#ffffff;--dept-text:#182230;--dept-muted:#657286;--dept-border:#e2e8f0;--dept-primary:#5847e8;--dept-primary-hover:#4837d2;--dept-primary-soft:#edf2ff;--dept-success:#137a50;--dept-success-soft:#e9f8f0;--dept-danger:#b42332;--dept-danger-soft:#fff0f1;--dept-shadow:0 12px 36px rgba(16,24,40,.10);width:100%;min-width:0;padding:24px;box-sizing:border-box;background:var(--dept-bg);color:var(--dept-text);font-size:14px;color-scheme:light;transition:background-color .2s ease,color .2s ease}
:root[data-theme="dark"] .dept-page,:root.dark .dept-page,html.dark .dept-page,body.dark .dept-page,.dept-page[data-theme="dark"],.dept-page.dark{--dept-bg:#0f1420;--dept-surface:#191f2e;--dept-surface-2:#20283a;--dept-input-bg:#111827;--dept-text:#eef2ff;--dept-muted:#a2abc3;--dept-border:#2b3449;--dept-primary:#8b7cff;--dept-primary-hover:#7766ff;--dept-primary-soft:rgba(101,86,232,.18);--dept-success:#54d99e;--dept-success-soft:rgba(38,181,120,.14);--dept-danger:#ff9292;--dept-danger-soft:rgba(220,90,90,.14);--dept-shadow:0 18px 55px rgba(0,0,0,.38);color-scheme:dark}
.dept-page *{box-sizing:border-box}
.dept-page button,.dept-page input,.dept-page select,.dept-page textarea{font-family:inherit}
.dept-page button:focus-visible,.dept-page input:focus-visible,.dept-page select:focus-visible,.dept-page textarea:focus-visible{outline:2px solid var(--dept-primary);outline-offset:2px}

/* ==================== PAGE HEADER ==================== */
.dept-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin:0 0 24px}
.dept-title{font-size:28px;line-height:1.25;font-weight:600;margin:0;color:var(--dept-text)}
.dept-subtitle{margin:8px 0 0;max-width:680px;color:var(--dept-muted);line-height:1.65}
.dept-head-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}

/* ==================== BUTTONS ==================== */
.dept-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:40px;padding:9px 13px;border:1px solid var(--dept-border);border-radius:9px;background:var(--dept-surface);color:var(--dept-text);font-size:13px;font-weight:500;white-space:nowrap;cursor:pointer;transition:background .18s ease,border-color .18s ease,color .18s ease}
.dept-btn:hover:not(:disabled){border-color:var(--dept-primary);background:var(--dept-surface-2)}
.dept-btn:disabled{opacity:.55;cursor:not-allowed}
.dept-primary{background:#5847e8;border-color:#5847e8;color:#ffffff}
.dept-primary:hover:not(:disabled){background:#4837d2;border-color:#4837d2;color:#ffffff}
:root[data-theme="dark"] .dept-page .dept-primary,:root.dark .dept-page .dept-primary{background:#7565f5;border-color:#7565f5;color:#ffffff}
:root[data-theme="dark"] .dept-page .dept-primary:hover:not(:disabled),:root.dark .dept-page .dept-primary:hover:not(:disabled){background:#6554e8;border-color:#6554e8;color:#ffffff}
.dept-danger{color:var(--dept-danger);border-color:color-mix(in srgb,var(--dept-danger) 35%,transparent);background:var(--dept-surface)}
.dept-danger:hover:not(:disabled){background:var(--dept-danger-soft);border-color:var(--dept-danger)}

/* ==================== SUMMARY CARDS ==================== */
.dept-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:18px}
.dept-card,.dept-panel{background:var(--dept-surface);border:1px solid var(--dept-border);border-radius:12px;min-width:0;box-shadow:0 1px 3px rgba(16,24,40,.025)}
.dept-card{padding:16px}
.dept-card-top{display:flex;justify-content:space-between;align-items:center;gap:8px;color:var(--dept-muted);font-size:12px}
.dept-card-icon{width:34px;height:34px;flex:0 0 34px;border-radius:9px;background:var(--dept-primary-soft);color:var(--dept-primary);display:grid;place-items:center}
.dept-card-value{font-size:27px;line-height:1.3;font-weight:600;margin-top:10px;color:var(--dept-text);font-variant-numeric:tabular-nums}

/* ==================== TABLE PANEL & TOOLBAR ==================== */
.dept-panel{padding:16px}
.dept-toolbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px}
.dept-search{display:flex;align-items:center;gap:9px;min-width:200px;flex:1;height:42px;padding:0 11px;border:1px solid var(--dept-border);border-radius:9px;background:var(--dept-input-bg);color:var(--dept-muted);transition:border-color .18s ease,box-shadow .18s ease}
.dept-search:focus-within{border-color:var(--dept-primary);box-shadow:0 0 0 3px var(--dept-primary-soft)}
.dept-search>svg{flex:0 0 auto}
.dept-search input{width:100%;min-width:0;height:100%;padding:0;border:0;outline:none;background:transparent;color:var(--dept-text);font-size:13px}
.dept-search input::placeholder,.dept-input::placeholder,.dept-textarea::placeholder{color:var(--dept-muted);opacity:.85}
.dept-search button{display:grid;place-items:center;flex:0 0 25px;width:25px;height:25px;padding:0;border:0;border-radius:5px;background:transparent;color:var(--dept-muted);cursor:pointer}
.dept-search button:hover{background:var(--dept-surface-2);color:var(--dept-text)}
.dept-select,.dept-input,.dept-textarea{width:100%;min-width:0;padding:10px 11px;border:1px solid var(--dept-border);border-radius:9px;background:var(--dept-input-bg);color:var(--dept-text);font-size:13px;outline:none;transition:border-color .18s ease,box-shadow .18s ease}
.dept-select:focus,.dept-input:focus,.dept-textarea:focus{border-color:var(--dept-primary);box-shadow:0 0 0 3px var(--dept-primary-soft)}
.dept-select option{background:var(--dept-surface);color:var(--dept-text)}
.dept-toolbar>.dept-select{width:auto;min-width:150px;height:42px;padding-top:8px;padding-bottom:8px}

/* ==================== TABLE ==================== */
.dept-table-wrap{width:100%;overflow-x:auto;border:1px solid var(--dept-border);border-radius:9px}
.dept-table{width:100%;min-width:650px;border-collapse:separate;border-spacing:0;text-align:left;background:var(--dept-surface);color:var(--dept-text)}
.dept-table th{padding:12px;border-bottom:1px solid var(--dept-border);background:var(--dept-surface-2);color:var(--dept-muted);font-size:10px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;white-space:nowrap}
.dept-table td{padding:14px 12px;border-bottom:1px solid var(--dept-border);vertical-align:middle;font-size:13px;line-height:1.5;color:var(--dept-text)}
.dept-table tbody tr{background:var(--dept-surface);transition:background .15s ease}
.dept-table tbody tr:hover{background:var(--dept-surface-2)}
.dept-table tbody tr:hover td{background:transparent}
.dept-table tbody tr:last-child td{border-bottom:0}
.dept-name{font-weight:600;margin-bottom:4px;color:var(--dept-text);overflow-wrap:anywhere}
.dept-muted{color:var(--dept-muted);font-size:12px;line-height:1.5;overflow-wrap:anywhere}

/* ==================== STATUS BADGES ==================== */
.dept-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:600;white-space:nowrap}
.dept-badge-active{background:var(--dept-success-soft);color:var(--dept-success)}
.dept-badge-inactive{background:var(--dept-danger-soft);color:var(--dept-danger)}

/* ==================== ROW ACTIONS ==================== */
.dept-actions{display:flex;align-items:center;gap:6px}
.dept-icon-btn{display:grid;place-items:center;flex:0 0 34px;width:34px;height:34px;padding:0;border:1px solid var(--dept-border);border-radius:8px;background:var(--dept-surface);color:var(--dept-muted);cursor:pointer;transition:background .18s ease,border-color .18s ease,color .18s ease}
.dept-icon-btn:hover:not(:disabled){border-color:var(--dept-primary);background:var(--dept-primary-soft);color:var(--dept-primary)}
.dept-icon-btn:disabled{opacity:.45;cursor:not-allowed}

/* ==================== EMPTY & LOADING STATES ==================== */
.dept-empty{display:flex;align-items:center;flex-direction:column;gap:10px;padding:42px 18px;text-align:center;color:var(--dept-muted)}
.dept-empty>svg{color:var(--dept-primary)}
.dept-empty strong{color:var(--dept-text);font-size:15px;font-weight:600}
.dept-empty>span{font-size:13px;line-height:1.6}

/* ==================== ALERTS ==================== */
.dept-alert{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px;padding:11px 13px;border:1px solid #d9d2ff;border-radius:9px;background:#f4f1ff;color:#4338a5;line-height:1.5}
.dept-alert-error{border-color:#fecaca;background:#fff1f2;color:#b42332}
:root[data-theme="dark"] .dept-page .dept-alert,:root.dark .dept-page .dept-alert{border-color:#40366d;background:#211d3b;color:#d8d1ff}
:root[data-theme="dark"] .dept-page .dept-alert-error,:root.dark .dept-page .dept-alert-error{border-color:#65333d;background:#321e28;color:#ffb4bb}

/* ==================== MODALS ==================== */
.dept-backdrop{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(15,23,42,.48);backdrop-filter:blur(5px);overflow-y:auto}
:root[data-theme="dark"] .dept-backdrop,:root.dark .dept-backdrop{background:rgba(0,0,0,.72)}
.dept-modal{width:min(560px,100%);max-height:calc(100dvh - 36px);overflow-y:auto;border:1px solid var(--dept-border);border-radius:14px;background:var(--dept-surface);color:var(--dept-text);box-shadow:var(--dept-shadow);overscroll-behavior:contain}
.dept-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:20px 22px;border-bottom:1px solid var(--dept-border);background:var(--dept-surface)}
.dept-modal-head h2{margin:0;font-size:19px;line-height:1.4;font-weight:600;color:var(--dept-text)}
.dept-modal-head p{margin:6px 0 0;color:var(--dept-muted);font-size:12px;line-height:1.6}
.dept-form{display:grid;gap:16px;padding:20px 22px}
.dept-field{display:flex;flex-direction:column;gap:7px;min-width:0}
.dept-field label{font-size:12px;font-weight:600;color:var(--dept-text)}
.dept-textarea{min-height:110px;resize:vertical;line-height:1.6}
.dept-check{display:flex;align-items:flex-start;gap:9px;padding:11px 12px;border:1px solid var(--dept-border);border-radius:9px;background:var(--dept-surface-2);color:var(--dept-text);font-size:12px;line-height:1.6}
.dept-check input{width:16px;height:16px;flex:0 0 16px;margin:2px 0 0;accent-color:var(--dept-primary)}
.dept-modal-footer{display:flex;justify-content:flex-end;gap:9px;flex-wrap:wrap;padding:15px 22px;border-top:1px solid var(--dept-border);background:var(--dept-surface)}

/* ==================== DARK MODE CONTROL COLORS ==================== */
:root[data-theme="dark"] .dept-page input,:root[data-theme="dark"] .dept-page textarea,:root[data-theme="dark"] .dept-page select{color-scheme:dark}
:root[data-theme="light"] .dept-page,:root[data-theme="light"] .dept-page input,:root[data-theme="light"] .dept-page textarea,:root[data-theme="light"] .dept-page select{color-scheme:light}

/* ==================== RESPONSIVE ==================== */
@media(max-width:900px){.dept-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:600px){.dept-page{padding:16px}.dept-head{gap:12px;margin-bottom:18px}.dept-title{font-size:24px}.dept-subtitle{font-size:13px}.dept-head-actions{width:100%}.dept-head-actions .dept-btn{flex:1}.dept-stats{gap:9px;margin-bottom:14px}.dept-card{padding:12px}.dept-card-top{font-size:11px}.dept-card-icon{width:30px;height:30px;flex-basis:30px}.dept-card-value{font-size:23px}.dept-panel{padding:11px}.dept-toolbar{gap:8px}.dept-search{flex-basis:100%;min-width:0}.dept-toolbar>.dept-select{width:100%;min-width:0}.dept-toolbar>.dept-btn{flex:1}.dept-table{min-width:650px}.dept-modal-head{padding:16px}.dept-form{padding:16px;gap:14px}.dept-modal-footer{padding:13px 16px}.dept-backdrop{padding:10px}.dept-modal{max-height:calc(100dvh - 20px);border-radius:12px}}
@media(max-width:380px){.dept-page{padding:12px}.dept-stats{grid-template-columns:1fr}.dept-card-value{font-size:22px}.dept-head-actions{flex-direction:column}.dept-head-actions .dept-btn{width:100%}.dept-modal-footer .dept-btn{flex:1}}
@media(prefers-reduced-motion:reduce){.dept-page,.dept-page *{transition:none!important;scroll-behavior:auto!important}}
      `}</style>

      <header className="dept-head">
        <div>
          <h1 className="dept-title">Departments</h1>
          <p className="dept-subtitle">Organize your recruitment team by department and manage which departments are available for job roles.</p>
        </div>
        <div className="dept-head-actions">
          <button className="dept-btn" type="button" onClick={loadDepartments} disabled={loading}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button className="dept-btn dept-primary" type="button" onClick={openCreate}>
            <Plus size={16} /> Create Department
          </button>
        </div>
      </header>

      {pageError && (
        <div className="dept-alert dept-alert-error" role="alert">
          <span>{pageError}</span>
          <button className="dept-btn" type="button" onClick={loadDepartments}>
            Try again
          </button>
        </div>
      )}
      {notice && !modalOpen && (
        <div className="dept-alert" role="status">
          {notice}
        </div>
      )}

      <section className="dept-stats">
        {[
          { label: "Total departments", value: stats.total, icon: Building2 },
          { label: "Active departments", value: stats.active, icon: CheckCircle2 },
          { label: "Inactive departments", value: stats.inactive, icon: XCircle },
        ].map(({ label, value, icon: Icon }) => (
          <div className="dept-card" key={label}>
            <div className="dept-card-top">
              <span>{label}</span>
              <span className="dept-card-icon">
                <Icon size={17} />
              </span>
            </div>
            <div className="dept-card-value">{value}</div>
          </div>
        ))}
      </section>

      <section className="dept-panel">
        <div className="dept-toolbar">
          <label className="dept-search">
            <Search size={17} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search department name or description..." aria-label="Search departments" />
            {search && (
              <button type="button" onClick={() => setSearch("")} aria-label="Clear search">
                <X size={16} />
              </button>
            )}
          </label>
          <select className="dept-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button className="dept-btn" type="button" onClick={resetFilters}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        {loading ? (
          <div className="dept-empty">
            <RefreshCw size={20} /> Loading departments...
          </div>
        ) : departments.length ? (
          <div className="dept-table-wrap">
            <table className="dept-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Description</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((department) => {
                  const id = getId(department);
                  return (
                    <tr key={id}>
                      <td>
                        <div className="dept-name">{department.name}</div>
                        <div className="dept-muted">ID: {id || "—"}</div>
                      </td>
                      <td>{department.description?.trim() || <span className="dept-muted">No description</span>}</td>
                      <td>{formatDate(department.createdAt)}</td>
                      <td>
                        <span className={`dept-badge ${department.isActive !== false ? "dept-badge-active" : "dept-badge-inactive"}`}>
                          {department.isActive !== false ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                          {department.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div className="dept-actions">
                          <button className="dept-icon-btn" type="button" title="Edit department" aria-label={`Edit ${department.name}`} onClick={() => openEdit(department)}>
                            <Pencil size={15} />
                          </button>
                          <button
                            className="dept-icon-btn"
                            type="button"
                            title={department.isActive !== false ? "Deactivate department" : "Activate department"}
                            aria-label={department.isActive !== false ? `Deactivate ${department.name}` : `Activate ${department.name}`}
                            disabled={busyId === id}
                            onClick={() => toggleStatus(department)}>
                            <Power size={15} />
                          </button>
                          <button className="dept-icon-btn" type="button" title="Deactivate department" aria-label={`Deactivate ${department.name}`} disabled={busyId === id || department.isActive === false} onClick={() => setDeleteTarget(department)}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="dept-empty">
            <Building2 size={30} />
            <strong>No departments found</strong>
            <span>Create your first department or change the filters.</span>
            <button className="dept-btn dept-primary" type="button" onClick={openCreate}>
              <Plus size={15} /> Create Department
            </button>
          </div>
        )}
      </section>

      {modalOpen && (
        <div
          className="dept-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}>
          <section className="dept-modal" role="dialog" aria-modal="true" aria-labelledby="dept-modal-title">
            <header className="dept-modal-head">
              <div>
                <h2 id="dept-modal-title">{editingDepartment ? "Edit Department" : "Create Department"}</h2>
                <p>Add a department that can be assigned to job roles.</p>
              </div>
              <button className="dept-icon-btn" type="button" onClick={closeModal} aria-label="Close dialog">
                <X size={17} />
              </button>
            </header>
            <form className="dept-form" onSubmit={saveDepartment}>
              {notice && (
                <div className="dept-alert dept-alert-error" role="alert">
                  {notice}
                </div>
              )}
              <div className="dept-field">
                <label htmlFor="department-name">Department name *</label>
                <input id="department-name" className="dept-input" value={form.name} onChange={(event) => updateField("name", event.target.value)} maxLength={100} minLength={2} required placeholder="e.g. Engineering" />
              </div>
              <div className="dept-field">
                <label htmlFor="department-description">Description</label>
                <textarea id="department-description" className="dept-textarea" value={form.description} onChange={(event) => updateField("description", event.target.value)} maxLength={1000} placeholder="Briefly describe this department..." />
              </div>
              <label className="dept-check">
                <input type="checkbox" checked={form.isActive} onChange={(event) => updateField("isActive", event.target.checked)} />
                <span>Active department — available when creating job roles</span>
              </label>
            </form>
            <footer className="dept-modal-footer">
              <button className="dept-btn" type="button" onClick={closeModal} disabled={saving}>
                Cancel
              </button>
              <button className="dept-btn dept-primary" type="button" onClick={() => document.querySelector(".dept-form")?.requestSubmit()} disabled={saving}>
                {saving ? <RefreshCw size={15} /> : <Save size={15} />}
                {saving ? "Saving..." : editingDepartment ? "Save Changes" : "Create Department"}
              </button>
            </footer>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div
          className="dept-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busyId) setDeleteTarget(null);
          }}>
          <section className="dept-modal" role="dialog" aria-modal="true" aria-labelledby="dept-delete-title">
            <div className="dept-form">
              <h2 id="dept-delete-title" style={{ margin: 0, fontSize: 19 }}>
                Deactivate department?
              </h2>
              <p className="dept-muted" style={{ margin: 0 }}>
                “{deleteTarget.name}” will be deactivated. Existing job-role history will be preserved.
              </p>
              <div className="dept-head-actions" style={{ justifyContent: "flex-end" }}>
                <button className="dept-btn" type="button" onClick={() => setDeleteTarget(null)} disabled={Boolean(busyId)}>
                  Cancel
                </button>
                <button className="dept-btn dept-danger" type="button" onClick={removeDepartment} disabled={Boolean(busyId)}>
                  <Trash2 size={15} /> {busyId ? "Working..." : "Deactivate"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
