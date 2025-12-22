import { Request, Response } from "express";
import { AppError, sendResponse } from "../../utils/handler";
import {
  createOrganization,
  getOrganizationById,
  getOrganizationsByUserId,
  updateOrganization,
  userHasOrgPermission,
} from "../../db/queries/org";
import { CreateOrgInput, UpdateOrgInput } from "./org.types";

export async function getMyOrganizations(req: Request, res: Response) {
  const userId = req.user?.userId;
  if (!userId) throw new AppError("Unauthorized", 401);

  const orgs = await getOrganizationsByUserId(userId);
  sendResponse(res, 200, "Organizations retrieved", { organizations: orgs });
}

export async function getOrganization(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId } = req.params;

  if (!userId) throw new AppError("Unauthorized", 401);
  if (!orgId) throw new AppError("Organization ID required", 400);

  const hasAccess = await userHasOrgPermission(userId, orgId, "read");
  if (!hasAccess) throw new AppError("Access denied", 403);

  const org = await getOrganizationById(orgId);
  if (!org) throw new AppError("Organization not found", 404);

  sendResponse(res, 200, "Organization retrieved", org);
}

export async function createOrg(req: Request, res: Response) {
  const userId = req.user?.userId;
  if (!userId) throw new AppError("Unauthorized", 401);

  const { name } = req.body as CreateOrgInput;
  if (!name?.trim()) throw new AppError("Organization name required", 400);

  const org = await createOrganization(name.trim(), userId);
  sendResponse(res, 201, "Organization created", org);
}

export async function updateOrg(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId } = req.params;

  if (!userId) throw new AppError("Unauthorized", 401);
  if (!orgId) throw new AppError("Organization ID required", 400);

  const hasAccess = await userHasOrgPermission(userId, orgId, "manage");
  if (!hasAccess) throw new AppError("Access denied", 403);

  const updates = req.body as UpdateOrgInput;
  const org = await updateOrganization(orgId, updates);

  if (!org) throw new AppError("Organization not found", 404);
  sendResponse(res, 200, "Organization updated", org);
}
