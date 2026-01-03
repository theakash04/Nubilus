import { Queue } from "bullmq";
import { redisConnection } from "../connection";

export interface EmailJobData {
  to: string;
  subject: string;
  html: string;
}

export const EMAIL_QUEUE_NAME = "email";

export const emailQueue = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: 10,
    removeOnFail: 50,
  },
});

/**
 * Helper function to add an email job to the queue
 * @example
 * await addEmailJob({
 *   to: "user@example.com",
 *   subject: "Welcome!",
 *   html: "<h1>Hello</h1>"
 * });
 */
export async function addEmailJob(data: EmailJobData): Promise<void> {
  await emailQueue.add("send-email", data);
}
