import { Request, Response } from "express";
import { AppError, sendResponse } from "../../utils/handler";
import {
  acceptOrgInvite,
  countActiveManagers,
  createOrganization,
  createOrgInvite,
  getOrganizationById,
  getOrganizationsByUserId,
  getMemberPermissions,
  listAllMembers,
  ListOrgInvites,
  suspendMember,
  updateMemberPermissions,
  updateOrganization,
  userHasOrgPermission,
  getOrgSettings,
  updateOrgSettings,
  getOrgAdminEmails,
} from "../../db/queries/org";
import { CreateOrgInput, InviteMemberInput, UpdateOrgInput } from "./org.types";
import { serverTrends } from "../../db/queries/servers";
import { endpointTrends } from "../../db/queries/endpoints";
import { databaseTrends } from "../../db/queries/databases";
import { alertTrends } from "../../db/queries/alerts";
import { createSession } from "../../utils/createSession";
import { addEmailJob } from "../../queues";

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

  await addEmailJob({
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

  console.log(token);
  if (!token || typeof token !== "string") {
    throw new AppError("Invite token is required", 400);
  }

  const { userId, mustSetPassword, orgId, email, fullName } = await acceptOrgInvite({
    token,
  });

  // Handle new member notifications
  try {
    const settings = await getOrgSettings(orgId);

    if (settings && settings.notify_on_new_member) {
      let recipients = settings.notification_emails;

      // If no specific notification emails set, fetch all admins
      if (!recipients || recipients.length === 0) {
        recipients = await getOrgAdminEmails(orgId);
      }

      if (recipients.length > 0) {
        // Send email to each recipient
        await Promise.all(
          recipients.map(recipient =>
            addEmailJob({
              to: recipient,
              subject: `New Member Joined: ${fullName}`,
              html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2>New Member Joined</h2>
                <p><strong>${fullName}</strong> (${email}) has just joined your organization.</p>
                <p>Role/Permissions have been assigned as per the invitation.</p>
                <br/>
                <a href="${process.env.FRONTEND_URL}/dashboard/${orgId}/users" style="color: #0d9488;">View Members</a>
              </div>
            `,
            })
          )
        );
      }
    }
  } catch (error) {
    console.error("Failed to send new member notifications:", error);
    // Don't fail the request if notification fails
  }

  const session = await createSession({
    req,
    res,
    userId,
  });

  sendResponse(res, 200, "Invitation accepted successfully", { mustSetPassword });
}

export async function getAllInvites(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId } = req.params;

  if (!userId) throw new AppError("Unauthorized", 401);
  if (!orgId) throw new AppError("Organization ID required", 400);

  const hasAccess = await userHasOrgPermission(userId, orgId, "manage");
  if (!hasAccess) throw new AppError("Access denied", 403);

  const invites = await ListOrgInvites({ orgId, accepted: false });

  sendResponse(res, 200, "Invites retrieved", { invites });
}

export async function getAllMembers(req: Request, res: Response) {
  const userId = req.user?.userId;
  const { orgId } = req.params;
  const { status } = req.query;

  if (!userId) throw new AppError("Unauthorized", 401);
  if (!orgId) throw new AppError("Organization ID required", 400);

  const hasAccess = await userHasOrgPermission(userId, orgId, "manage");
  if (!hasAccess) throw new AppError("Access denied", 403);

  const acceptedStatus = ["active", "suspended"];
  if (!status || typeof status !== "string") {
    throw new AppError("Status is required. Use 'active' or 'suspended'", 400);
  }
  if (!acceptedStatus.includes(status)) {
    throw new AppError("Invalid status. Only 'active' or 'suspended' allowed", 400);
  }

  const members = await listAllMembers({ orgId, status: status as "active" | "suspended" });

  sendResponse(res, 200, "Members retrieved", { members });
}

export async function suspendMemberController(req: Request, res: Response) {
  const currentUserId = req.user?.userId;
  const { orgId, userId } = req.params;

  if (!currentUserId) throw new AppError("Unauthorized", 401);
  if (!orgId) throw new AppError("Organization ID required", 400);
  if (!userId) throw new AppError("User ID required", 400);

  const hasAccess = await userHasOrgPermission(currentUserId, orgId, "manage");
  if (!hasAccess) throw new AppError("Access denied", 403);

  // Check if user is trying to suspend themselves
  if (currentUserId === userId) {
    throw new AppError("You cannot suspend yourself", 400);
  }

  // Check if user being suspended has manage permission
  const targetPermissions = await getMemberPermissions({ orgId, userId });
  if (targetPermissions?.includes("manage")) {
    // Count how many active managers exist
    const managerCount = await countActiveManagers(orgId);
    if (managerCount <= 1) {
      throw new AppError("Cannot suspend the last manager of the organization", 400);
    }
  }

  await suspendMember({ orgId, userId });

  sendResponse(res, 200, "Member suspended");
}

export async function updateMemberController(req: Request, res: Response) {
  const currentUserId = req.user?.userId;
  const { orgId, userId } = req.params;
  const { permissions } = req.body;

  if (!currentUserId) throw new AppError("Unauthorized", 401);
  if (!orgId) throw new AppError("Organization ID required", 400);
  if (!userId) throw new AppError("User ID required", 400);

  // Check if user is trying to update his own permission
  if (currentUserId === userId) {
    throw new AppError("You cannot modify your own permissions", 400);
  }

  const hasAccess = await userHasOrgPermission(currentUserId, orgId, "manage");
  if (!hasAccess) throw new AppError("Access denied", 403);

  // Validate permissions array
  const validPermissions = ["read", "write", "manage"];
  if (!Array.isArray(permissions) || !permissions.every(p => validPermissions.includes(p))) {
    throw new AppError("Invalid permissions. Use 'read', 'write', or 'manage'", 400);
  }

  // If removing manage permission, check if they're the last manager
  const targetPermissions = await getMemberPermissions({ orgId, userId });
  if (targetPermissions?.includes("manage") && !permissions.includes("manage")) {
    const managerCount = await countActiveManagers(orgId);
    if (managerCount <= 1) {
      throw new AppError("Cannot remove manage permission from the last manager", 400);
    }
  }

  await updateMemberPermissions({ orgId, userId, permissions });

  sendResponse(res, 200, "Member permissions updated");
}

export async function getAllOrgSettings(req: Request, res: Response) {
  const currentUserId = req.user?.userId;
  const { orgId } = req.params;

  if (!currentUserId) throw new AppError("Unauthorized", 401);
  if (!orgId) throw new AppError("Organization ID required", 400);

  const hasAccess = await userHasOrgPermission(currentUserId, orgId, "manage");
  if (!hasAccess) throw new AppError("Access denied", 403);

  const settings = await getOrgSettings(orgId);

  sendResponse(res, 200, "Org settings fetched successfully!", settings);
}

export async function updateOrgSettingsController(req: Request, res: Response) {
  const currentUserId = req.user?.userId;
  const { orgId } = req.params;
  const {
    invite_expiry_hours,
    default_member_permissions,
    require_2fa,
    notify_on_new_member,
    notify_on_server_offline,
    notify_on_alert_triggered,
    webhook_url,
    webhook_secret,
    webhook_enabled,
    notification_emails,
  } = req.body;

  if (!currentUserId) throw new AppError("Unauthorized", 401);
  if (!orgId) throw new AppError("Organization ID required", 400);

  const hasAccess = await userHasOrgPermission(currentUserId, orgId, "manage");
  if (!hasAccess) throw new AppError("Access denied", 403);

  await updateOrgSettings({
    orgId,
    invite_expiry_hours,
    default_member_permissions,
    require_2fa,
    notify_on_new_member,
    notify_on_server_offline,
    notify_on_alert_triggered,
    notification_emails,
    webhook_url,
    webhook_secret,
    webhook_enabled,
  });

  sendResponse(res, 200, "Settings updated successfully");
}
