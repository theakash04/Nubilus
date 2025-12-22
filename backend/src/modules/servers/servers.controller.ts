import { Request, Response } from "express";
import { AppError, sendResponse } from "../../utils/handler";
import { userHasOrgPermission } from "../../db/queries/org";
import {
  deleteServer,
  getServerById,
  getServerMetrics,
  getServersByOrgId,
  updateServer,
} from "../../db/queries/servers";
import { ServerMetricsQuery, UpdateServerInput } from "./servers.types";

export async function listServers(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId } = req.params;

  if (!userId) throw new AppError("Unauthorized", 401);
  if (!orgId) throw new AppError("Organization ID required", 400);

  const hasAccess = await userHasOrgPermission(userId, orgId, "read");
  if (!hasAccess) throw new AppError("Access denied", 403);

  const servers = await getServersByOrgId(orgId);
  sendResponse(res, 200, "Servers retrieved", { servers });
}

export async function getServer(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId, serverId } = req.params;

  if (!userId) throw new AppError("Unauthorized", 401);

  const hasAccess = await userHasOrgPermission(userId, orgId, "read");
  if (!hasAccess) throw new AppError("Access denied", 403);

  const server = await getServerById(serverId, orgId);
  if (!server) throw new AppError("Server not found", 404);

  sendResponse(res, 200, "Server retrieved", server);
}

export async function updateServerHandler(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId, serverId } = req.params;

  if (!userId) throw new AppError("Unauthorized", 401);

  const hasAccess = await userHasOrgPermission(userId, orgId, "write");
  if (!hasAccess) throw new AppError("Access denied", 403);

  const updates = req.body as UpdateServerInput;
  const server = await updateServer(serverId, orgId, updates);

  if (!server) throw new AppError("Server not found", 404);
  sendResponse(res, 200, "Server updated", server);
}

export async function deleteServerHandler(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId, serverId } = req.params;

  if (!userId) throw new AppError("Unauthorized", 401);

  const hasAccess = await userHasOrgPermission(userId, orgId, "manage");
  if (!hasAccess) throw new AppError("Access denied", 403);

  const deleted = await deleteServer(serverId, orgId);
  if (!deleted) throw new AppError("Server not found", 404);

  sendResponse(res, 200, "Server deleted");
}

export async function getServerMetricsHandler(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId, serverId } = req.params;
  const { from, to, limit } = req.query as unknown as ServerMetricsQuery;

  if (!userId) throw new AppError("Unauthorized", 401);

  const hasAccess = await userHasOrgPermission(userId, orgId, "read");
  if (!hasAccess) throw new AppError("Access denied", 403);

  const server = await getServerById(serverId, orgId);
  if (!server) throw new AppError("Server not found", 404);

  const fromDate = from ? new Date(from) : undefined;
  const toDate = to ? new Date(to) : undefined;
  const limitNum = limit ? Number(limit) : 100;

  const metrics = await getServerMetrics(serverId, fromDate, toDate, limitNum);
  sendResponse(res, 200, "Metrics retrieved", { metrics });
}
