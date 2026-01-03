import { emailWorker } from "./email";
import { alertsWorker } from "./alerts";

export function initializeWorkers(): void {
  console.log("Queue workers initialized");
  console.log(`Email worker: ${emailWorker.name}`);
  console.log(`Alerts worker: ${alertsWorker.name}`);
}

export { addEmailJob, emailQueue } from "./email";
export { addAlertNotification, alertsQueue } from "./alerts";
