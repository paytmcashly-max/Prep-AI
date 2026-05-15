import { config } from "../config.js";
import { getFirebaseAdmin } from "../firebaseAdmin.js";
import { logger } from "../logger.js";

export class VerificationEmailUnavailableError extends Error {
  constructor(message = "Verification email is not available right now.") {
    super(message);
    this.name = "VerificationEmailUnavailableError";
  }
}

const getVerificationEmailConfig = () => {
  if (!config.RESEND_API_KEY || !config.EMAIL_FROM) {
    throw new VerificationEmailUnavailableError();
  }

  return {
    apiKey: config.RESEND_API_KEY,
    from: config.EMAIL_FROM,
    replyTo: config.EMAIL_REPLY_TO
  };
};

export const createCustomVerificationUrl = (
  firebaseVerificationLink: string,
  appPublicUrl?: string
) => {
  if (!appPublicUrl) {
    return firebaseVerificationLink;
  }

  try {
    const sourceUrl = new URL(firebaseVerificationLink);
    const oobCode = sourceUrl.searchParams.get("oobCode");

    if (!oobCode) {
      return firebaseVerificationLink;
    }

    const customUrl = new URL("/verify-email", appPublicUrl);
    customUrl.searchParams.set("mode", "verifyEmail");
    customUrl.searchParams.set("oobCode", oobCode);

    const lang = sourceUrl.searchParams.get("lang");

    if (lang) {
      customUrl.searchParams.set("lang", lang);
    }

    return customUrl.toString();
  } catch {
    return firebaseVerificationLink;
  }
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildVerificationEmail = ({
  displayName,
  verificationLink
}: {
  displayName?: string;
  verificationLink: string;
}) => {
  const safeDisplayName = displayName ? escapeHtml(displayName) : "";
  const safeLink = escapeHtml(verificationLink);
  const greeting = safeDisplayName ? `Hi ${safeDisplayName},` : "Welcome to IntervueAI,";

  return {
    html: `
      <div style="background:#f6f8fc;padding:32px 16px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#14213d;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e3e8f2;border-radius:20px;padding:32px;">
          <div style="font-size:28px;font-weight:800;letter-spacing:0;color:#14213d;margin-bottom:8px;">IntervueAI</div>
          <div style="font-size:14px;line-height:22px;color:#60708f;margin-bottom:24px;">Practice smarter. Interview better.</div>
          <p style="font-size:16px;line-height:26px;color:#14213d;margin:0 0 16px;">${greeting}</p>
          <p style="font-size:16px;line-height:26px;color:#14213d;margin:0 0 16px;">
            Please verify your email address to continue with profile setup, interview practice,
            resume analysis, and saved progress.
          </p>
          <div style="margin:28px 0;">
            <a href="${safeLink}" style="display:inline-block;background:linear-gradient(135deg,#5f67ff 0%,#27b3f7 100%);color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 24px;border-radius:14px;">
              Verify email
            </a>
          </div>
          <p style="font-size:14px;line-height:22px;color:#60708f;margin:0 0 12px;">
            If the button does not open, copy and paste this link into your browser:
          </p>
          <p style="font-size:14px;line-height:22px;word-break:break-word;margin:0 0 20px;">
            <a href="${safeLink}" style="color:#5f67ff;text-decoration:underline;">${safeLink}</a>
          </p>
          <p style="font-size:14px;line-height:22px;color:#60708f;margin:0;">
            If you did not create this account, you can safely ignore this email.
          </p>
        </div>
      </div>
    `.trim(),
    subject: "Verify your email to continue with IntervueAI",
    text: `${safeDisplayName ? `Hi ${displayName},\n\n` : ""}Welcome to IntervueAI.\n\nPlease verify your email address to continue with profile setup, interview practice, resume analysis, and saved progress.\n\nVerify email: ${verificationLink}\n\nIf you did not create this account, you can safely ignore this email.\n\nThe IntervueAI team`
  };
};

export const sendVerificationEmail = async ({
  displayName,
  email,
  uid
}: {
  displayName?: string;
  email: string;
  uid: string;
}) => {
  const { apiKey, from, replyTo } = getVerificationEmailConfig();
  const firebaseVerificationLink = await getFirebaseAdmin()
    .auth()
    .generateEmailVerificationLink(email);
  const verificationLink = createCustomVerificationUrl(
    firebaseVerificationLink,
    config.APP_PUBLIC_URL
  );
  const message = buildVerificationEmail({ displayName, verificationLink });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [email],
      reply_to: replyTo || undefined,
      subject: message.subject,
      html: message.html,
      text: message.text
    })
  });

  if (!response.ok) {
    const payload = await response.text().catch(() => "");

    logger.warn("Verification email send failed", {
      provider: "resend",
      responseStatus: response.status,
      uid
    });

    throw new VerificationEmailUnavailableError(
      payload ? "Verification email could not be sent right now." : undefined
    );
  }

  logger.info("Verification email sent", {
    provider: "resend",
    uid
  });
};
