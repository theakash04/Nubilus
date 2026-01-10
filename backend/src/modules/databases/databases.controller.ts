import { Request, Response } from "express";
import { AppError, sendResponse } from "../../utils/handler";
import { userHasOrgPermission } from "../../db/queries/org";
import {
  createDatabaseTarget,
  deleteDatabaseTarget,
  getDatabaseMetrics,
  getDatabaseTargetById,
  getDatabaseTargetsByOrgId,
  updateDatabaseTarget,
} from "../../db/queries/databases";
import { getDatabaseSettings, updateDatabaseSettings } from "../../db/queries/settings";
import {
  CreateDatabaseTargetInput,
  DatabaseMetricsQuery,
  UpdateDatabaseSettingsInput,
  UpdateDatabaseTargetInput,
} from "./databases.types";
import {
  scheduleDatabaseMonitoring,
  removeDatabaseMonitoring,
  updateDatabaseMonitoring,
} from "../../queues";

export async function listDatabaseTargets(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId } = req.params;

  if (!userId) throw new AppError("Unauthorized", 401);

  const hasAccess = await userHasOrgPermission(userId, orgId, "read");
  if (!hasAccess) throw new AppError("Access denied", 403);

  const databases = await getDatabaseTargetsByOrgId(orgId);
  sendResponse(res, 200, "Database targets retrieved", { databases });
}

export async function getDatabaseTarget(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId, dbId } = req.params;

  if (!userId) throw new AppError("Unauthorized", 401);

  const hasAccess = await userHasOrgPermission(userId, orgId, "read");
  if (!hasAccess) throw new AppError("Access denied", 403);

  const database = await getDatabaseTargetById(dbId, orgId);
  if (!database) throw new AppError("Database target not found", 404);

  sendResponse(res, 200, "Database target retrieved", database);
}

export async function createDatabaseTargetHandler(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId } = req.params;

  if (!userId) throw new AppError("Unauthorized", 401);

  const hasAccess = await userHasOrgPermission(userId, orgId, "write");
  if (!hasAccess) throw new AppError("Access denied", 403);

  const data = req.body as CreateDatabaseTargetInput;
  if (!data.name?.trim() || !data.db_type || !data.connection_url?.trim()) {
    throw new AppError("Name, db_type, and connection_url are required", 400);
  }

  const database = await createDatabaseTarget(orgId, data);

  // Schedule monitoring for the new database
  await scheduleDatabaseMonitoring(database);

  sendResponse(res, 201, "Database target created", database);
}

export async function updateDatabaseTargetHandler(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId, dbId } = req.params;

  if (!userId) throw new AppError("Unauthorized", 401);

  const hasAccess = await userHasOrgPermission(userId, orgId, "write");
  if (!hasAccess) throw new AppError("Access denied", 403);

  const updates = req.body as UpdateDatabaseTargetInput;
  const database = await updateDatabaseTarget(dbId, orgId, updates);

  if (!database) throw new AppError("Database target not found", 404);

  // Update monitoring schedule if interval or enabled status changed
  if (updates.check_interval !== undefined || updates.enabled !== undefined) {
    await updateDatabaseMonitoring(database);
  }

  sendResponse(res, 200, "Database target updated", database);
}

export async function deleteDatabaseTargetHandler(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId, dbId } = req.params;

  if (!userId) throw new AppError("Unauthorized", 401);

  const hasAccess = await userHasOrgPermission(userId, orgId, "manage");
  if (!hasAccess) throw new AppError("Access denied", 403);

  // Remove from monitoring before deleting
  await removeDatabaseMonitoring(dbId);

  const deleted = await deleteDatabaseTarget(dbId, orgId);
  if (!deleted) throw new AppError("Database target not found", 404);

  sendResponse(res, 200, "Database target deleted");
}

export async function getDatabaseMetricsHandler(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId, dbId } = req.params;
  const { from, to, limit } = req.query as unknown as DatabaseMetricsQuery;

  if (!userId) throw new AppError("Unauthorized", 401);

  const hasAccess = await userHasOrgPermission(userId, orgId, "read");
  if (!hasAccess) throw new AppError("Access denied", 403);

  const database = await getDatabaseTargetById(dbId, orgId);
  if (!database) throw new AppError("Database target not found", 404);

  const fromDate = from ? new Date(from) : undefined;
  const toDate = to ? new Date(to) : undefined;
  const limitNum = limit ? Number(limit) : 100;

  const metrics = await getDatabaseMetrics(dbId, fromDate, toDate, limitNum);
  sendResponse(res, 200, "Database metrics retrieved", { metrics });
}

export async function getDatabaseSettingsHandler(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId, dbId } = req.params;

  if (!userId) throw new AppError("Unauthorized", 401);

  const hasAccess = await userHasOrgPermission(userId, orgId, "write");
  if (!hasAccess) throw new AppError("Access denied", 403);

  const database = await getDatabaseTargetById(dbId, orgId);
  if (!database) throw new AppError("Database target not found", 404);

  const settings = await getDatabaseSettings(dbId);
  sendResponse(res, 200, "Database settings retrieved", settings);
}

export async function updateDatabaseSettingsHandler(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId, dbId } = req.params;

  if (!userId) throw new AppError("Unauthorized", 401);

  const hasAccess = await userHasOrgPermission(userId, orgId, "write");
  if (!hasAccess) throw new AppError("Access denied", 403);

  const database = await getDatabaseTargetById(dbId, orgId);
  if (!database) throw new AppError("Database target not found", 404);

  const updates = req.body as UpdateDatabaseSettingsInput;
  const settings = await updateDatabaseSettings(dbId, updates);

  sendResponse(res, 200, "Database settings updated", settings);
}
