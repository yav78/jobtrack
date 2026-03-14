import nodemailer from "nodemailer";
import { env } from "@/lib/env";

export function isEmailConfigured() {
  return !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_FROM);
}

export function createTransport() {
  if (!isEmailConfigured()) {
    throw new Error("SMTP non configuré. Définissez SMTP_HOST, SMTP_USER, SMTP_PASS et SMTP_FROM.");
  }
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

export type SendMailOptions = {
  to: string;
  subject: string;
  text: string;
};

export async function sendMail({ to, subject, text }: SendMailOptions) {
  const transport = createTransport();
  await transport.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    text,
  });
}
