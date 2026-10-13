const axios = require("axios");
const verificationOtpTemplate = require("./templates/registration-otp.template");
const passwordResetOtpTemplate = require("./templates/password-reset-otp.template");

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

const sendOtpEmail = async ({ to, otp, purpose, name = "there" }) => {
  const apiKey = process.env.BREVO_SMTP_KEY;
  const senderEmail = process.env.BREVO_EMAIL;
  const senderName = "BR30 Talent Pipeline";

  if (!apiKey || !senderEmail) {
    throw new Error("Brevo API configuration is incomplete. Check BREVO_EMAIL and BREVO_SMTP_KEY.");
  }

  if (typeof to !== "string" || !to.trim()) {
    throw new Error("A recipient email is required.");
  }

  const recipientEmail = to.trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
    throw new Error("A valid recipient email is required.");
  }

  if (typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
    throw new Error("A valid six-digit OTP is required.");
  }

  let template;

  if (purpose === "verification") {
    template = verificationOtpTemplate({
      name,
      otp,
      expiresInMinutes: 10,
    });
  } else if (purpose === "password_reset") {
    template = passwordResetOtpTemplate({
      name,
      otp,
      expiresInMinutes: 10,
    });
  } else {
    throw new Error("Unsupported OTP email purpose.");
  }

  const payload = {
    sender: {
      name: senderName,
      email: senderEmail.trim(),
    },
    to: [{ email: recipientEmail }],
    subject: template.subject,
    htmlContent: template.html,
    textContent: template.text,
  };

  try {
    const response = await axios.post(BREVO_API_URL, payload, {
      headers: {
        accept: "application/json",
        "api-key": apiKey.trim(),
        "content-type": "application/json",
      },
      timeout: 15000,
    });

    return response.data;
  } catch (error) {
    const status = error.response?.status;
    const brevoMessage = error.response?.data?.message;

    console.error("Brevo OTP email delivery failed:", {
      status,
      message: brevoMessage || error.message,
    });

    const emailError = new Error(brevoMessage || "Unable to send OTP email. Please try again later.");

    emailError.statusCode = status === 429 ? 429 : 502;
    throw emailError;
  }
};

module.exports = { sendOtpEmail };
