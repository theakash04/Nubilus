import { Worker, Job } from "bullmq";
import { redisConnection } from "../connection";
import { AlertNotificationJobData, ALERTS_QUEUE_NAME } from "./alerts.queue";
import { addEmailJob } from "../email";
import { getOrgSettings } from "../../db/queries/org";
import { getOrgAdminEmails } from "../../db/queries/org";
import IORedis from "ioredis";

const ALERT_COOLDOWN_SECONDS = 4000;

const redis = new IORedis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
});

async function isInCooldown(orgId: string, title: string): Promise<boolean> {
  const cooldownKey = `alert_cooldown:${orgId}:${title.replace(/\s+/g, "_")}`;
  const exists = await redis.get(cooldownKey);
  return exists !== null;
}

async function setCooldown(orgId: string, title: string): Promise<void> {
  const cooldownKey = `alert_cooldown:${orgId}:${title.replace(/\s+/g, "_")}`;
  await redis.set(cooldownKey, "1", "EX", ALERT_COOLDOWN_SECONDS);
}

export const alertsWorker = new Worker<AlertNotificationJobData>(
  ALERTS_QUEUE_NAME,
  async (job: Job<AlertNotificationJobData>) => {
    const { orgId, type, title, message } = job.data;

    console.log(`Processing ${type} notification for org ${orgId}`);

    // Check cooldown to prevent email spam
    const inCooldown = await isInCooldown(orgId, title);
    if (inCooldown) {
      console.log(`[Cooldown] Skipping alert "${title}" for org ${orgId} - still in cooldown`);
      return { skipped: true, reason: "cooldown" };
    }

    // Check org settings before sending
    const settings = await getOrgSettings(orgId);
    if (!settings) {
      console.log(`No settings found for org ${orgId}, skipping notification`);
      return;
    }

    if (type === "alert_triggered" && !settings.notify_on_alert_triggered) {
      console.log(`Alert notifications disabled for org ${orgId}`);
      return;
    }

    if (type === "server_offline" && !settings.notify_on_server_offline) {
      console.log(`Server offline notifications disabled for org ${orgId}`);
      return;
    }

    // Get emails to notify - use custom emails if set, fallback to admin emails
    let emailsToNotify: string[] = [];

    if (settings.notification_emails && settings.notification_emails.length > 0) {
      emailsToNotify = settings.notification_emails;
    } else {
      emailsToNotify = await getOrgAdminEmails(orgId);
    }

    if (emailsToNotify.length === 0) {
      console.log(`No notification recipients for org ${orgId}`);
      return;
    }

    // Set cooldown BEFORE sending to prevent concurrent spam
    await setCooldown(orgId, title);

    // Queue email notifications
    for (const email of emailsToNotify) {
      await addEmailJob({
        to: email,
        subject: `[Nubilus Alert] ${title}`,
        html: `
          <h2>${title}</h2>
          <p>${message}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            You received this because you're subscribed to alert notifications for this organization.
            <br>
            <em>Next alert for this target will be sent after ${
              ALERT_COOLDOWN_SECONDS / 60
            } minutes cooldown.</em>
          </p>
        `,
      });
    }

    console.log(`Queued ${emailsToNotify.length} email notifications for ${type}`);
    return { notified: emailsToNotify.length };
  },
  {
    connection: redisConnection,
    concurrency: 3,
  }
);

alertsWorker.on("completed", job => {
  console.log(`Alert notification job ${job.id} completed`);
});

alertsWorker.on("failed", (job, err) => {
  console.error(`Alert notification job ${job?.id} failed:`, err.message);
});
