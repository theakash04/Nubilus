import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Reuse a single pooled transporter instead of creating one per email.

// This keeps a pool of persistent SMTP connections open and reuses them,
// avoiding port exhaustion on the VPS.
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    const port = parseInt(process.env.SMTP_PORT || "465");
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port,
      secure: process.env.SMTP_SECURE === "true" || port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Enable connection pooling — keeps connections alive and reuses them
      pool: true,
      maxConnections: 3,
      maxMessages: 50,
      // Timeouts to prevent connections from hanging forever
      connectionTimeout: 10_000, // 10s to establish connection
      greetingTimeout: 10_000, // 10s for SMTP greeting
      socketTimeout: 30_000, // 30s for socket inactivity
    });

    // Log transport readiness on first creation
    transporter
      .verify()
      .then(() => {
        console.log("SMTP transporter verified and ready");
      })
      .catch(err => {
        console.error("SMTP transporter verification failed:", err.message);
        // Reset so next call will try to create a fresh transport
        transporter = null;
      });
  }

  return transporter;
}

const from = process.env.SMTP_FROM || `"Nubilus" <${process.env.SMTP_USER}>`;

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const info = await getTransporter().sendMail({
      from,
      to,
      subject,
      html,
    });
    return info;
  } catch (error: any) {
    // Log the real SMTP error so we can actually debug failures
    console.error(`SMTP error sending to ${to}:`, error.message || error);

    // If the connection is broken, reset the transporter so the next
    // attempt creates a fresh pool instead of reusing a dead connection
    if (
      error.code === "ECONNECTION" ||
      error.code === "ECONNREFUSED" ||
      error.code === "ETIMEDOUT" ||
      error.code === "ESOCKET"
    ) {
      console.warn("SMTP connection error detected, resetting transporter pool");
      transporter?.close();
      transporter = null;
    }

    throw error; // Let BullMQ handle the retry
  }
}
