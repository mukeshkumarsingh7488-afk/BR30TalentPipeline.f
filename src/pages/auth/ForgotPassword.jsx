import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPasswordApi } from "../../api/auth.api.js";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess(false);

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Email address is required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await forgotPasswordApi({ email: normalizedEmail });
      const result = response?.data ?? response;

      if (result?.success === false || result?.status === "error" || result?.error) {
        throw new Error(result?.message || result?.error?.message || "Unable to process your request. Please try again.");
      }

      setSuccess(true);

      // The backend sends a reset OTP. Continue to the reset screen with the
      // normalized email so the user does not have to enter it a second time.
      navigate("/reset-password", {
        state: {
          email: normalizedEmail,
          message: result?.message || "If an eligible account exists for this email, password reset instructions will be sent.",
        },
      });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Unable to process your request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="br30-forgot">
      <style>{`
  .br30-forgot { width:100%; max-width:410px; margin:0 auto; color:var(--crm-text,var(--text,#202636)); font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; font-size:14px; font-weight:400; }
  .br30-forgot *, .br30-forgot *::before, .br30-forgot *::after { box-sizing:border-box; }
  .br30-forgot-icon { display:flex; width:44px; height:44px; align-items:center; justify-content:center; margin-bottom:18px; border:1px solid var(--crm-border,var(--border,#e1e5ec)); border-radius:12px; background:var(--crm-surface,var(--surface,#fff)); color:var(--crm-primary,var(--primary,#4f46e5)); }
  .br30-forgot-icon svg { width:22px; height:22px; }
  .br30-forgot-heading { margin:0 0 7px; font-size:25px; line-height:1.3; letter-spacing:-.4px; font-weight:400; }
  .br30-forgot-description { margin:0 0 20px; color:var(--crm-muted,var(--muted,#697386)); font-size:13px; line-height:1.65; font-weight:400; }
  .br30-forgot-form { display:flex; flex-direction:column; gap:7px; }
  .br30-forgot-label { color:var(--crm-text,var(--text,#202636)); font-size:12px; line-height:1.5; font-weight:400; }
  .br30-forgot-input { display:block; width:100%; height:42px; padding:0 11px; border:1px solid var(--crm-border,var(--border,#e1e5ec)); border-radius:8px; outline:none; background:var(--crm-surface,var(--surface,#fff)); color:var(--crm-text,var(--text,#202636)); font-family:inherit; font-size:13px; font-weight:400; transition:border-color .18s ease,box-shadow .18s ease; }
  .br30-forgot-input::placeholder { color:var(--crm-muted,var(--muted,#8a93a3)); opacity:.85; }
  .br30-forgot-input:focus { border-color:var(--crm-primary,var(--primary,#4f46e5)); box-shadow:0 0 0 3px color-mix(in srgb,var(--crm-primary,var(--primary,#4f46e5)) 12%,transparent); }
  .br30-forgot-input[aria-invalid="true"] { border-color:#dc2626; }
  .br30-forgot-input:-webkit-autofill,.br30-forgot-input:-webkit-autofill:hover,.br30-forgot-input:-webkit-autofill:focus,.br30-forgot-input:-webkit-autofill:active { -webkit-text-fill-color:#000000 !important; caret-color:#000000 !important; -webkit-box-shadow:0 0 0 1000px #ffffff inset !important; box-shadow:0 0 0 1000px #ffffff inset !important; }
  .br30-forgot-error { margin:0 0 14px; padding:10px 12px; border:1px solid #fecaca; border-radius:8px; background:#fef2f2; color:#b91c1c; font-size:12px; line-height:1.55; overflow-wrap:anywhere; }
  .br30-forgot-success { margin:0 0 16px; padding:12px; border:1px solid #a7f3d0; border-radius:8px; background:#ecfdf5; color:#065f46; font-size:13px; line-height:1.65; overflow-wrap:anywhere; }
  .br30-forgot-submit { display:flex; width:100%; min-height:43px; align-items:center; justify-content:center; margin-top:9px; padding:10px 14px; border:1px solid var(--crm-primary,var(--primary,#4f46e5)); border-radius:8px; background:var(--crm-primary,var(--primary,#4f46e5)); color:#fff; font-family:inherit; font-size:13px; font-weight:400; cursor:pointer; transition:opacity .18s ease; }
  .br30-forgot-submit:hover:not(:disabled) { opacity:.91; }
  .br30-forgot-submit:disabled { cursor:not-allowed; opacity:.65; }
  .br30-forgot-footer { margin:18px 0 0; text-align:center; font-size:12px; line-height:1.6; }
  .br30-forgot-link { color:var(--crm-primary,var(--primary,#4f46e5)); text-decoration:none; }
  .br30-forgot-link:hover { text-decoration:underline; text-underline-offset:3px; }
  @media (max-width:480px) { .br30-forgot-heading { font-size:23px; } .br30-forgot-description { margin-bottom:16px; } .br30-forgot-icon { width:40px; height:40px; margin-bottom:14px; } }
  @media (max-height:600px) { .br30-forgot-icon { width:34px; height:34px; margin-bottom:10px; } .br30-forgot-heading { font-size:22px; } .br30-forgot-description { margin-bottom:12px; } .br30-forgot-footer { margin-top:12px; } }
  @media (prefers-reduced-motion:reduce) { .br30-forgot *, .br30-forgot *::before, .br30-forgot *::after { transition-duration:.01ms!important; } }
      `}</style>

      <div className="br30-forgot-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="10" width="16" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          <path d="M12 14v3" />
        </svg>
      </div>

      <h1 className="br30-forgot-heading">Forgot password?</h1>

      <p className="br30-forgot-description">Enter the email address associated with your BR30 Talent Pipeline account. If your account is eligible, you will receive password reset instructions.</p>

      {error && (
        <div className="br30-forgot-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="br30-forgot-success" role="status">
          If an eligible account exists for this email, password reset instructions will be sent. Please check your inbox and spam folder.
        </div>
      )}

      <form className="br30-forgot-form" onSubmit={handleSubmit} noValidate>
        <label className="br30-forgot-label" htmlFor="forgot-email">
          Email address
        </label>

        <input
          className="br30-forgot-input"
          id="forgot-email"
          name="email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={254}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setError("");
            setSuccess(false);
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "forgot-email-error" : undefined}
          required
          disabled={loading}
        />

        {error && (
          <p className="br30-forgot-error" id="forgot-email-error">
            {error}
          </p>
        )}

        <button className="br30-forgot-submit" type="submit" disabled={loading}>
          {loading ? "Sending instructions..." : "Send reset instructions"}
        </button>
      </form>

      <p className="br30-forgot-footer">
        Remember your password?{" "}
        <Link className="br30-forgot-link" to="/">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
