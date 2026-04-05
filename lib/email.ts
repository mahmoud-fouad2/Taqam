import { logger } from "@/lib/logger";

type SendEmailInput = {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
};

let transporterPromise: Promise<any> | null = null;

export function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_URL ||
      (process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_FROM)
  );
}

export function getAppBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
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
              pass: process.env.SMTP_PASSWORD,
            }
          : undefined,
      });
    })();
  }

  return await transporterPromise;
}

export async function sendEmail(input: SendEmailInput) {
  if (!isEmailConfigured()) {
    logger.warn("SMTP is not configured; email was skipped", {
      to: input.to,
      subject: input.subject,
    });
    return { sent: false as const, skipped: true as const };
  }

  const transporter = await getTransporter();
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@taqam.local";

  await transporter.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
    replyTo: input.replyTo,
  });

  return { sent: true as const, skipped: false as const };
}