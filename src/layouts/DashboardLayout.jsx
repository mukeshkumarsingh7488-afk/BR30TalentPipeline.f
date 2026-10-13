import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Activity, Bell, BriefcaseBusiness, CalendarDays, Building2, BarChart3, FileText, LayoutDashboard, LogOut, Menu, Moon, Search, Settings, Sun, Users, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import Swal from "sweetalert2";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/job-roles", label: "Job Roles", Icon: BriefcaseBusiness },
  { to: "/candidates", label: "Candidates", Icon: Users },
  { to: "/applications", label: "Applications", Icon: FileText },
  { to: "/departments", label: "Departments", Icon: Building2 },
  { to: "/interviews", label: "Interviews", Icon: CalendarDays },
  { to: "/reports", label: "Reports", Icon: BarChart3 },
  { to: "/publish-forms", label: "Publish Forms", Icon: FileText },
];

const getInitials = (value = "") =>
  value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "U";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");


  const notificationRef = useRef(null);
  const appearanceRef = useRef(null);
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  const name = user?.name || user?.fullName || user?.email?.split("@")[0] || "User";
  const role = user?.role || "HR";

  useEffect(() => {
    setMobileOpen(false);
    setNotificationsOpen(false);
    setAppearanceOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handlePointer = (event) => {
      if (!notificationRef.current?.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (!appearanceRef.current?.contains(event.target)) {
        setAppearanceOpen(false);
      }
      if (!mobileSearchRef.current?.contains(event.target) && !event.target.closest(".tp-mobile-search-trigger")) {
        setMobileSearchOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setNotificationsOpen(false);
        setAppearanceOpen(false);
        setMobileSearchOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const changeTheme = (nextTheme) => {
    setTheme(nextTheme);
    setAppearanceOpen(false);
  };

  const handleLogout = async () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";

    const result = await Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to logout from your account?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Logout",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      focusCancel: true,
      background: isDark ? "#191e2d" : "#ffffff",
      color: isDark ? "#f1f3fb" : "#17203a",
      confirmButtonColor: "#5145e5",
      cancelButtonColor: isDark ? "#343b4d" : "#e7ebf3",
      customClass: { cancelButton: "tp-swal-cancel" },
    });

    if (!result.isConfirmed) return;

    logout();
    setMobileOpen(false);
    setNotificationsOpen(false);
    setAppearanceOpen(false);
    setMobileSearchOpen(false);
    navigate("/", { replace: true });
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const query = globalSearch.trim();
    if (!query) return;

    navigate(`/search?q=${encodeURIComponent(query)}`);
    setGlobalSearch("");
    setMobileSearchOpen(false);
  };

  const openMobileSearch = () => {
    setMobileSearchOpen(true);
    window.requestAnimationFrame(() => {
      mobileSearchRef.current?.querySelector("input")?.focus();
    });
  };

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (window.matchMedia("(max-width: 650px)").matches) {
          openMobileSearch();
        } else {
          searchRef.current?.focus();
        }
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  return (
    <div className="tp-shell">
      <style>{`
        html,body,#root{width:100%;height:100%;min-height:100%;margin:0!important;padding:0!important}
        html,body{overflow:hidden}
        body{min-height:100vh}
        #root{height:100vh;min-height:0}

        .tp-shell{--tp-primary:#5145e5;--tp-bg:#f5f7fc;--tp-card:#fff;--tp-text:#17203a;--tp-muted:#73809b;--tp-border:#e7ebf3;display:flex;width:100%;height:100vh;height:100dvh;min-height:0;overflow:hidden;margin:0;padding:0;background:var(--tp-bg);color:var(--tp-text);font:14px Inter,ui-sans-serif,system-ui,sans-serif}
        .tp-shell *{box-sizing:border-box}
        html[data-theme="dark"] .tp-shell{--tp-bg:#111522;--tp-card:#191e2d;--tp-text:#f1f3fb;--tp-muted:#a0abc3;--tp-border:#2c3447}

        .tp-side{width:248px;flex:0 0 248px;position:relative;height:100%;min-height:0;display:flex;flex-direction:column;padding:20px 12px;background:linear-gradient(180deg,#4537cf,#392fc0);color:#fff;z-index:50;overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:#ffffff45 transparent}
        .tp-brand{display:flex;align-items:center;gap:11px;padding:0 9px 25px;color:#fff;text-decoration:none;flex-shrink:0}
        .tp-brand img{width:41px;height:41px;object-fit:contain;border:1px solid #29234f;border-radius:10px;background:transparent;padding:2px}
        .tp-brand strong{display:block;font-size:15px;font-weight:650}
        .tp-brand small{display:block;margin-top:4px;color:#dedbff;font-size:12px}
        .tp-nav{display:grid;gap:5px;flex-shrink:0}
        .tp-nav a{display:flex;align-items:center;gap:12px;min-height:44px;padding:0 13px;border-radius:9px;color:#e7e5ff;text-decoration:none;font-weight:450}
        .tp-nav a:hover,.tp-nav a.active{background:#ffffff25;color:#fff}
        .tp-nav a svg{flex-shrink:0}

        .tp-side-bottom{margin-top:auto;border-top:1px solid #ffffff30;padding:14px 4px 0;flex-shrink:0}
        .tp-sidebar-settings{display:flex;align-items:center;gap:11px;width:100%;min-height:43px;padding:0 12px;border:1px solid #ffffff30;border-radius:9px;background:#ffffff0d;color:#fff;text-decoration:none}
        .tp-sidebar-settings:hover,.tp-sidebar-settings.active{background:#ffffff25}
        .tp-logout{width:100%;display:flex;align-items:center;gap:10px;min-height:42px;margin-top:8px;padding:0 12px;border:1px solid #ffffff35;border-radius:9px;background:#ffffff12;color:#fff;cursor:pointer;font:inherit;text-align:left}
        .tp-logout:hover{background:#ffffff25}

        .tp-main{display:flex;flex:1;flex-direction:column;width:calc(100% - 248px);min-width:0;height:100%;min-height:0;overflow:hidden;margin:0;padding:0}
        .tp-topbar{position:relative;z-index:40;flex:0 0 64px;height:64px;min-height:64px;display:flex;align-items:center;gap:12px;margin:0;padding:10px 20px;background:var(--tp-card);border-bottom:1px solid var(--tp-border)}
        .tp-menu-button{display:none;flex:0 0 38px}
        .tp-control{width:39px;height:39px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;padding:0;border:1px solid var(--tp-border);border-radius:9px;background:var(--tp-card);color:var(--tp-text);cursor:pointer}
        .tp-control:hover{background:var(--tp-bg)}
        .tp-control svg{flex-shrink:0}
        .tp-control-wrap{position:relative;flex:0 0 auto}

        .tp-search{height:39px;width:360px;max-width:360px;flex:0 1 360px;display:flex;align-items:center;gap:9px;margin:0;padding:0 10px;border:1px solid var(--tp-border);border-radius:9px;background:var(--tp-bg);color:var(--tp-muted);min-width:0}
        .tp-search>svg{flex-shrink:0}
        .tp-search input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:var(--tp-text);font:inherit}
        .tp-search input::placeholder{color:var(--tp-muted)}
        .tp-search:focus-within{border-color:var(--tp-primary);box-shadow:0 0 0 2px #5145e51c}
        .tp-search button{display:grid;place-items:center;flex-shrink:0;border:0;border-radius:5px;background:transparent;color:var(--tp-muted);padding:4px;cursor:pointer}
        .tp-search kbd{flex-shrink:0;padding:3px 6px;border:1px solid var(--tp-border);border-radius:5px;background:var(--tp-card);font-size:10px;color:var(--tp-muted)}

        .tp-actions{display:flex;align-items:center;gap:8px;margin-left:auto}
        .tp-popover{position:absolute;right:0;top:46px;width:210px;padding:8px;background:var(--tp-card);border:1px solid var(--tp-border);border-radius:11px;box-shadow:0 15px 40px #0002;z-index:100}
        .tp-popover-title{padding:8px 9px;font-weight:600;color:var(--tp-text)}
        .tp-popover button{width:100%;display:flex;align-items:center;gap:9px;padding:10px;border:0;border-radius:8px;background:transparent;color:var(--tp-text);text-align:left;cursor:pointer;font:inherit}
        .tp-popover button:hover,.tp-popover button.selected{background:var(--tp-bg)}
        .tp-theme-check{margin-left:auto;color:var(--tp-primary)}

        .tp-top-user{display:flex;align-items:center;gap:9px;min-width:0;margin-left:2px}
        .tp-initials{width:37px;height:37px;flex:0 0 37px;display:grid;place-items:center;border-radius:50%;background:#e9e6ff;color:#4e42d7;font-size:12px;font-weight:750}
        .tp-user-copy{min-width:0}
        .tp-user-copy strong,.tp-user-copy small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .tp-user-copy strong{font-size:12px;font-weight:650;color:var(--tp-text)}
        .tp-user-copy small{margin-top:4px;font-size:11px;color:var(--tp-muted)}

        .tp-content{display:block;flex:1;width:100%;max-width:none;min-width:0;min-height:0;height:auto;margin:0;padding:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;scrollbar-gutter:stable}
        .tp-mobile-backdrop{display:none}
        .tp-mobile-search-trigger,.tp-mobile-search-panel{display:none}
        .tp-swal-cancel{color:#17203a!important;font-weight:600!important}
        html[data-theme="dark"] .tp-swal-cancel{color:#f1f3fb!important}

        @media(max-width:1000px){
          .tp-side{position:fixed;left:0;top:0;height:100dvh;transform:translateX(-105%);transition:transform .22s ease}
          .tp-side.open{transform:translateX(0);box-shadow:12px 0 35px #0002}
          .tp-mobile-backdrop.open{display:block;position:fixed;inset:0;background:#10152680;z-index:45}
          .tp-menu-button{display:flex}
          .tp-main{width:100%}
          .tp-topbar{gap:9px;padding:10px 12px}
          .tp-search{width:300px;max-width:300px;flex-basis:300px}
          .tp-top-user .tp-user-copy{display:none}
        }
        @media(min-width:1001px){
          .tp-menu-button{display:none!important}
          .tp-mobile-backdrop{display:none!important}
        }
        @media(min-width:651px){
          .tp-mobile-search-trigger,.tp-mobile-search-panel{display:none!important}
        }
        @media(max-width:650px){
          .tp-topbar{flex-basis:58px;height:58px;min-height:58px;padding:9px 10px;gap:7px}
          .tp-menu-button{display:flex!important;width:35px;height:35px;flex-basis:35px}
          .tp-search{display:none}
          .tp-mobile-search-trigger{display:flex;width:35px;height:35px}
          .tp-mobile-search-panel{position:absolute;top:100%;left:0;right:0;display:block;padding:10px;background:var(--tp-card);border-bottom:1px solid var(--tp-border);box-shadow:0 8px 20px #0001}
          .tp-mobile-search-panel .tp-search{display:flex;width:100%;max-width:none;flex:1}
          .tp-actions{gap:5px}
          .tp-control{width:35px;height:35px}
          .tp-top-user{margin-left:0}
          .tp-top-user .tp-initials{width:34px;height:34px;flex-basis:34px}
          .tp-content{padding:0}
          .tp-popover{position:fixed;right:10px;top:62px;width:210px}
        }
        @media(max-width:380px){
          .tp-topbar{gap:5px;padding-inline:7px}
          .tp-actions{gap:4px}
          .tp-top-user .tp-initials{width:31px;height:31px;flex-basis:31px}
          .tp-control{width:33px;height:33px}
        }
      `}</style>

      <div className={`tp-mobile-backdrop ${mobileOpen ? "open" : ""}`} onClick={() => setMobileOpen(false)} aria-hidden="true" />

      <aside className={`tp-side ${mobileOpen ? "open" : ""}`}>
        <NavLink className="tp-brand" to="/dashboard" onClick={() => setMobileOpen(false)}>
          <img
            src="/favicon.ico"
            alt="BR30"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = "/favicon-32x32.png";
            }}
          />
          <span>
            <strong>BR30</strong>
            <small>Talent Pipeline</small>
          </span>
        </NavLink>

        <nav className="tp-nav" aria-label="Main navigation">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} end={to === "/dashboard"} onClick={() => setMobileOpen(false)}>
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="tp-side-bottom">
          <NavLink to="/settings" className={({ isActive }) => `tp-sidebar-settings${isActive ? " active" : ""}`} onClick={() => setMobileOpen(false)}>
            <Settings size={18} />
            <span>Settings</span>
          </NavLink>

          <button className="tp-logout" type="button" onClick={handleLogout}>
            <LogOut size={17} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="tp-main">
        <header className="tp-topbar">
          <button className="tp-control tp-menu-button" type="button" aria-label={mobileOpen ? "Close menu" : "Open menu"} aria-expanded={mobileOpen} onClick={() => setMobileOpen((value) => !value)}>
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <form className="tp-search" onSubmit={handleSearch}>
            <Search size={17} />
            <input ref={searchRef} value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} placeholder="Search candidates, jobs, applications..." aria-label="Search candidates" />
            {globalSearch ? (
              <button type="button" onClick={() => setGlobalSearch("")} aria-label="Clear search">
                <X size={15} />
              </button>
            ) : (
              <kbd>Ctrl K</kbd>
            )}
          </form>

          <button className="tp-control tp-mobile-search-trigger" type="button" aria-label="Open search" aria-expanded={mobileSearchOpen} onClick={() => (mobileSearchOpen ? setMobileSearchOpen(false) : openMobileSearch())}>
            {mobileSearchOpen ? <X size={18} /> : <Search size={18} />}
          </button>

          <div className="tp-actions">
            <div className="tp-control-wrap" ref={appearanceRef}>
              <button
                className="tp-control"
                type="button"
                aria-label={`Theme: ${theme}`}
                title={`Theme: ${theme}`}
                aria-expanded={appearanceOpen}
                onClick={() => {
                  setAppearanceOpen((value) => !value);
                  setNotificationsOpen(false);
                }}>
                {theme === "dark" ? <Moon size={17} /> : theme === "light" ? <Sun size={17} /> : <Activity size={17} />}
              </button>

              {appearanceOpen && (
                <div className="tp-popover">
                  <div className="tp-popover-title">Choose appearance</div>
                  {[
                    ["device", "Device", Activity],
                    ["light", "Light", Sun],
                    ["dark", "Dark", Moon],
                  ].map(([value, label, Icon]) => (
                    <button type="button" key={value} className={theme === value ? "selected" : ""} onClick={() => changeTheme(value)}>
                      <Icon size={16} />
                      <span>{label}</span>
                      {theme === value && <span className="tp-theme-check">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="tp-control-wrap" ref={notificationRef}>
              <button
                className="tp-control"
                type="button"
                aria-label="Notifications"
                title="Notifications"
                aria-expanded={notificationsOpen}
                onClick={() => {
                  setNotificationsOpen((value) => !value);
                  setAppearanceOpen(false);
                }}>
                <Bell size={18} />
              </button>

              {notificationsOpen && (
                <div className="tp-popover">
                  <div className="tp-popover-title">Notifications</div>
                  <p style={{ margin: "5px 9px 10px", color: "var(--tp-muted)", lineHeight: 1.5 }}>You're all caught up. New notifications will appear here when available.</p>
                </div>
              )}
            </div>

            <div className="tp-top-user" title={`${name} — ${role}`}>
              <div className="tp-initials">{getInitials(name)}</div>
              <div className="tp-user-copy">
                <strong>{name}</strong>
                <small>{role}</small>
              </div>
            </div>
          </div>

          {mobileSearchOpen && (
            <div className="tp-mobile-search-panel" ref={mobileSearchRef}>
              <form className="tp-search" onSubmit={handleSearch}>
                <Search size={17} />
                <input autoFocus value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} placeholder="Search candidates, jobs, applications..." aria-label="Search candidates" />
                {globalSearch && (
                  <button type="button" onClick={() => setGlobalSearch("")} aria-label="Clear search">
                    <X size={15} />
                  </button>
                )}
              </form>
            </div>
          )}
        </header>

        <main className="tp-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
