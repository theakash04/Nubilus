import { Request, Response } from "express";
import { AppError, sendResponse } from "../../utils/handler";
import { userHasOrgPermission } from "../../db/queries/org";
import {
  createApiKey,
  generateApiKey,
  getApiKeysByOrgId,
  revokeApiKey,
} from "../../db/queries/api-keys";
import { CreateApiKeyInput } from "./api-keys.types";

export async function listApiKeys(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId } = req.params;

  if (!userId) throw new AppError("Unauthorized", 401);
  if (!orgId) throw new AppError("Organization ID required", 400);

  const hasAccess = await userHasOrgPermission(userId, orgId, "read");
  if (!hasAccess) throw new AppError("Access denied", 403);

  const keys = await getApiKeysByOrgId(orgId);
  sendResponse(res, 200, "API keys retrieved", { keys });
}

export async function createKey(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId } = req.params;

  if (!userId) throw new AppError("Unauthorized", 401);
  if (!orgId) throw new AppError("Organization ID required", 400);

  const hasAccess = await userHasOrgPermission(userId, orgId, "manage");
  if (!hasAccess) throw new AppError("Access denied", 403);

  const { name } = req.body as CreateApiKeyInput;
  const { key, hash, prefix } = generateApiKey();
  const apiKey = await createApiKey(orgId, hash, prefix, name);

  sendResponse(res, 201, "API key created. Save this key - it won't be shown again.", {
    id: apiKey.id,
    key,
    key_prefix: apiKey.key_prefix,
    name: apiKey.name,
    created_at: apiKey.created_at,
  });
}

export async function deleteKey(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId, keyId } = req.params;

  if (!userId) throw new AppError("Unauthorized", 401);
  if (!orgId || !keyId) throw new AppError("Organization ID and Key ID required", 400);

  const hasAccess = await userHasOrgPermission(userId, orgId, "manage");
  if (!hasAccess) throw new AppError("Access denied", 403);

  const revoked = await revokeApiKey(keyId, orgId);
  if (!revoked) throw new AppError("API key not found", 404);

  sendResponse(res, 200, "API key revoked");
}
