const escapeHtml = (value = "") =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char]
  );

const verificationOtpTemplate = ({ name = "there", otp, expiresInMinutes = 10 }) => {
  const safeName = escapeHtml(name || "there");
  const safeOtp = escapeHtml(otp);
  const safeExpiry = escapeHtml(expiresInMinutes);
  const year = new Date().getFullYear();

  const subject = "Email Verification Code | BR30 Talent Pipeline";

  const text = `Hi ${name || "there"},

Welcome to BR30 Talent Pipeline. Use the code below to verify your email address.

Verification code: ${otp}

This code expires in ${expiresInMinutes} minutes. Never share it with anyone.

If you didn't request this account, please ignore this email.

Regards,
BR30 Talent Pipeline Team

© ${year} BR30 Talent Pipeline
Automated email — please do not reply.`;

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification Code</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fa;font-family:Arial,Helvetica,sans-serif;color:#172033;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your BR30 Talent Pipeline email verification code.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6fa;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="width:100%;max-width:560px;background:#ffffff;border:1px solid #e5e9f0;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:24px 28px;background:#172b4d;color:#ffffff;">
              <div style="font-size:12px;font-weight:700;letter-spacing:2px;color:#b9c9e2;">BR30</div>
              <div style="font-size:21px;font-weight:700;margin-top:5px;">Talent Pipeline</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1 style="font-size:21px;line-height:1.4;margin:0 0 14px;color:#172033;">Verify your email</h1>
              <p style="font-size:14px;line-height:1.7;margin:0 0 10px;">Hi ${safeName},</p>
              <p style="font-size:14px;line-height:1.7;color:#526075;margin:0 0 22px;">Welcome to BR30 Talent Pipeline. Use this one-time code to verify your email address.</p>
              <div style="padding:20px 12px;text-align:center;background:#f5f8ff;border:1px solid #dce6fa;border-radius:10px;">
                <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#64748b;margin-bottom:10px;">Verification code</div>
                <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#244b91;">${safeOtp}</div>
              </div>
              <p style="font-size:13px;line-height:1.7;color:#64748b;margin:16px 0 0;">Expires in <strong>${safeExpiry} minutes</strong>. Never share this code with anyone.</p>
              <p style="font-size:13px;line-height:1.7;color:#64748b;margin:12px 0 0;">Didn't request an account? You can safely ignore this email.</p>
              <p style="font-size:14px;line-height:1.7;color:#344054;margin:24px 0 0;">Regards,<br><strong>BR30 Talent Pipeline Team</strong></p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e8edf4;">
              <p style="font-size:11px;line-height:1.7;color:#8490a2;margin:0;">This is an automated email. Please do not reply.</p>
              <p style="font-size:11px;line-height:1.7;color:#8490a2;margin:4px 0 0;">© ${year} BR30 Talent Pipeline. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
};

module.exports = verificationOtpTemplate;
