import { Worker, Job } from "bullmq";
import { redisConnection } from "../connection";
import { EmailJobData, EMAIL_QUEUE_NAME } from "./email.queue";
import { sendEmail } from "../../utils/email";

export const emailWorker = new Worker<EmailJobData>(
  EMAIL_QUEUE_NAME,
  async (job: Job<EmailJobData>) => {
    const { to, subject, html } = job.data;

    console.log(`Processing email job ${job.id} to: ${to}`);

    const result = await sendEmail({ to, subject, html });

    if (!result) {
      throw new Error(`Failed to send email to ${to}`);
    }

    console.log(`Email sent successfully to: ${to}`);
    return result;
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

emailWorker.on("completed", job => {
  console.log(`Email job ${job.id} completed`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`Email job ${job?.id} failed:`, err.message);
});
