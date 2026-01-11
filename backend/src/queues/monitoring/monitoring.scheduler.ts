import { Endpoint, DatabaseTarget } from "../../types/database";
import { getAllEnabledEndpoints } from "../../db/queries/endpoints";
import { getAllEnabledDatabaseTargets } from "../../db/queries/databases";
import {
  monitoringQueue,
  getMonitoringJobId,
  EndpointJobData,
  DatabaseJobData,
} from "./monitoring.queue";

/**
 * Schedule monitoring for an endpoint using repeatable jobs
 */
export async function scheduleEndpointMonitoring(endpoint: Endpoint): Promise<void> {
  if (!endpoint.enabled) {
    console.log(`[Monitoring] Endpoint ${endpoint.id} is disabled, skipping schedule`);
    return;
  }

  const jobId = getMonitoringJobId("endpoint", endpoint.id);
  const intervalMs = endpoint.check_interval * 1000;

  const jobData: EndpointJobData = {
    type: "endpoint",
    targetId: endpoint.id,
    orgId: endpoint.org_id,
    url: endpoint.url,
    method: endpoint.method,
    expectedStatusCode: endpoint.expected_status_code,
    timeout: endpoint.timeout,
  };

  await monitoringQueue.add("check-endpoint", jobData, {
    jobId: `${jobId}-initial`,
  });

  await monitoringQueue.add(`check-endpoint`, jobData, {
    repeat: {
      every: intervalMs,
    },
    jobId,
  });

  console.log(`[Monitoring] Scheduled endpoint ${endpoint.id} every ${endpoint.check_interval}s`);
}

/**
 * Remove endpoint from monitoring
 */
export async function removeEndpointMonitoring(endpointId: string): Promise<void> {
  const jobId = getMonitoringJobId("endpoint", endpointId);

  // Remove the repeatable job definition
  const repeatableJobs = await monitoringQueue.getRepeatableJobs();
  const job = repeatableJobs.find(j => j.id === jobId);

  if (job) {
    await monitoringQueue.removeRepeatableByKey(job.key);
  }

  // Also remove any pending jobs (initial check or delayed jobs) from the queue
  const initialJob = await monitoringQueue.getJob(`${jobId}-initial`);
  if (initialJob) {
    await initialJob.remove();
  }

  // Remove any delayed/waiting jobs with this jobId
  const delayedJob = await monitoringQueue.getJob(jobId);
  if (delayedJob) {
    await delayedJob.remove();
  }

  console.log(`[Monitoring] Removed endpoint ${endpointId} from monitoring`);
}

/**
 * Update endpoint monitoring (remove old schedule and add new one)
 */
export async function updateEndpointMonitoring(endpoint: Endpoint): Promise<void> {
  console.log(`[Monitoring] Updating endpoint ${endpoint.id} monitoring`);
  await removeEndpointMonitoring(endpoint.id);

  if (endpoint.enabled) {
    console.log(`[Monitoring] Updating endpoint ${endpoint.id} monitoring`);
    await scheduleEndpointMonitoring(endpoint);
  }
}

/**
 * Schedule monitoring for a database target using repeatable jobs
 */
export async function scheduleDatabaseMonitoring(database: DatabaseTarget): Promise<void> {
  if (!database.enabled) {
    console.log(`[Monitoring] Database ${database.id} is disabled, skipping schedule`);
    return;
  }

  const jobId = getMonitoringJobId("database", database.id);
  const intervalMs = database.check_interval * 1000;

  const jobData: DatabaseJobData = {
    type: "database",
    targetId: database.id,
    orgId: database.org_id,
    dbType: database.db_type,
    connectionUrl: database.connection_url,
    timeout: database.timeout,
  };

  // immediate
  await monitoringQueue.add("check-database", jobData, {
    jobId: `${jobId}-initial`,
  });

  // scheduled
  await monitoringQueue.add(`check-database`, jobData, {
    repeat: {
      every: intervalMs,
    },
    jobId,
  });

  console.log(`[Monitoring] Scheduled database ${database.id} every ${database.check_interval}s`);
}

/**
 * Remove database from monitoring
 */
export async function removeDatabaseMonitoring(databaseId: string): Promise<void> {
  const jobId = getMonitoringJobId("database", databaseId);

  // Remove the repeatable job definition
  const repeatableJobs = await monitoringQueue.getRepeatableJobs();
  const job = repeatableJobs.find(j => j.id === jobId);

  if (job) {
    await monitoringQueue.removeRepeatableByKey(job.key);
  }

  // Also remove any pending jobs (initial check or delayed jobs) from the queue
  const initialJob = await monitoringQueue.getJob(`${jobId}-initial`);
  if (initialJob) {
    await initialJob.remove();
  }

  // Remove any delayed/waiting jobs with this jobId
  const delayedJob = await monitoringQueue.getJob(jobId);
  if (delayedJob) {
    await delayedJob.remove();
  }

  console.log(`[Monitoring] Removed database ${databaseId} from monitoring`);
}

/**
 * Update database monitoring (remove old schedule and add new one)
 */
export async function updateDatabaseMonitoring(database: DatabaseTarget): Promise<void> {
  await removeDatabaseMonitoring(database.id);

  if (database.enabled) {
    await scheduleDatabaseMonitoring(database);
  }
}

/**
 * Initialize monitoring for all enabled endpoints and databases
 * Called on server startup
 */
export async function initializeMonitoringSchedules(): Promise<void> {
  console.log("[Monitoring] Initializing monitoring schedules...");

  try {
    // Get all enabled endpoints and databases
    const [endpoints, databases] = await Promise.all([
      getAllEnabledEndpoints(),
      getAllEnabledDatabaseTargets(),
    ]);

    console.log(
      `[Monitoring] Found ${endpoints.length} endpoints and ${databases.length} databases to monitor`
    );

    // Schedule all endpoints
    for (const endpoint of endpoints) {
      try {
        await scheduleEndpointMonitoring(endpoint);
      } catch (error) {
        console.error(`[Monitoring] Failed to schedule endpoint ${endpoint.id}:`, error);
      }
    }

    // Schedule all databases
    for (const database of databases) {
      try {
        await scheduleDatabaseMonitoring(database);
      } catch (error) {
        console.error(`[Monitoring] Failed to schedule database ${database.id}:`, error);
      }
    }

    console.log("[Monitoring] All monitoring schedules initialized");
  } catch (error) {
    console.error("[Monitoring] Failed to initialize monitoring schedules:", error);
  }
}
