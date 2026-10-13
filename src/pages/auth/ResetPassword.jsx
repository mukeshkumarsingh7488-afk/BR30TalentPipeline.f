import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { resetPasswordApi } from "../../api/auth.api.js";

const getPasswordChecks = (password) => ({
  length: password.length >= 12 && password.length <= 128,
  lowercase: /[a-z]/.test(password),
  uppercase: /[A-Z]/.test(password),
  number: /\d/.test(password),
  special: /[^A-Za-z0-9]/.test(password),
});

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: "", color: "transparent" };
  const checks = getPasswordChecks(password);
  const score = Object.values(checks).filter(Boolean).length;

  if (password.length < 12 || /(.)\1{3,}/.test(password) || /password|qwerty|123456|abcdef|admin/i.test(password)) {
    return { score: Math.min(score, 2), label: "Weak", color: "#dc2626" };
  }
  if (score <= 2) return { score, label: "Weak", color: "#dc2626" };
  if (score <= 4) return { score, label: "Medium", color: "#d97706" };
  return { score: 5, label: "Strong", color: "#16a34a" };
};

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState(location.state?.email || searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const checks = getPasswordChecks(password);
  const strength = getPasswordStrength(password);

  const requirements = [
    ["length", "12–128 characters"],
    ["uppercase", "Uppercase letter (A–Z)"],
    ["lowercase", "Lowercase letter (a–z)"],
    ["number", "One number (0–9)"],
    ["special", "One special character (!@#$)"],
  ];

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedOtp = otp.replace(/\s/g, "");

    if (!normalizedEmail) {
      setError("Email address is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!normalizedOtp) {
      setError("Enter the OTP sent to your email.");
      return;
    }
    if (password.length < 12 || password.length > 128) {
      setError("Password must be between 12 and 128 characters.");
      return;
    }
    if (Object.values(checks).some((check) => !check)) {
      setError("Password must include uppercase, lowercase, a number and a special character.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await resetPasswordApi({
        email: normalizedEmail,
        otp: normalizedOtp,
        newPassword: password,
      });
      const result = response?.data ?? response;

      if (result?.success === false || result?.status === "error" || result?.error) {
        throw new Error(result?.message || result?.error?.message || "Unable to reset your password.");
      }

      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
      setOtp("");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Unable to reset your password. The OTP may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="br30-reset">
      <style>{`
        .br30-reset { width:100%; max-width:420px; margin:0 auto; color:var(--crm-text,var(--text,#202636)); font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; font-size:14px; font-weight:400; }
        .br30-reset *, .br30-reset *::before, .br30-reset *::after { box-sizing:border-box; }
        .br30-reset-icon { display:flex; width:40px; height:40px; align-items:center; justify-content:center; margin-bottom:13px; border:1px solid var(--crm-border,var(--border,#e1e5ec)); border-radius:10px; background:var(--crm-surface,var(--surface,#fff)); color:var(--crm-primary,var(--primary,#4f46e5)); }
        .br30-reset-icon svg { width:21px; height:21px; }
        .br30-reset-heading { margin:0 0 6px; font-size:24px; line-height:1.3; letter-spacing:-.4px; font-weight:400; }
        .br30-reset-description { margin:0 0 15px; color:var(--crm-muted,var(--muted,#697386)); font-size:13px; line-height:1.5; font-weight:400; }
        .br30-reset-form { display:flex; flex-direction:column; gap:9px; }
        .br30-reset-field { display:flex; min-width:0; flex-direction:column; gap:4px; }
        .br30-reset-label { color:var(--crm-text,var(--text,#202636)); font-size:12px; line-height:1.4; font-weight:400; }
        .br30-reset-wrap { position:relative; display:flex; align-items:center; width:100%; }
        .br30-reset-input { display:block; width:100%; min-width:0; height:39px; padding:0 10px; border:1px solid var(--crm-border,var(--border,#e1e5ec)); border-radius:8px; outline:none; background:var(--crm-surface,var(--surface,#fff)); color:var(--crm-text,var(--text,#202636)); font-family:inherit; font-size:13px; font-weight:400; transition:border-color .18s ease,box-shadow .18s ease; }
        .br30-reset-input::placeholder { color:var(--crm-muted,var(--muted,#8a93a3)); opacity:.85; }
        .br30-reset-input:focus { border-color:var(--crm-primary,var(--primary,#4f46e5)); box-shadow:0 0 0 3px color-mix(in srgb,var(--crm-primary,var(--primary,#4f46e5)) 12%,transparent); }
        .br30-reset-input[aria-invalid="true"] { border-color:#dc2626; }
        .br30-reset-input.has-toggle { padding-right:58px; }
        .br30-reset-input:-webkit-autofill,.br30-reset-input:-webkit-autofill:hover,.br30-reset-input:-webkit-autofill:focus,.br30-reset-input:-webkit-autofill:active { -webkit-text-fill-color:#000000 !important; caret-color:#000000 !important; -webkit-box-shadow:0 0 0 1000px #ffffff inset !important; box-shadow:0 0 0 1000px #ffffff inset !important; }
        .br30-reset-toggle { position:absolute; right:7px; display:inline-flex; min-height:28px; align-items:center; justify-content:center; padding:0 5px; border:0; border-radius:6px; background:transparent; color:var(--crm-muted,var(--muted,#697386)); font-family:inherit; font-size:11px; font-weight:400; cursor:pointer; }
        .br30-reset-toggle:hover { color:var(--crm-primary,var(--primary,#4f46e5)); }
        .br30-reset-panel { display:flex; flex-direction:column; gap:6px; margin-top:2px; padding:8px 9px; border:1px solid var(--crm-border,var(--border,#e1e5ec)); border-radius:8px; background:var(--crm-surface,var(--surface,#fff)); }
        .br30-reset-strength-head { display:flex; align-items:center; justify-content:space-between; gap:8px; font-size:11px; }
        .br30-reset-muted { color:var(--crm-muted,var(--muted,#697386)); }
        .br30-reset-meter { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:4px; }
        .br30-reset-meter span { height:3px; border-radius:99px; background:var(--crm-border,var(--border,#e1e5ec)); }
        .br30-reset-checks { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:5px 8px; }
        .br30-reset-check { display:flex; min-width:0; align-items:center; gap:5px; color:var(--crm-muted,var(--muted,#697386)); font-size:10px; line-height:1.3; }
        .br30-reset-check-mark { display:inline-flex; width:15px; height:15px; flex:0 0 15px; align-items:center; justify-content:center; border:1px solid var(--crm-border,var(--border,#d1d5db)); border-radius:50%; color:transparent; font-size:9px; }
        .br30-reset-check.valid { color:#16a34a; }
        .br30-reset-check.valid .br30-reset-check-mark { border-color:#16a34a; background:#16a34a; color:#fff; }
        .br30-reset-match { margin:0; color:#16a34a; font-size:11px; }
        .br30-reset-mismatch { margin:0; color:#dc2626; font-size:11px; }
        .br30-reset-error { margin:0 0 12px; padding:9px 11px; border:1px solid #fecaca; border-radius:8px; background:#fef2f2; color:#b91c1c; font-size:12px; line-height:1.5; overflow-wrap:anywhere; }
        .br30-reset-success { margin:0 0 13px; padding:10px 11px; border:1px solid #a7f3d0; border-radius:8px; background:#ecfdf5; color:#065f46; font-size:12px; line-height:1.6; overflow-wrap:anywhere; }
        .br30-reset-submit { display:flex; width:100%; min-height:41px; align-items:center; justify-content:center; margin-top:3px; padding:9px 14px; border:1px solid var(--crm-primary,var(--primary,#4f46e5)); border-radius:8px; background:var(--crm-primary,var(--primary,#4f46e5)); color:#fff; font-family:inherit; font-size:13px; font-weight:400; cursor:pointer; transition:opacity .18s ease; }
        .br30-reset-submit:hover:not(:disabled) { opacity:.91; }
        .br30-reset-submit:disabled { cursor:not-allowed; opacity:.65; }
        .br30-reset-footer { margin:14px 0 0; text-align:center; font-size:12px; line-height:1.6; }
        .br30-reset-link { color:var(--crm-primary,var(--primary,#4f46e5)); text-decoration:none; }
        .br30-reset-link:hover { text-decoration:underline; text-underline-offset:3px; }
        @media (max-width:480px) { .br30-reset-heading { font-size:22px; } .br30-reset-description { margin-bottom:12px; } .br30-reset-form { gap:8px; } }
        @media (max-height:700px) { .br30-reset-icon { width:34px; height:34px; margin-bottom:9px; } .br30-reset-heading { font-size:21px; } .br30-reset-description { margin-bottom:9px; } .br30-reset-form { gap:7px; } .br30-reset-panel { gap:5px; padding:6px 8px; } .br30-reset-footer { margin-top:9px; } }
        @media (prefers-reduced-motion:reduce) { .br30-reset *, .br30-reset *::before, .br30-reset *::after { transition-duration:.01ms!important; } }
      `}</style>

      <div className="br30-reset-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="10" width="16" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          <path d="M12 14v3" />
        </svg>
      </div>

      <h1 className="br30-reset-heading">{success ? "Password reset complete" : "Reset your password"}</h1>
      <p className="br30-reset-description">{success ? "Your password has been updated. You can now sign in with your new password." : "Enter the OTP sent to your email and choose a new password for your BR30 Talent Pipeline account."}</p>

      {error && (
        <div className="br30-reset-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="br30-reset-success" role="status">
          Your password was reset successfully.
        </div>
      )}

      {!success && (
        <form className="br30-reset-form" onSubmit={handleSubmit} noValidate>
          <div className="br30-reset-field">
            <label className="br30-reset-label" htmlFor="reset-email">
              Email address
            </label>
            <input className="br30-reset-input" id="reset-email" type="email" value={email} placeholder="you@company.com" autoComplete="email" autoCapitalize="none" maxLength={254} readOnly aria-readonly="true" required disabled={loading} />
          </div>

          <div className="br30-reset-field">
            <label className="br30-reset-label" htmlFor="reset-otp">
              Email OTP
            </label>
            <input
              className="br30-reset-input"
              id="reset-otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={(event) => {
                setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));
                setError("");
              }}
              placeholder="Enter the OTP from your email"
              maxLength={6}
              pattern="[0-9]*"
              required
              disabled={loading}
            />
          </div>

          <div className="br30-reset-field">
            <label className="br30-reset-label" htmlFor="reset-password">
              New password
            </label>
            <div className="br30-reset-wrap">
              <input
                className="br30-reset-input has-toggle"
                id="reset-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value.slice(0, 128));
                  setError("");
                }}
                placeholder="12–128 characters"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                aria-invalid={Boolean(error)}
                required
                disabled={loading}
              />
              <button className="br30-reset-toggle" type="button" onClick={() => setShowPassword((value) => !value)} disabled={loading}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {password && (
              <div className="br30-reset-panel" aria-live="polite">
                <div className="br30-reset-strength-head">
                  <span className="br30-reset-muted">Password strength</span>
                  <span style={{ color: strength.color }}>{strength.label}</span>
                </div>
                <div className="br30-reset-meter">
                  {[0, 1, 2, 3, 4].map((index) => (
                    <span key={index} style={{ background: index < strength.score ? strength.color : undefined }} />
                  ))}
                </div>
                <div className="br30-reset-checks">
                  {requirements.map(([key, label]) => (
                    <div key={key} className={`br30-reset-check${checks[key] ? " valid" : ""}`}>
                      <span className="br30-reset-check-mark">{checks[key] ? "✓" : "•"}</span>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="br30-reset-field">
            <label className="br30-reset-label" htmlFor="reset-confirm-password">
              Confirm new password
            </label>
            <div className="br30-reset-wrap">
              <input
                className="br30-reset-input has-toggle"
                id="reset-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value.slice(0, 128));
                  setError("");
                }}
                placeholder="Re-enter new password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
                disabled={loading}
              />
              <button className="br30-reset-toggle" type="button" onClick={() => setShowConfirmPassword((value) => !value)} disabled={loading}>
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
            {confirmPassword && password === confirmPassword && <p className="br30-reset-match">✓ Passwords match</p>}
            {confirmPassword && password !== confirmPassword && <p className="br30-reset-mismatch">Passwords do not match.</p>}
          </div>

          <button className="br30-reset-submit" type="submit" disabled={loading}>
            {loading ? "Updating password..." : "Reset password"}
          </button>
        </form>
      )}

      <p className="br30-reset-footer">
        {success ? (
          <button className="br30-reset-link" type="button" onClick={() => navigate("/", { replace: true })} style={{ border: 0, padding: 0, background: "transparent", font: "inherit", cursor: "pointer" }}>
            Continue to sign in
          </button>
        ) : (
          <Link className="br30-reset-link" to="/forgot-password">
            Request a new OTP
          </Link>
        )}
      </p>
    </div>
  );
}
