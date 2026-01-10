import { emailWorker } from "./email";
import { alertsWorker } from "./alerts";
import { monitoringWorker, initializeMonitoringSchedules } from "./monitoring";

export async function initializeWorkers(): Promise<void> {
  console.log("Queue workers initialized");
  console.log(`Email worker: ${emailWorker.name}`);
  console.log(`Alerts worker: ${alertsWorker.name}`);
  console.log(`Monitoring worker: ${monitoringWorker.name}`);

  // Initialize monitoring schedules for all enabled endpoints/databases
  await initializeMonitoringSchedules();
}

export { addEmailJob, emailQueue } from "./email";
export { addAlertNotification, alertsQueue } from "./alerts";
export {
  scheduleEndpointMonitoring,
  removeEndpointMonitoring,
  updateEndpointMonitoring,
  scheduleDatabaseMonitoring,
  removeDatabaseMonitoring,
  updateDatabaseMonitoring,
  monitoringQueue,
} from "./monitoring";
