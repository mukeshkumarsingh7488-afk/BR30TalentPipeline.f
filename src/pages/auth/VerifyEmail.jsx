import { useEffect, useState } from "react";

import { Link, useLocation } from "react-router-dom";

import { verifyEmailApi, resendVerificationApi } from "../../api/auth.api.js";

export default function VerifyEmail() {
  const location = useLocation();
  const email = (location.state?.email || "").trim().toLowerCase();

  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);

  const [resending, setResending] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [verified, setVerified] = useState(false);

  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return undefined;

    const timer = setTimeout(() => setCountdown((value) => value - 1), 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async (event) => {
    event.preventDefault();

    setError("");

    setSuccess("");

    if (!email) {
      setError("Email address is missing. Please return to registration and try again.");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the complete 6-digit verification code.");

      return;
    }

    setLoading(true);

    try {
      const response = await verifyEmailApi({
        email,

        otp,
      });

      const result = response?.data ?? response;

      if (result?.success === false || result?.status === "error" || result?.error) {
        throw new Error(result?.message || result?.error?.message || "Email verification failed.");
      }

      setVerified(true);

      setSuccess(result?.message || "Your email has been verified successfully.");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Unable to verify your email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");

    setSuccess("");

    if (!email) {
      setError("Email address is missing. Please return to registration and try again.");
      return;
    }

    setResending(true);

    try {
      const response = await resendVerificationApi({
        email,
      });

      const result = response?.data ?? response;

      if (result?.success === false || result?.status === "error" || result?.error) {
        throw new Error(result?.message || result?.error?.message || "Unable to resend the verification code.");
      }

      setOtp("");

      setCountdown(60);

      setSuccess(result?.message || "If verification is pending for this email, a new code will be sent.");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Unable to resend the verification code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="br30-verify">
      <style>{`


        .br30-verify { width:100%; max-width:410px; margin:0 auto; color:var(--crm-text,var(--text,#202636)); font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; font-size:14px; font-weight:400; }


        .br30-verify \\\*,.br30-verify \\\*::before,.br30-verify \\\*::after { box-sizing:border-box; }


        .br30-verify-icon { display:flex; width:42px; height:42px; align-items:center; justify-content:center; margin-bottom:15px; border:1px solid var(--crm-border,var(--border,#e1e5ec)); border-radius:11px; background:var(--crm-surface,var(--surface,#fff)); color:var(--crm-primary,var(--primary,#4f46e5)); }


        .br30-verify-icon svg { width:21px; height:21px; }


        .br30-verify-heading { margin:0 0 7px; font-size:25px; line-height:1.3; letter-spacing:-.4px; font-weight:400; }


        .br30-verify-description { margin:0 0 18px; color:var(--crm-muted,var(--muted,#697386)); font-size:13px; line-height:1.6; font-weight:400; }


        .br30-verify-form { display:flex; flex-direction:column; gap:7px; }


        .br30-verify-label { color:var(--crm-text,var(--text,#202636)); font-size:12px; line-height:1.5; font-weight:400; }


        .br30-verify-input { display:block; width:100%; height:42px; padding:0 11px; border:1px solid var(--crm-border,var(--border,#e1e5ec)); border-radius:8px; outline:none; background:var(--crm-surface,var(--surface,#fff)); color:var(--crm-text,var(--text,#202636)); font-family:inherit; font-size:13px; font-weight:400; transition:border-color .18s ease,box-shadow .18s ease; }


        .br30-verify-input::placeholder { color:var(--crm-muted,var(--muted,#8a93a3)); opacity:.85; }


        .br30-verify-input:focus { border-color:var(--crm-primary,var(--primary,#4f46e5)); box-shadow:0 0 0 3px color-mix(in srgb,var(--crm-primary,var(--primary,#4f46e5)) 12%,transparent); }


        .br30-verify-input[aria-invalid="true"] { border-color:#dc2626; }


        .br30-verify-code { letter-spacing:8px; font-size:20px; text-align:center; font-variant-numeric:tabular-nums; }


        .br30-verify-error { margin:0 0 12px; padding:9px 11px; border:1px solid #fecaca; border-radius:8px; background:#fef2f2; color:#b91c1c; font-size:12px; line-height:1.55; overflow-wrap:anywhere; }


        .br30-verify-success { margin:0 0 12px; padding:10px 11px; border:1px solid #a7f3d0; border-radius:8px; background:#ecfdf5; color:#065f46; font-size:12px; line-height:1.6; overflow-wrap:anywhere; }


        .br30-verify-submit { display:flex; width:100%; min-height:43px; align-items:center; justify-content:center; margin-top:8px; padding:10px 14px; border:1px solid var(--crm-primary,var(--primary,#4f46e5)); border-radius:8px; background:var(--crm-primary,var(--primary,#4f46e5)); color:#fff; font-family:inherit; font-size:13px; font-weight:400; cursor:pointer; transition:opacity .18s ease; }


        .br30-verify-submit:hover:not(:disabled) { opacity:.91; }


        .br30-verify-submit:disabled { cursor:not-allowed; opacity:.65; }


        .br30-verify-actions { display:flex; align-items:center; justify-content:center; gap:5px; flex-wrap:wrap; margin-top:16px; color:var(--crm-muted,var(--muted,#697386)); font-size:12px; line-height:1.6; }


        .br30-verify-link { padding:0; border:0; background:transparent; color:var(--crm-primary,var(--primary,#4f46e5)); font-family:inherit; font-size:12px; font-weight:400; text-decoration:none; cursor:pointer; }


        .br30-verify-link:hover:not(:disabled) { text-decoration:underline; text-underline-offset:3px; }


        .br30-verify-link:disabled { opacity:.55; cursor:not-allowed; }


        .br30-verify-footer { margin:17px 0 0; text-align:center; font-size:12px; line-height:1.6; }


        @media (max-width:480px) { .br30-verify-heading { font-size:23px; } .br30-verify-description { margin-bottom:15px; } .br30-verify-icon { width:38px; height:38px; margin-bottom:12px; } }


        @media (prefers-reduced-motion:reduce) { .br30-verify \\\*,.br30-verify \\\*::before,.br30-verify \\\*::after { transition-duration:.01ms!important; } }


      `}</style>

      <div className="br30-verify-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2" />

          <path d="m4 7 8 6 8-6" />
        </svg>
      </div>

      <h1 className="br30-verify-heading">{verified ? "Email verified" : "Verify your email"}</h1>

      <p className="br30-verify-description">{verified ? "Your email verification step is complete. You can continue to sign in." : "Enter the 6-digit verification code sent to your registered email address."}</p>

      {error && (
        <div className="br30-verify-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="br30-verify-success" role="status">
          {success}
        </div>
      )}

      {!verified && (
        <form className="br30-verify-form" onSubmit={handleVerify} noValidate>
          <label className="br30-verify-label" htmlFor="verify-code">
            6-digit verification code
          </label>

          <input
            className="br30-verify-input br30-verify-code"
            id="verify-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            value={otp}
            onChange={(event) => {
              setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));

              setError("");

              setSuccess("");
            }}
            maxLength={6}
            aria-label="6-digit verification code"
            required
            disabled={loading || resending}
          />

          <button className="br30-verify-submit" type="submit" disabled={loading || resending}>
            {loading ? "Verifying..." : "Verify email"}
          </button>
        </form>
      )}

      {!verified && (
        <div className="br30-verify-actions">
          <span>Didn't receive a code?</span>

          <button className="br30-verify-link" type="button" onClick={handleResend} disabled={loading || resending || countdown > 0}>
            {resending ? "Sending..." : countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
          </button>
        </div>
      )}

      <p className="br30-verify-footer">
        <Link className="br30-verify-link" to="/">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
