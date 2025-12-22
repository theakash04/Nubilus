import { Request, Response } from "express";
import { AppError, sendResponse } from "../../utils/handler";
import { userHasOrgPermission } from "../../db/queries/org";
import {
  createEndpoint,
  deleteEndpoint,
  getEndpointById,
  getEndpointsByOrgId,
  getHealthChecks,
  updateEndpoint,
} from "../../db/queries/endpoints";
import { CreateEndpointInput, HealthCheckQuery, UpdateEndpointInput } from "./endpoints.types";

export async function listEndpoints(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId } = req.params;

  if (!userId) throw new AppError("Unauthorized", 401);

  const hasAccess = await userHasOrgPermission(userId, orgId, "read");
  if (!hasAccess) throw new AppError("Access denied", 403);

  const endpoints = await getEndpointsByOrgId(orgId);
  sendResponse(res, 200, "Endpoints retrieved", { endpoints });
}

export async function getEndpoint(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId, endpointId } = req.params;

  if (!userId) throw new AppError("Unauthorized", 401);

  const hasAccess = await userHasOrgPermission(userId, orgId, "read");
  if (!hasAccess) throw new AppError("Access denied", 403);

  const endpoint = await getEndpointById(endpointId, orgId);
  if (!endpoint) throw new AppError("Endpoint not found", 404);

  sendResponse(res, 200, "Endpoint retrieved", endpoint);
}

export async function createEndpointHandler(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId } = req.params;

  if (!userId) throw new AppError("Unauthorized", 401);

  const hasAccess = await userHasOrgPermission(userId, orgId, "write");
  if (!hasAccess) throw new AppError("Access denied", 403);

  const data = req.body as CreateEndpointInput;
  if (!data.name?.trim() || !data.url?.trim()) {
    throw new AppError("Name and URL are required", 400);
  }

  const endpoint = await createEndpoint(orgId, data);
  sendResponse(res, 201, "Endpoint created", endpoint);
}

export async function updateEndpointHandler(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId, endpointId } = req.params;

  if (!userId) throw new AppError("Unauthorized", 401);

  const hasAccess = await userHasOrgPermission(userId, orgId, "write");
  if (!hasAccess) throw new AppError("Access denied", 403);

  const updates = req.body as UpdateEndpointInput;
  const endpoint = await updateEndpoint(endpointId, orgId, updates);

  if (!endpoint) throw new AppError("Endpoint not found", 404);
  sendResponse(res, 200, "Endpoint updated", endpoint);
}

export async function deleteEndpointHandler(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId, endpointId } = req.params;

  if (!userId) throw new AppError("Unauthorized", 401);

  const hasAccess = await userHasOrgPermission(userId, orgId, "manage");
  if (!hasAccess) throw new AppError("Access denied", 403);

  const deleted = await deleteEndpoint(endpointId, orgId);
  if (!deleted) throw new AppError("Endpoint not found", 404);

  sendResponse(res, 200, "Endpoint deleted");
}

export async function getEndpointChecks(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId, endpointId } = req.params;
  const { from, to, limit } = req.query as unknown as HealthCheckQuery;

  if (!userId) throw new AppError("Unauthorized", 401);

  const hasAccess = await userHasOrgPermission(userId, orgId, "read");
  if (!hasAccess) throw new AppError("Access denied", 403);

  const endpoint = await getEndpointById(endpointId, orgId);
  if (!endpoint) throw new AppError("Endpoint not found", 404);

  const fromDate = from ? new Date(from) : undefined;
  const toDate = to ? new Date(to) : undefined;
  const limitNum = limit ? Number(limit) : 100;

  const checks = await getHealthChecks(endpointId, fromDate, toDate, limitNum);
  sendResponse(res, 200, "Health checks retrieved", { checks });
}
