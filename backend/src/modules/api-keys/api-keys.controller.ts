import { Request, Response } from "express";
import { AppError, sendResponse } from "../../utils/handler";
import {
  getOrgSettings,
  userHasOrgPermission,
  getOrgAdminEmails,
  getOrganizationById,
} from "../../db/queries/org";
import {
  createApiKey,
  generateApiKey,
  getApiKeysByOrgId,
  revokeApiKey,
} from "../../db/queries/api-keys";
import { getServerByApiKeyId, deleteServer } from "../../db/queries/servers";
import { CreateApiKeyInput } from "./api-keys.types";
import { addEmailJob } from "../../queues";

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

  // Get associated server before revoking
  const server = await getServerByApiKeyId(keyId);
  const serverName = server?.name || "Unknown Server";

  // Revoke the API key
  const revoked = await revokeApiKey(keyId, orgId);
  if (!revoked) throw new AppError("API key not found", 404);

  // Delete associated server if exists
  if (server) {
    await deleteServer(server.id, orgId);
  }

  // Send notification to admins
  try {
    const settings = await getOrgSettings(orgId);

    if (settings && settings.notify_on_server_offline) {
      let recipients = settings.notification_emails;

      if (!recipients || recipients.length === 0) {
        recipients = await getOrgAdminEmails(orgId);
      }

      const org = await getOrganizationById(orgId);
      const orgName = org?.name || "your organization";

      for (const recipient of recipients) {
        await addEmailJob({
          to: recipient,
          subject: `API Key Revoked: ${serverName} removed`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
              <h2>API Key Revoked</h2>
              <p>An API key has been revoked in <strong>${orgName}</strong>.</p>
              <p>The associated server <strong>${serverName}</strong> has been removed from monitoring.</p>
              <br/>
              <a href="${process.env.FRONTEND_URL}/dashboard/${orgId}/servers" style="color: #0d9488;">View Servers</a>
            </div>
          `,
        });
      }
    }
  } catch (error) {
    console.error("Failed to send API key revocation notification:", error);
  }

  sendResponse(res, 200, "API key revoked and server removed");
}
