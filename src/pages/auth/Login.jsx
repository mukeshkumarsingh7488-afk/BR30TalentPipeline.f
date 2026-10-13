import { useState } from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();

  const navigate = useNavigate();

  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });

  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({ ...current, [name]: value }));

    setFieldErrors((current) => ({ ...current, [name]: "" }));

    if (error) setError("");
  };

  const validateForm = () => {
    const errors = {};

    const email = form.email.trim();

    if (!email) {
      errors.email = "Work email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Enter a valid email address.";
    }

    if (!form.password) {
      errors.password = "Password is required.";
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      await login({ email: form.email.trim().toLowerCase(), password: form.password });

      const requestedPath = location.state?.from;

      const pathname = requestedPath?.pathname;

      const isValidDestination = pathname?.startsWith("/") && !pathname.startsWith("//") && !["/", "/register", "/verify-email", "/forgot-password", "/reset-password"].includes(pathname);

      navigate(isValidDestination ? { pathname, search: requestedPath.search || "", hash: requestedPath.hash || "" } : "/dashboard", { replace: true });
    } catch (err) {
      setError(err?.message || "Unable to sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="br30-login">
      <style>{`

        .br30-login { width: 100%; min-width: 0; color: var(--crm-text, var(--text, #202636)); font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 16px; font-weight: 400; }

        .br30-login *, .br30-login *::before, .br30-login *::after { box-sizing: border-box; }

        .br30-login-heading { margin: 0 0 9px; font-size: 28px; line-height: 1.3; letter-spacing: -0.6px; font-weight: 400; }

        .br30-login-description { margin: 0 0 28px; color: var(--crm-muted, var(--muted, #697386)); font-size: 14px; line-height: 1.7; font-weight: 400; }

        .br30-login-form { display: flex; flex-direction: column; gap: 19px; }

        .br30-login-field { display: flex; flex-direction: column; gap: 8px; min-width: 0; }

        .br30-login-label { color: var(--crm-text, var(--text, #202636)); font-size: 14px; line-height: 1.5; font-weight: 400; }

        .br30-login-input-wrap { position: relative; display: flex; align-items: center; width: 100%; }

        .br30-login-input { display: block; width: 100%; min-width: 0; height: 49px; padding: 0 14px; border: 1px solid var(--crm-border, var(--border, #dfe3eb)); border-radius: 10px; outline: none; background: var(--crm-surface, var(--surface, #ffffff)); color: var(--crm-text, var(--text, #202636)); font-family: inherit; font-size: 14px; font-weight: 400; transition: border-color 0.18s ease, box-shadow 0.18s ease; }

        .br30-login-input::placeholder { color: var(--crm-muted, var(--muted, #8a93a3)); opacity: 0.85; }

        .br30-login-input:focus { border-color: var(--crm-primary, var(--primary, #4f46e5)); box-shadow: 0 0 0 3px color-mix(in srgb, var(--crm-primary, var(--primary, #4f46e5)) 12%, transparent); }

        .br30-login-input:-webkit-autofill,.br30-login-input:-webkit-autofill:hover,.br30-login-input:-webkit-autofill:focus,.br30-login-input:-webkit-autofill:active { -webkit-text-fill-color:#000000 !important; caret-color:#000000 !important; -webkit-box-shadow:0 0 0 1000px #ffffff inset !important; box-shadow:0 0 0 1000px #ffffff inset !important; }

        .br30-login-input[aria-invalid="true"] { border-color: #dc2626; }

        .br30-login-input.has-password-action { padding-right: 76px; }

        .br30-login-password-toggle { position: absolute; right: 9px; display: inline-flex; align-items: center; justify-content: center; min-height: 34px; padding: 0 6px; border: 0; border-radius: 6px; background: transparent; color: var(--crm-muted, var(--muted, #697386)); font-family: inherit; font-size: 12px; font-weight: 400; cursor: pointer; }

        .br30-login-password-toggle:hover { color: var(--crm-primary, var(--primary, #4f46e5)); }

        .br30-login-password-toggle:focus-visible { outline: 2px solid var(--crm-primary, var(--primary, #4f46e5)); outline-offset: 2px; }

        .br30-login-field-error { margin: 0; color: #dc2626; font-size: 12px; line-height: 1.5; font-weight: 400; }

        .br30-login-options { display: flex; align-items: center; justify-content: flex-end; margin-top: -7px; }

        .br30-login-link { color: var(--crm-primary, var(--primary, #4f46e5)); font-size: 13px; line-height: 1.6; font-weight: 400; text-decoration: none; }

        .br30-login-link:hover { text-decoration: underline; text-underline-offset: 3px; }

        .br30-login-error { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 2px; padding: 12px 13px; border: 1px solid #fecaca; border-radius: 9px; background: #fef2f2; color: #b91c1c; font-size: 13px; line-height: 1.6; font-weight: 400; overflow-wrap: anywhere; }

        .br30-login-error-icon { display: grid; flex: 0 0 20px; width: 20px; height: 20px; place-items: center; border: 1px solid #fca5a5; border-radius: 50%; font-size: 12px; }

        .br30-login-submit { display: flex; width: 100%; min-height: 49px; align-items: center; justify-content: center; gap: 10px; padding: 12px 16px; border: 1px solid var(--crm-primary, var(--primary, #4f46e5)); border-radius: 10px; background: var(--crm-primary, var(--primary, #4f46e5)); color: #ffffff; font-family: inherit; font-size: 15px; font-weight: 400; cursor: pointer; transition: opacity 0.18s ease, transform 0.18s ease; }

        .br30-login-submit:hover:not(:disabled) { opacity: 0.92; }

        .br30-login-submit:active:not(:disabled) { transform: translateY(1px); }

        .br30-login-submit:focus-visible { outline: 2px solid var(--crm-primary, var(--primary, #4f46e5)); outline-offset: 3px; }

        .br30-login-submit:disabled { cursor: not-allowed; opacity: 0.65; }

        .br30-login-spinner { width: 17px; height: 17px; border: 2px solid rgba(255, 255, 255, 0.45); border-top-color: #ffffff; border-radius: 50%; animation: br30-login-spin 0.7s linear infinite; }

        @keyframes br30-login-spin { to { transform: rotate(360deg); } }

        .br30-login-register { margin: 25px 0 0; color: var(--crm-muted, var(--muted, #697386)); font-size: 13px; line-height: 1.8; text-align: center; font-weight: 400; }

        .br30-login-register .br30-login-link { margin-left: 4px; }

        .br30-login-footer { margin-top: 28px; color: var(--crm-muted, var(--muted, #697386)); font-size: 12px; line-height: 1.8; text-align: center; font-weight: 400; }

        @media (max-width: 480px) { .br30-login-heading { font-size: 25px; } .br30-login-description { margin-bottom: 24px; } .br30-login-form { gap: 17px; } .br30-login-register { margin-top: 22px; } .br30-login-footer { margin-top: 23px; } }

        @media (prefers-reduced-motion: reduce) { .br30-login *, .br30-login *::before, .br30-login *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }

      `}</style>

      <h1 className="br30-login-heading">Welcome back</h1>

      <p className="br30-login-description">Sign in to access your HR recruitment workspace.</p>

      {error && (
        <div className="br30-login-error" role="alert">
          <span className="br30-login-error-icon" aria-hidden="true">
            !
          </span>

          <span>{error}</span>
        </div>
      )}

      <form className="br30-login-form" onSubmit={handleSubmit} noValidate>
        <div className="br30-login-field">
          <label className="br30-login-label" htmlFor="login-email">
            Work email
          </label>

          <input
            id="login-email"
            className="br30-login-input"
            type="email"
            name="email"
            placeholder="you\@company.com"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={form.email}
            onChange={handleChange}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
            disabled={submitting}
            required
          />

          {fieldErrors.email && (
            <p className="br30-login-field-error" id="login-email-error">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div className="br30-login-field">
          <label className="br30-login-label" htmlFor="login-password">
            Password
          </label>

          <div className="br30-login-input-wrap">
            <input
              id="login-password"
              className="br30-login-input has-password-action"
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
              disabled={submitting}
              required
            />

            <button className="br30-login-password-toggle" type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} disabled={submitting}>
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {fieldErrors.password && (
            <p className="br30-login-field-error" id="login-password-error">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <div className="br30-login-options">
          <Link className="br30-login-link" to="/forgot-password">
            Forgot password?
          </Link>
        </div>

        <button className="br30-login-submit" type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <span className="br30-login-spinner" aria-hidden="true" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <p className="br30-login-register">
        Need an HR account?
        <Link className="br30-login-link" to="/register">
          Account access
        </Link>
      </p>

      <p className="br30-login-footer">Secure access for authorized HR team members.</p>
    </div>
  );
}
