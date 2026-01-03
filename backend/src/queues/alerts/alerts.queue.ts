import { Queue } from "bullmq";
import { redisConnection } from "../connection";

export type AlertNotificationType = "alert_triggered" | "server_offline";

export interface AlertNotificationJobData {
  orgId: string;
  alertId?: string;
  serverId?: string;
  type: AlertNotificationType;
  title: string;
  message: string;
}

export const ALERTS_QUEUE_NAME = "alerts_notification";

export const alertsQueue = new Queue<AlertNotificationJobData>(ALERTS_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: 10,
    removeOnFail: 50,
  },
});

export async function addAlertNotification(data: AlertNotificationJobData): Promise<void> {
  await alertsQueue.add(`notify-${data.type}`, data);
}
