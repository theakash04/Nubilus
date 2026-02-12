import { Worker, Job } from "bullmq";
import { redisConnection } from "../connection";
import { EmailJobData, EMAIL_QUEUE_NAME } from "./email.queue";
import { sendEmail } from "../../utils/email";

export const emailWorker = new Worker<EmailJobData>(
  EMAIL_QUEUE_NAME,
  async (job: Job<EmailJobData>) => {
    const { to, subject, html } = job.data;

    console.log(`Processing email job ${job.id} to: ${to} (attempt ${job.attemptsMade + 1})`);

    // sendEmail now throws on failure, letting BullMQ handle retries
    const result = await sendEmail({ to, subject, html });

    console.log(`Email sent successfully to: ${to}`);
    return result;
  },
  {
    connection: redisConnection,
    // Keep concurrency low to avoid opening too many SMTP connections at once
    concurrency: 2,
  }
);

emailWorker.on("completed", job => {
  console.log(`Email job ${job.id} completed`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`Email job ${job?.id} failed:`, err.message);
});
