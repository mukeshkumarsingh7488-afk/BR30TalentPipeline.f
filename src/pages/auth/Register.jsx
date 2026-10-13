import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
const getPasswordChecks = (password) => ({
  length: password.length >= 6 && password.length <= 12,
  lowercase: /[a-z]/.test(password),
  uppercase: /[A-Z]/.test(password),
  number: /\d/.test(password),
  special: /[^A-Za-z0-9]/.test(password),
});
const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: "", color: "transparent" };
  const checks = getPasswordChecks(password);
  const score = Object.values(checks).filter(Boolean).length;
  const hasRepeatedChars = /(.)\1{3,}/.test(password);
  const hasCommonPattern = /password|qwerty|123456|abcdef|admin/i.test(password);
  if (hasRepeatedChars || hasCommonPattern) {
    return { score: Math.min(score, 2), label: "Weak", color: "#dc2626" };
  }
  if (score <= 2) {
    return { score, label: "Weak", color: "#dc2626" };
  }
  if (score <= 4) {
    return { score, label: "Medium", color: "#d97706" };
  }
  return {
    score: password.length >= 16 ? 5 : 4,
    label: password.length >= 16 ? "Strong" : "Good",
    color: password.length >= 16 ? "#059669" : "#16a34a",
  };
};
export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const passwordChecks = getPasswordChecks(form.password);
  const passwordStrength = getPasswordStrength(form.password);
  const handleChange = (event) => {
    const { name } = event.target;
    let { value } = event.target;
    if (name === "name") {
      value = value.replace(/[0-9]/g, "");
    }
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
    setError("");
    setSuccess(false);
  };
  const handlePhoneChange = (event) => {
    const phone = event.target.value.replace(/\D/g, "").slice(0, 10);
    setForm((current) => ({ ...current, phone }));
    setFieldErrors((current) => ({ ...current, phone: "" }));
    setError("");
    setSuccess(false);
  };
  const validate = () => {
    const errors = {};
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone;
    if (!name) {
      errors.name = "Full name is required.";
    } else if (name.length < 2 || name.length > 80) {
      errors.name = "Name must be between 2 and 80 characters.";
    }
    if (!email) {
      errors.email = "Work email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Enter a valid email address.";
    }
    if (!phone) {
      errors.phone = "Mobile number is required.";
    } else if (!/^[6-9]\d{9}$/.test(phone)) {
      errors.phone = "Enter a valid 10-digit Indian mobile number.";
    }
    if (!form.password) {
      errors.password = "Password is required.";
    } else if (form.password.length < 6 || form.password.length > 12) {
      errors.password = "Password must be between 6 and 12 characters.";
    } else if (!/[a-z]/.test(form.password) || !/[A-Z]/.test(form.password) || !/\d/.test(form.password) || !/[^A-Za-z0-9]/.test(form.password)) {
      errors.password = "Use uppercase, lowercase, a number and a special character.";
    }
    if (!form.confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess(false);
    if (!validate()) return;
    setLoading(true);
    try {
      const email = form.email.trim().toLowerCase();
      const result = await register({
        name: form.name.trim(),
        email,
        password: form.password,
      });
      navigate("/verify-email", {
        state: {
          email: result?.email || email,
          message: result?.message || "Registration successful. Enter the verification code sent to your email.",
        },
      });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Unable to submit registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const requirements = [
    ["length", "6–12 characters"],
    ["uppercase", "One uppercase letter (A–Z)"],
    ["lowercase", "One lowercase letter (a–z)"],
    ["number", "One number (0–9)"],
    ["special", "One special character (!@#$)"],
  ];
  return (
    <div className="br30-register">
      <style>{`
  .br30-register { width:100%; max-width:420px; margin:0 auto; color:var(--crm-text,var(--text,#202636)); font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; font-size:14px; font-weight:400; }
  .br30-register \*,.br30-register \*::before,.br30-register \*::after { box-sizing:border-box; }
  .br30-register-heading { margin:0 0 4px; font-size:24px; line-height:1.3; letter-spacing:-.4px; font-weight:400; }
  .br30-register-description { margin:0 0 12px; color:var(--crm-muted,var(--muted,#697386)); font-size:13px; line-height:1.45; font-weight:400; }
  .br30-register-form { display:flex; flex-direction:column; gap:9px; }
  .br30-register-field { display:flex; min-width:0; flex-direction:column; gap:4px; }
  .br30-register-label { color:var(--crm-text,var(--text,#202636)); font-size:12px; line-height:1.35; font-weight:400; }
  .br30-register-input-wrap { position:relative; display:flex; align-items:center; width:100%; }
  .br30-register-input { display:block; width:100%; min-width:0; height:38px; padding:0 10px; border:1px solid var(--crm-border,var(--border,#e1e5ec)); border-radius:8px; outline:none; background:var(--crm-surface,var(--surface,#fff)); color:var(--crm-text,var(--text,#202636)); font-family:inherit; font-size:13px; font-weight:400; transition:border-color .18s ease,box-shadow .18s ease; }
  .br30-register-input::placeholder { color:var(--crm-muted,var(--muted,#8a93a3)); opacity:.85; }
  .br30-register-input:focus { border-color:var(--crm-primary,var(--primary,#4f46e5)); box-shadow:0 0 0 3px color-mix(in srgb,var(--crm-primary,var(--primary,#4f46e5)) 12%,transparent); }
  .br30-register-input[aria-invalid="true"] { border-color:#dc2626; }
  .br30-register-input.has-toggle { padding-right:60px; }
  .br30-register-input:-webkit-autofill,.br30-register-input:-webkit-autofill:hover,.br30-register-input:-webkit-autofill:focus,.br30-register-input:-webkit-autofill:active { -webkit-text-fill-color:#000000 !important; caret-color:#000000 !important; -webkit-box-shadow:0 0 0 1000px #ffffff inset !important; box-shadow:0 0 0 1000px #ffffff inset !important; }
  .br30-register-toggle { position:absolute; right:7px; display:inline-flex; align-items:center; justify-content:center; min-height:28px; padding:0 5px; border:0; border-radius:6px; background:transparent; color:var(--crm-muted,var(--muted,#697386)); font-family:inherit; font-size:11px; font-weight:400; cursor:pointer; }
  .br30-register-toggle:hover { color:var(--crm-primary,var(--primary,#4f46e5)); }
  .br30-register-field-error { margin:0; color:#dc2626; font-size:11px; line-height:1.35; font-weight:400; }
  .br30-register-error { margin-bottom:10px; padding:8px 10px; border:1px solid #fecaca; border-radius:8px; background:#fef2f2; color:#b91c1c; font-size:12px; line-height:1.45; font-weight:400; overflow-wrap:anywhere; }
  .br30-register-success { margin-bottom:10px; padding:9px 10px; border:1px solid #a7f3d0; border-radius:8px; background:#ecfdf5; color:#065f46; font-size:12px; line-height:1.5; font-weight:400; overflow-wrap:anywhere; }
  .br30-password-panel { display:flex; flex-direction:column; gap:6px; margin-top:2px; padding:8px 9px; border:1px solid var(--crm-border,var(--border,#e1e5ec)); border-radius:8px; background:var(--crm-surface,var(--surface,#fff)); }
  .br30-password-strength-head { display:flex; align-items:center; justify-content:space-between; gap:8px; font-size:11px; }
  .br30-password-strength-title { color:var(--crm-muted,var(--muted,#697386)); font-weight:400; }
  .br30-password-strength-value { font-weight:500; }
  .br30-password-meter { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:4px; }
  .br30-password-meter-segment { height:3px; border-radius:99px; background:var(--crm-border,var(--border,#e1e5ec)); }
  .br30-password-checks { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:5px 8px; }
  .br30-password-check { display:flex; align-items:center; gap:5px; min-width:0; color:var(--crm-muted,var(--muted,#697386)); font-size:10px; line-height:1.3; font-weight:400; }
  .br30-password-check-mark { display:inline-flex; width:15px; height:15px; flex:0 0 15px; align-items:center; justify-content:center; border:1px solid var(--crm-border,var(--border,#d1d5db)); border-radius:50%; color:transparent; font-size:9px; }
  .br30-password-check.is-valid { color:#16a34a; }
  .br30-password-check.is-valid .br30-password-check-mark { border-color:#16a34a; background:#16a34a; color:#fff; }
  .br30-password-match { margin:0; color:#16a34a; font-size:11px; }
  .br30-password-mismatch { margin:0; color:#dc2626; font-size:11px; }
  .br30-register-submit { display:flex; width:100%; min-height:40px; align-items:center; justify-content:center; gap:8px; margin-top:2px; padding:9px 14px; border:1px solid var(--crm-primary,var(--primary,#4f46e5)); border-radius:8px; background:var(--crm-primary,var(--primary,#4f46e5)); color:#fff; font-family:inherit; font-size:13px; font-weight:400; cursor:pointer; transition:opacity .18s ease; }
  .br30-register-submit:hover:not(:disabled) { opacity:.91; }
  .br30-register-submit:disabled { cursor:not-allowed; opacity:.65; }
  .br30-register-footer { margin:12px 0 0; color:var(--crm-muted,var(--muted,#697386)); font-size:12px; line-height:1.5; text-align:center; font-weight:400; }
  .br30-register-link { color:var(--crm-primary,var(--primary,#4f46e5)); text-decoration:none; }
  .br30-register-link:hover { text-decoration:underline; text-underline-offset:3px; }
  @media (max-width:480px) { .br30-register-heading { font-size:22px; } .br30-register-description { margin-bottom:10px; } .br30-register-form { gap:8px; } .br30-register-input { height:38px; } .br30-password-checks { grid-template-columns:repeat(2,minmax(0,1fr)); } }
  @media (max-height:760px) { .br30-register-heading { font-size:21px; } .br30-register-description { margin-bottom:8px; } .br30-register-form { gap:7px; } .br30-register-field { gap:3px; } .br30-register-input { height:35px; } .br30-password-panel { gap:5px; padding:6px 8px; } .br30-password-checks { gap:4px 6px; } .br30-register-footer { margin-top:8px; } }
  @media (prefers-reduced-motion:reduce) { .br30-register \*,.br30-register \*::before,.br30-register \*::after { transition-duration:.01ms!important; } }
`}</style>
      <h1 className="br30-register-heading">Create your HR account</h1>
      <p className="br30-register-description">Enter your details to request access to BR30 Talent Pipeline.</p>
      {error && (
        <div className="br30-register-error" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="br30-register-success" role="status">
          Your registration request was accepted by the server. Follow the backend's verification instructions before signing in.
        </div>
      )}
      <form className="br30-register-form" onSubmit={handleSubmit} noValidate>
        <div className="br30-register-field">
          <label className="br30-register-label" htmlFor="register-name">
            Full name
          </label>
          <input className="br30-register-input" id="register-name" name="name" type="text" placeholder="Enter your full name" autoComplete="name" maxLength={80} value={form.name} onChange={handleChange} aria-invalid={Boolean(fieldErrors.name)} disabled={loading} />
          {fieldErrors.name && <p className="br30-register-field-error">{fieldErrors.name}</p>}
        </div>
        <div className="br30-register-field">
          <label className="br30-register-label" htmlFor="register-email">
            Work email
          </label>
          <input className="br30-register-input" id="register-email" name="email" type="email" placeholder="you@company.com" autoComplete="email" autoCapitalize="none" spellCheck={false} value={form.email} onChange={handleChange} aria-invalid={Boolean(fieldErrors.email)} disabled={loading} />
          {fieldErrors.email && <p className="br30-register-field-error">{fieldErrors.email}</p>}
        </div>
        <div className="br30-register-field">
          <label className="br30-register-label" htmlFor="register-phone">
            Mobile number
          </label>
          <input
            className="br30-register-input"
            id="register-phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            placeholder="10-digit mobile number"
            autoComplete="tel-national"
            maxLength={10}
            value={form.phone}
            onChange={handlePhoneChange}
            aria-invalid={Boolean(fieldErrors.phone)}
            disabled={loading}
          />
          {fieldErrors.phone && <p className="br30-register-field-error">{fieldErrors.phone}</p>}
        </div>
        <div className="br30-register-field">
          <label className="br30-register-label" htmlFor="register-password">
            Password
          </label>
          <div className="br30-register-input-wrap">
            <input
              className="br30-register-input has-toggle"
              id="register-password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="6–12 characters"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.password)}
              disabled={loading}
            />
            <button className="br30-register-toggle" type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"} disabled={loading}>
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {form.password && (
            <div className="br30-password-panel" aria-live="polite">
              <div className="br30-password-strength-head">
                <span className="br30-password-strength-title">Password strength</span>
                <span className="br30-password-strength-value" style={{ color: passwordStrength.color }}>
                  {passwordStrength.label}
                </span>
              </div>
              <div className="br30-password-meter">
                {[0, 1, 2, 3, 4].map((index) => (
                  <span key={index} className="br30-password-meter-segment" style={{ background: index < passwordStrength.score ? passwordStrength.color : undefined }} />
                ))}
              </div>
              <div className="br30-password-checks">
                {requirements.map(([key, label]) => (
                  <div key={key} className={`br30-password-check${passwordChecks[key] ? " is-valid" : ""}`}>
                    <span className="br30-password-check-mark">{passwordChecks[key] ? "✓" : "•"}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {fieldErrors.password && <p className="br30-register-field-error">{fieldErrors.password}</p>}
        </div>
        <div className="br30-register-field">
          <label className="br30-register-label" htmlFor="register-confirm-password">
            Confirm password
          </label>
          <div className="br30-register-input-wrap">
            <input
              className="br30-register-input has-toggle"
              id="register-confirm-password"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              disabled={loading}
            />
            <button className="br30-register-toggle" type="button" onClick={() => setShowConfirmPassword((current) => !current)} aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"} disabled={loading}>
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>
          {form.confirmPassword && form.password === form.confirmPassword && <p className="br30-password-match">✓ Passwords match</p>}
          {fieldErrors.confirmPassword && <p className="br30-register-field-error">{fieldErrors.confirmPassword}</p>}
          {form.confirmPassword && form.password !== form.confirmPassword && <p className="br30-password-mismatch">Passwords do not match.</p>}
        </div>
        <button className="br30-register-submit" type="submit" disabled={loading}>
          {loading ? "Submitting request..." : "Create account"}
        </button>
      </form>
      <p className="br30-register-footer">
        Already have an account?{" "}
        <Link className="br30-register-link" to="/">
          Sign in
        </Link>
      </p>
    </div>
  );
}
