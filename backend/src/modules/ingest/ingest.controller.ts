import { Request, Response } from "express";
import { AppError, sendResponse } from "../../utils/handler";
import {
  createServer,
  getServerByApiKeyId,
  updateServerLastSeen,
  updateServerOnReconnect,
} from "../../db/queries/servers";
import { insertServerMetrics } from "../../db/queries/ingest";
import { insertHealthCheck } from "../../db/queries/endpoints";
import { RegisterServerInput, SubmitHealthCheckInput, SubmitMetricsInput } from "./ingest.types";

export async function registerServer(req: Request, res: Response) {
  const apiKey = req.apiKey;
  if (!apiKey) throw new AppError("API key required", 401);

  const existing = await getServerByApiKeyId(apiKey.id);
  if (existing) {
    // Update server info (agent_version, os_type, etc.) on reconnect
    const data = req.body as RegisterServerInput;
    await updateServerOnReconnect(existing.id, {
      agent_version: data.agent_version,
      os_type: data.os_type,
      os_version: data.os_version,
      hostname: data.hostname,
      ip_address: data.ip_address,
    });
    sendResponse(res, 200, "Server already registered", { server_id: existing.id });
    return;
  }

  const data = req.body as RegisterServerInput;
  if (!data.name?.trim()) throw new AppError("Server name required", 400);

  const server = await createServer(apiKey.orgId, apiKey.id, data);
  sendResponse(res, 201, "Server registered", { server_id: server.id });
}

export async function submitMetrics(req: Request, res: Response) {
  const apiKey = req.apiKey;
  if (!apiKey) throw new AppError("API key required", 401);

  const server = await getServerByApiKeyId(apiKey.id);
  if (!server) throw new AppError("Server not registered. Call /ingest/register first", 404);

  const data = req.body as SubmitMetricsInput;
  await insertServerMetrics(server.id, data);
  await updateServerLastSeen(server.id);

  sendResponse(res, 200, "Metrics recorded");
}

export async function heartbeat(req: Request, res: Response) {
  const apiKey = req.apiKey;
  if (!apiKey) throw new AppError("API key required", 401);

  const server = await getServerByApiKeyId(apiKey.id);
  if (!server) throw new AppError("Server not registered", 404);

  await updateServerLastSeen(server.id);
  sendResponse(res, 200, "Heartbeat received", { server_id: server.id });
}

export async function submitHealthCheck(req: Request, res: Response) {
  const apiKey = req.apiKey;
  if (!apiKey) throw new AppError("API key required", 401);

  const data = req.body as SubmitHealthCheckInput;
  if (!data.endpoint_id) throw new AppError("endpoint_id required", 400);

  await insertHealthCheck({
    endpoint_id: data.endpoint_id,
    status_code: data.status_code,
    response_time: data.response_time,
    is_up: data.is_up,
    error_message: data.error_message,
    checked_from: data.checked_from,
  });

  sendResponse(res, 200, "Health check recorded");
}
