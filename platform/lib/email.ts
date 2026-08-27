import nodemailer, { type Transporter } from "nodemailer";

export function smtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.EMAIL_FROM
  );
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
}): Promise<{ messageId: string }> {
  const from = process.env.EMAIL_FROM!;
  const info = await getTransporter().sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
  });
  return { messageId: info.messageId };
}
