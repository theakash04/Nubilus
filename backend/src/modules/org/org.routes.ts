import { Router } from "express";
import { authorize } from "../../middleware/authenticate.middleware";
import {
  acceptInvite,
  createOrg,
  getAllInvites,
  getAllMembers,
  getAllOrgSettings,
  getMyOrganizations,
  getOrganization,
  getStats,
  inviteMember,
  suspendMemberController,
  updateMemberController,
  updateOrg,
  updateOrgSettingsController,
} from "./org.controller";

const router = Router();

router.get("/", authorize, getMyOrganizations);
router.post("/", authorize, createOrg);
router.get("/:orgId", authorize, getOrganization);
router.put("/:orgId", authorize, updateOrg);
router.get("/:orgId/stats/history", authorize, getStats);
router.post("/:orgId/invite", authorize, inviteMember);
router.get("/invite/accept", acceptInvite);
router.get("/:orgId/invites", authorize, getAllInvites);
router.get("/:orgId/members", authorize, getAllMembers);
router.patch("/:orgId/members/:userId/suspend", authorize, suspendMemberController);
router.put("/:orgId/members/:userId", authorize, updateMemberController);
router.get("/:orgId/settings", authorize, getAllOrgSettings);
router.put("/:orgId/settings", authorize, updateOrgSettingsController);

export default router;
