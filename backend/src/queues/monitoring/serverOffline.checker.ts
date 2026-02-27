import { getNewlyOfflineServers, markServerOffline } from "../../db/queries/servers";
import { addAlertNotification } from "../alerts/alerts.queue";

const CHECK_INTERVAL_MS = 60_000; // Check every 60 seconds

let intervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Periodically checks for servers that have exceeded their org's
 * offline threshold and sends a "server_offline" alert notification.
 */
async function checkForOfflineServers(): Promise<void> {
  try {
    const offlineServers = await getNewlyOfflineServers();

    for (const server of offlineServers) {
      console.log(
        `[ServerOfflineChecker] Server "${server.name}" (${server.id}) is offline — last seen: ${server.last_seen_at}`
      );

      // Mark as offline so we don't alert again next tick
      await markServerOffline(server.id);

      // Queue the alert notification (goes through the alerts worker → email worker)
      await addAlertNotification({
        orgId: server.org_id,
        serverId: server.id,
        type: "server_offline",
        title: "Server Offline",
        message: `Server "${server.name}" has stopped sending heartbeats and is now considered offline. Last seen: ${new Date(server.last_seen_at).toUTCString()}`,
      });
    }

    if (offlineServers.length > 0) {
      console.log(
        `[ServerOfflineChecker] Detected ${offlineServers.length} newly offline server(s)`
      );
    }
  } catch (error) {
    console.error("[ServerOfflineChecker] Error checking for offline servers:", error);
  }
}

/**
 * Start the periodic offline server checker. Called once at startup.
 */
export function startServerOfflineChecker(): void {
  if (intervalId) {
    console.warn("[ServerOfflineChecker] Already running, skipping start");
    return;
  }

  // Run once immediately on startup, then repeat every interval
  checkForOfflineServers();

  intervalId = setInterval(checkForOfflineServers, CHECK_INTERVAL_MS);
  console.log(`[ServerOfflineChecker] Started — checking every ${CHECK_INTERVAL_MS / 1000}s`);
}

/**
 * Stop the periodic offline server checker (e.g. for graceful shutdown).
 */
export function stopServerOfflineChecker(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[ServerOfflineChecker] Stopped");
  }
}
