import { Request, Response } from "express";
import { AppError, sendResponse } from "../../utils/handler";
import { userHasOrgPermission } from "../../db/queries/org";
import {
  acknowledgeAlert,
  createAlertRule,
  deleteAlertRule,
  getAlertRuleById,
  getAlertRulesByOrgId,
  getAlertsByOrgId,
  resolveAlert,
  updateAlertRule,
} from "../../db/queries/alerts";
import { AlertsQuery, CreateAlertRuleInput, UpdateAlertRuleInput } from "./alerts.types";

export async function listAlertRules(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId } = req.params;

  if (!userId) throw new AppError("Unauthorized", 401);

  const hasAccess = await userHasOrgPermission(userId, orgId, "read");
  if (!hasAccess) throw new AppError("Access denied", 403);

  const rules = await getAlertRulesByOrgId(orgId);
  sendResponse(res, 200, "Alert rules retrieved", { rules });
}

export async function getAlertRule(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId, ruleId } = req.params;

  if (!userId) throw new AppError("Unauthorized", 401);

  const hasAccess = await userHasOrgPermission(userId, orgId, "read");
  if (!hasAccess) throw new AppError("Access denied", 403);

  const rule = await getAlertRuleById(ruleId, orgId);
  if (!rule) throw new AppError("Alert rule not found", 404);

  sendResponse(res, 200, "Alert rule retrieved", rule);
}

export async function createAlertRuleHandler(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId } = req.params;

  if (!userId) throw new AppError("Unauthorized", 401);

  const hasAccess = await userHasOrgPermission(userId, orgId, "write");
  if (!hasAccess) throw new AppError("Access denied", 403);

  const data = req.body as CreateAlertRuleInput;
  if (!data.name?.trim() || !data.rule_type || !data.target_type || !data.target_id) {
    throw new AppError("Name, rule_type, target_type, and target_id are required", 400);
  }

  const rule = await createAlertRule(orgId, data);
  sendResponse(res, 201, "Alert rule created", rule);
}

export async function updateAlertRuleHandler(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId, ruleId } = req.params;

  if (!userId) throw new AppError("Unauthorized", 401);

  const hasAccess = await userHasOrgPermission(userId, orgId, "write");
  if (!hasAccess) throw new AppError("Access denied", 403);

  const updates = req.body as UpdateAlertRuleInput;
  const rule = await updateAlertRule(ruleId, orgId, updates);

  if (!rule) throw new AppError("Alert rule not found", 404);
  sendResponse(res, 200, "Alert rule updated", rule);
}

export async function deleteAlertRuleHandler(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId, ruleId } = req.params;

  if (!userId) throw new AppError("Unauthorized", 401);

  const hasAccess = await userHasOrgPermission(userId, orgId, "manage");
  if (!hasAccess) throw new AppError("Access denied", 403);

  const deleted = await deleteAlertRule(ruleId, orgId);
  if (!deleted) throw new AppError("Alert rule not found", 404);

  sendResponse(res, 200, "Alert rule deleted");
}

export async function listAlerts(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId } = req.params;
  const { status, severity, limit } = req.query as unknown as AlertsQuery;

  if (!userId) throw new AppError("Unauthorized", 401);

  const hasAccess = await userHasOrgPermission(userId, orgId, "read");
  if (!hasAccess) throw new AppError("Access denied", 403);

  const alerts = await getAlertsByOrgId(orgId, {
    status,
    severity,
    limit: limit ? Number(limit) : undefined,
  });
  sendResponse(res, 200, "Alerts retrieved", { alerts });
}

export async function acknowledgeAlertHandler(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId, alertId } = req.params;

  if (!userId) throw new AppError("Unauthorized", 401);

  const hasAccess = await userHasOrgPermission(userId, orgId, "write");
  if (!hasAccess) throw new AppError("Access denied", 403);

  const alert = await acknowledgeAlert(alertId, orgId);
  if (!alert) throw new AppError("Alert not found", 404);

  sendResponse(res, 200, "Alert acknowledged", alert);
}

export async function resolveAlertHandler(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId, alertId } = req.params;

  if (!userId) throw new AppError("Unauthorized", 401);

  const hasAccess = await userHasOrgPermission(userId, orgId, "write");
  if (!hasAccess) throw new AppError("Access denied", 403);

  const alert = await resolveAlert(alertId, orgId);
  if (!alert) throw new AppError("Alert not found", 404);

  sendResponse(res, 200, "Alert resolved", alert);
}
