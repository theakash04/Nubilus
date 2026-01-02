import { Request, Response } from "express";
import { AppError, sendResponse } from "../../utils/handler";
import { sendEmail } from "../../utils/email";
import {
  acceptOrgInvite,
  createOrganization,
  createOrgInvite,
  getOrganizationById,
  getOrganizationsByUserId,
  updateOrganization,
  userHasOrgPermission,
} from "../../db/queries/org";
import { CreateOrgInput, InviteMemberInput, UpdateOrgInput } from "./org.types";
import { serverTrends } from "../../db/queries/servers";
import { endpointTrends } from "../../db/queries/endpoints";
import { databaseTrends } from "../../db/queries/databases";
import { alertTrends } from "../../db/queries/alerts";
import { createSession } from "../../utils/createSession";

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

export async function getStats(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId } = req.params;

  if (!userId) throw new AppError("Unauthorized", 401);
  if (!orgId) throw new AppError("Organization ID required", 400);

  const hasAccess = await userHasOrgPermission(userId, orgId, "read");
  if (!hasAccess) throw new AppError("Access denied", 403);

  // Fetch all trends in parallel
  const [servers, endpoints, databases, alerts] = await Promise.all([
    serverTrends(orgId),
    endpointTrends(orgId),
    databaseTrends(orgId),
    alertTrends(orgId),
  ]);

  sendResponse(res, 200, "Stats history", {
    servers: servers.map(r => Number(r.count)),
    endpoints: endpoints.map(r => Number(r.count)),
    databases: databases.map(r => Number(r.count)),
    alerts: alerts.map(r => Number(r.count)),
  });
}

export async function inviteMember(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId } = req.params;

  if (!userId) throw new AppError("Unauthorized", 401);
  if (!orgId) throw new AppError("Organization ID required", 400);

  const hasAccess = await userHasOrgPermission(userId, orgId, "manage");
  if (!hasAccess) throw new AppError("Access denied", 403);

  const { email, permissions, fullName } = req.body as InviteMemberInput;
  if (!email || !permissions || !fullName) {
    throw new AppError("Email, fullName and permissions are required", 400);
  }

  // Get org name for email
  const org = await getOrganizationById(orgId);
  if (!org) throw new AppError("Organization not found", 404);

  const { token } = await createOrgInvite({
    email,
    fullName,
    inviterId: userId,
    orgId,
    permissions,
  });

  const inviteUrl = `${process.env.FRONTEND_URL}/accept-invite?token=${token}`;

  await sendEmail({
    to: email,
    subject: `You've been invited to join ${org.name} on Nubilus`,
    html: `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2>Welcome to Nubilus</h2>

      <p>You’ve been invited to join <strong>${org.name}</strong>.</p>

      <p>This link will sign you in automatically and ask you to set a password.</p>

      <a
        href="${inviteUrl}"
        style="background-color: #0f766e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;"
      >
        Accept Invitation
      </a>

      <p style="color: #666; font-size: 12px;">
        This invitation expires in 24 hours.
      </p>
    </div>
  `,
  });

  sendResponse(res, 200, "Invitation sent successfully");
}

export async function acceptInvite(req: Request, res: Response) {
  const token = req.query.token;

  if (!token || typeof token !== "string") {
    throw new AppError("Invite token is required", 400);
  }

  const { userId, mustSetPassword } = await acceptOrgInvite({ token });

  const session = await createSession({
    req,
    res,
    userId,
  });

  res.json({
    success: true,
    mustSetPassword,
  });
}

export async function getAllInvites(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId } = req.params;

  if (!userId) throw new AppError("Unauthorized", 401);
  if (!orgId) throw new AppError("Organization ID required", 400);

  const hasAccess = await userHasOrgPermission(userId, orgId, "manage");
  if (!hasAccess) throw new AppError("Access denied", 403);

  
}
