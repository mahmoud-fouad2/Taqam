import { logger } from "@/lib/logger";
import { getEmailRuntimeStatus } from "@/lib/runtime-integrations";

type SendEmailInput = {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer | Uint8Array;
    contentType?: string;
  }>;
};

let transporterPromise: Promise<any> | null = null;

export function isEmailConfigured() {
  return getEmailRuntimeStatus().configured;
}

export function getAppBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

function resolveEmailFromAddress() {
  const candidates = [process.env.SMTP_FROM, process.env.MAIL_FROM_FALLBACK, process.env.SMTP_USER]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  const from = candidates.find((value) => value.includes("@"));

  if (from) {
    return from;
  }

  logger.warn("SMTP sender address is not configured", {
    hasSmtpFrom: Boolean(process.env.SMTP_FROM),
    hasMailFromFallback: Boolean(process.env.MAIL_FROM_FALLBACK),
    hasSmtpUser: Boolean(process.env.SMTP_USER)
  });

  return null;
}

async function getTransporter() {
  if (!transporterPromise) {
    transporterPromise = (async () => {
      const { default: nodemailer } = await import("nodemailer");

      if (process.env.SMTP_URL) {
        return nodemailer.createTransport(process.env.SMTP_URL);
      }

      const port = Number.parseInt(process.env.SMTP_PORT ?? "587", 10);
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: process.env.SMTP_SECURE === "true" || port === 465,
        auth: process.env.SMTP_USER
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASSWORD
            }
          : undefined
      });
    })();
  }

  return await transporterPromise;
}

export async function sendEmail(input: SendEmailInput) {
  if (!isEmailConfigured()) {
    logger.warn("SMTP is not configured; email was skipped", {
      to: input.to,
      subject: input.subject
    });
    return { sent: false as const, skipped: true as const };
  }

  const transporter = await getTransporter();
  const from = resolveEmailFromAddress();

  if (!from) {
    return { sent: false as const, skipped: true as const };
  }

  const attachments = input.attachments?.map((attachment) => ({
    filename: attachment.filename,
    content:
      typeof attachment.content === "string"
        ? attachment.content
        : Buffer.isBuffer(attachment.content)
          ? attachment.content
          : Buffer.from(attachment.content),
    contentType: attachment.contentType
  }));

  await transporter.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
    replyTo: input.replyTo,
    attachments
  });

  return { sent: true as const, skipped: false as const };
}
