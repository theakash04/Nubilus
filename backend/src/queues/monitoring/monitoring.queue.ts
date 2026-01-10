import { Queue } from "bullmq";
import { redisConnection } from "../connection";
import { DatabaseType, HttpMethod } from "../../types/enums";

export type MonitoringJobType = "endpoint" | "database";

export interface EndpointJobData {
  type: "endpoint";
  targetId: string;
  orgId: string;
  url: string;
  method: HttpMethod;
  expectedStatusCode: number;
  timeout: number;
}

export interface DatabaseJobData {
  type: "database";
  targetId: string;
  orgId: string;
  dbType: DatabaseType;
  connectionUrl: string;
  timeout: number;
}

export type MonitoringJobData = EndpointJobData | DatabaseJobData;

export const MONITORING_QUEUE_NAME = "monitoring";

export const monitoringQueue = new Queue<MonitoringJobData>(MONITORING_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 1, // Don't retry monitoring checks - just record the failure
    removeOnComplete: 50,
    removeOnFail: 100,
  },
});

/**
 * Get the job ID for a monitoring target
 */
export function getMonitoringJobId(type: MonitoringJobType, targetId: string): string {
  return `${type}-${targetId}`;
}
