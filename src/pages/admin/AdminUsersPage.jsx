import React, { useCallback, useEffect, useState } from "react";
import { Search, RefreshCw, ChevronLeft, ChevronRight, ShieldCheck, X, Users } from "lucide-react";
import adminUsersApi from "../../api/adminUsers.api.js";

const getError = (error) => {
  const data = error?.response?.data;
  return data?.message || data?.error || error?.message || "Something went wrong while processing your request.";
};

const getResponseRoot = (response) => {
  const body = response?.data;
  return body?.data ?? body ?? {};
};

function Badge({ children, type = "neutral" }) {
  return <span className={`tpau-badge tpau-badge-${type}`}>{children}</span>;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normalizeRole(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function normalizeApproval(value) {
  return String(value || "PENDING")
    .trim()
    .toUpperCase();
}

function extractUsers(root) {
  if (Array.isArray(root)) return root;

  const candidates = [root?.users, root?.items, root?.results, root?.data?.users, root?.data?.items, root?.data?.results, root?.data];

  return candidates.find(Array.isArray) || [];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [refresh, setRefresh] = useState(0);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await adminUsersApi.getUsers({
        page,
        limit: 20,
        search: search.trim() || undefined,
        role: role === "all" ? undefined : role,
        status: status === "all" ? undefined : status,
      });

      const root = getResponseRoot(response);
      const receivedUsers = extractUsers(root);
      const pageInfo = root?.pagination || root?.meta || root?.data?.pagination || {};
      const total = Number(pageInfo.total ?? pageInfo.totalItems ?? root?.total ?? root?.count ?? receivedUsers.length);
      const totalPages = Number(pageInfo.totalPages ?? pageInfo.pages ?? root?.totalPages ?? (total > 0 ? Math.ceil(total / 20) : 1));

      setUsers(receivedUsers);
      setPagination({
        total: Number.isFinite(total) ? total : receivedUsers.length,
        totalPages: Math.max(1, Number.isFinite(totalPages) ? totalPages : 1),
      });
    } catch (requestError) {
      setError(getError(requestError));
      setUsers([]);
      setPagination({ total: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [page, search, role, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadUsers();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [loadUsers, refresh]);

  const changeFilter = (setter, value) => {
    setter(value);
    setPage(1);
    setMessage("");
  };

  const clearFilters = () => {
    setSearch("");
    setRole("all");
    setStatus("all");
    setPage(1);
    setMessage("");
    setError("");
  };

  const performAction = async (user, action) => {
    if (busyId) return;

    const id = user?._id || user?.id;
    if (!id) {
      setError("User ID is missing. This user cannot be updated.");
      return;
    }

    const actionLabels = {
      block: "block this HR account",
      unblock: "unblock this HR account",
      approve: "approve this HR account",
      unapprove: "revoke this HR account's approval",
      remove: "permanently delete this HR account",
    };

    const actionMethods = {
      block: adminUsersApi.blockUser,
      unblock: adminUsersApi.unblockUser,
      approve: adminUsersApi.approveUser,
      unapprove: adminUsersApi.unapproveUser,
      remove: adminUsersApi.deleteUser,
    };

    if (!actionMethods[action]) {
      setError("Unsupported user action.");
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to ${actionLabels[action]}?\n\nName: ${user.name || "Unnamed user"}\nEmail: ${user.email || "No email"}`);
    if (!confirmed) return;

    setBusyId(String(id));
    setError("");
    setMessage("");

    try {
      const response = await actionMethods[action](id);
      const root = getResponseRoot(response);
      setMessage(root?.message || response?.data?.message || "The user action completed successfully.");

      if (action === "remove") {
        setUsers((current) => current.filter((item) => String(item._id || item.id) !== String(id)));
      }

      setRefresh((value) => value + 1);
    } catch (requestError) {
      setError(getError(requestError));
    } finally {
      setBusyId("");
    }
  };

  const totalPages = Math.max(1, pagination.totalPages || 1);

  return (
    <div className="tpau-page">
      <style>{`
        .tpau-page{--tpau-bg:var(--tp-bg,#111318);--tpau-card:var(--tp-card,#191c24);--tpau-text:var(--tp-text,#f1f3fb);--tpau-muted:var(--tp-muted,#a0abc3);--tpau-border:var(--tp-border,#2c3447);--tpau-primary:var(--tp-primary,#5145e5);width:100%;min-width:0;padding:24px;color:var(--tpau-text);font:14px Inter,ui-sans-serif,system-ui,sans-serif;box-sizing:border-box}
        .tpau-page *{box-sizing:border-box}
        .tpau-page .tpau-header{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:22px}
        .tpau-page .tpau-title{margin:0;font-size:26px;line-height:1.25;font-weight:650;letter-spacing:-.5px;color:var(--tpau-text)}
        .tpau-page .tpau-subtitle{margin:7px 0 0;color:var(--tpau-muted);font-size:13px;line-height:1.55}
        .tpau-page .tpau-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:38px;padding:0 12px;border:1px solid var(--tpau-border);border-radius:9px;background:var(--tpau-card);color:var(--tpau-text);font:inherit;white-space:nowrap;cursor:pointer;transition:background .15s,border-color .15s}
        .tpau-page .tpau-btn:hover:not(:disabled){background:color-mix(in srgb,var(--tpau-primary) 9%,var(--tpau-card));border-color:var(--tpau-primary)}
        .tpau-page .tpau-btn:disabled{opacity:.48;cursor:not-allowed}
        .tpau-page .tpau-btn-danger{border-color:#e5484d66;color:#ff777b}
        .tpau-page .tpau-alert{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 16px;padding:12px 14px;border:1px solid var(--tpau-border);border-radius:10px;background:var(--tpau-card);line-height:1.5}
        .tpau-page .tpau-alert-error{border-color:#e5484d70;color:#ff8588}
        .tpau-page .tpau-alert-success{border-color:#2aaf7866;color:#65d6a5}
        .tpau-page .tpau-panel{overflow:hidden;border:1px solid var(--tpau-border);border-radius:13px;background:var(--tpau-card);box-shadow:0 3px 14px #0000000a}
        .tpau-page .tpau-panel-head{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:20px;border-bottom:1px solid var(--tpau-border)}
        .tpau-page .tpau-panel-title{margin:0;font-size:17px;font-weight:650;color:var(--tpau-text)}
        .tpau-page .tpau-panel-desc{margin:6px 0 0;color:var(--tpau-muted);font-size:12px}
        .tpau-page .tpau-count{display:inline-flex;align-items:center;gap:6px;padding:7px 10px;border:1px solid var(--tpau-border);border-radius:999px;background:var(--tpau-bg);color:var(--tpau-muted);font-size:12px;font-weight:600;white-space:nowrap}
        .tpau-page .tpau-toolbar{display:flex;align-items:center;flex-wrap:wrap;gap:10px;padding:16px 20px}
        .tpau-page .tpau-search{display:flex;align-items:center;gap:9px;flex:1 1 250px;min-width:190px;max-width:380px;height:40px;padding:0 11px;border:1px solid var(--tpau-border);border-radius:9px;background:var(--tpau-bg);color:var(--tpau-muted)}
        .tpau-page .tpau-search:focus-within{border-color:var(--tpau-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--tpau-primary) 16%,transparent)}
        .tpau-page .tpau-search input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:var(--tpau-text);font:inherit}
        .tpau-page .tpau-search input::placeholder{color:var(--tpau-muted)}
        .tpau-page .tpau-search-clear{display:grid;place-items:center;padding:4px;border:0;border-radius:5px;background:transparent;color:var(--tpau-muted);cursor:pointer}
        .tpau-page .tpau-select{height:40px;max-width:100%;padding:0 30px 0 11px;border:1px solid var(--tpau-border);border-radius:9px;background:var(--tpau-card);color:var(--tpau-text);font:inherit}
        .tpau-page .tpau-table-wrap{width:100%;overflow-x:auto;border-top:1px solid var(--tpau-border)}
        .tpau-page .tpau-table{width:100%;min-width:1000px;border-collapse:collapse;text-align:left}
        .tpau-page .tpau-table th{padding:13px 16px;background:var(--tpau-bg);color:var(--tpau-muted);font-size:11px;font-weight:700;letter-spacing:.045em;text-transform:uppercase;white-space:nowrap}
        .tpau-page .tpau-table td{padding:15px 16px;border-top:1px solid var(--tpau-border);vertical-align:middle;color:var(--tpau-text)}
        .tpau-page .tpau-table tbody tr{transition:background .12s}
        .tpau-page .tpau-table tbody tr:hover{background:color-mix(in srgb,var(--tpau-primary) 5%,var(--tpau-card))}
        .tpau-page .tpau-user-name{font-size:13px;font-weight:650;color:var(--tpau-text)}
        .tpau-page .tpau-user-email{margin-top:4px;color:var(--tpau-muted);font-size:12px;overflow-wrap:anywhere}
        .tpau-page .tpau-badge{display:inline-flex;align-items:center;justify-content:center;padding:5px 9px;border:1px solid var(--tpau-border);border-radius:999px;background:var(--tpau-bg);color:var(--tpau-muted);font-size:11px;font-weight:650;white-space:nowrap}
        .tpau-page .tpau-badge-success{border-color:#2aaf7850;background:#2aaf7814;color:#65d6a5}
        .tpau-page .tpau-badge-danger{border-color:#e5484d55;background:#e5484d14;color:#ff8588}
        .tpau-page .tpau-badge-primary{border-color:#766bff66;background:#5145e51a;color:#a9a1ff}
        .tpau-page .tpau-actions{display:flex;flex-wrap:wrap;gap:6px;min-width:210px}
        .tpau-page .tpau-muted{color:var(--tpau-muted);font-size:12px}
        .tpau-page .tpau-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;min-height:190px;padding:28px 16px;text-align:center;color:var(--tpau-muted)}
        .tpau-page .tpau-empty strong{color:var(--tpau-text);font-size:14px}
        .tpau-page .tpau-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 20px;border-top:1px solid var(--tpau-border);color:var(--tpau-muted);font-size:12px}
        .tpau-page .tpau-pagination{display:flex;gap:8px}
        .tpau-page .tpau-spin{animation:tpau-spin 1s linear infinite}
        @keyframes tpau-spin{to{transform:rotate(360deg)}}
        @media(max-width:700px){.tpau-page{padding:15px}.tpau-page .tpau-header{align-items:flex-start}.tpau-page .tpau-title{font-size:22px}.tpau-page .tpau-panel-head{padding:15px}.tpau-page .tpau-toolbar{padding:12px}.tpau-page .tpau-search{flex-basis:100%;max-width:none}.tpau-page .tpau-footer{padding:12px;flex-wrap:wrap}}
      `}</style>

      <header className="tpau-header">
        <div>
          <h1 className="tpau-title">User Management</h1>
          <p className="tpau-subtitle">Manage registered users, HR approvals and account access.</p>
        </div>
        <button type="button" className="tpau-btn" onClick={() => setRefresh((value) => value + 1)} disabled={loading}>
          <RefreshCw size={16} className={loading ? "tpau-spin" : ""} />
          Refresh
        </button>
      </header>

      {message && (
        <div className="tpau-alert tpau-alert-success" role="status">
          <span>{message}</span>
          <button type="button" className="tpau-btn" aria-label="Dismiss success message" onClick={() => setMessage("")}>
            <X size={15} />
          </button>
        </div>
      )}

      {error && (
        <div className="tpau-alert tpau-alert-error" role="alert">
          <span>{error}</span>
          <button type="button" className="tpau-btn" aria-label="Dismiss error message" onClick={() => setError("")}>
            <X size={15} />
          </button>
        </div>
      )}

      <section className="tpau-panel">
        <div className="tpau-panel-head">
          <div>
            <h2 className="tpau-panel-title">Registered users</h2>
            <p className="tpau-panel-desc">User accounts available in your workspace.</p>
          </div>
          <span className="tpau-count">
            <Users size={15} />
            {pagination.total} {pagination.total === 1 ? "user" : "users"}
          </span>
        </div>

        <div className="tpau-toolbar">
          <div className="tpau-search">
            <Search size={17} />
            <input type="text" placeholder="Search name or email" value={search} onChange={(event) => changeFilter(setSearch, event.target.value)} aria-label="Search users by name or email" />
            {search && (
              <button type="button" className="tpau-search-clear" aria-label="Clear search" onClick={() => changeFilter(setSearch, "")}>
                <X size={15} />
              </button>
            )}
          </div>

          <select className="tpau-select" value={role} onChange={(event) => changeFilter(setRole, event.target.value)} aria-label="Filter users by role">
            <option value="all">All roles</option>
            <option value="ADMIN">Admin</option>
            <option value="HR">HR</option>
          </select>

          <select className="tpau-select" value={status} onChange={(event) => changeFilter(setStatus, event.target.value)} aria-label="Filter users by status">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
            <option value="PENDING">Pending approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <button type="button" className="tpau-btn" onClick={clearFilters} disabled={search === "" && role === "all" && status === "all"}>
            Clear filters
          </button>
        </div>

        <div className="tpau-table-wrap">
          <table className="tpau-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Email verification</th>
                <th>Approval</th>
                <th>Account</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <div className="tpau-empty">Loading users…</div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="tpau-empty">
                      <ShieldCheck size={30} />
                      <strong>No users found</strong>
                      <span>{error ? "The user list could not be loaded. Check the API error above." : "Try changing your search or filters."}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const id = user._id || user.id;
                  const userRole = normalizeRole(user.role);
                  const approval = normalizeApproval(user.approvalStatus);
                  const isHR = userRole === "HR";
                  const isActive = user.isActive !== false;
                  const isApproved = approval === "APPROVED";
                  const actionBusy = Boolean(busyId);

                  return (
                    <tr key={id || user.email}>
                      <td>
                        <div className="tpau-user-name">{user.name || user.fullName || "Unnamed user"}</div>
                        <div className="tpau-user-email">{user.email || "—"}</div>
                      </td>
                      <td>
                        <Badge type={userRole === "ADMIN" ? "primary" : "neutral"}>{userRole || "—"}</Badge>
                      </td>
                      <td>
                        <Badge type={user.emailVerified ? "success" : "danger"}>{user.emailVerified ? "Verified" : "Unverified"}</Badge>
                      </td>
                      <td>
                        <Badge type={isApproved ? "success" : approval === "REJECTED" ? "danger" : "neutral"}>{approval}</Badge>
                      </td>
                      <td>
                        <Badge type={isActive ? "success" : "danger"}>{isActive ? "Active" : "Blocked"}</Badge>
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        {!isHR ? (
                          <span className="tpau-muted">Admin account</span>
                        ) : (
                          <div className="tpau-actions">
                            <button type="button" className="tpau-btn" disabled={actionBusy} onClick={() => performAction(user, isActive ? "block" : "unblock")}>
                              {busyId === String(id) ? "Working…" : isActive ? "Block" : "Unblock"}
                            </button>
                            <button
                              type="button"
                              className="tpau-btn"
                              disabled={actionBusy || (!user.emailVerified && !isApproved)}
                              title={!user.emailVerified && !isApproved ? "The user must verify their email before approval." : ""}
                              onClick={() => performAction(user, isApproved ? "unapprove" : "approve")}>
                              {isApproved ? "Revoke approval" : "Approve"}
                            </button>
                            <button type="button" className="tpau-btn tpau-btn-danger" disabled={actionBusy} onClick={() => performAction(user, "remove")}>
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <footer className="tpau-footer">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="tpau-pagination">
            <button type="button" className="tpau-btn" disabled={loading || page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
              <ChevronLeft size={15} />
              Previous
            </button>
            <button type="button" className="tpau-btn" disabled={loading || page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
              Next
              <ChevronRight size={15} />
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
