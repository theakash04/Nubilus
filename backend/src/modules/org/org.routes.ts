import { Router } from "express";
import { authorize } from "../../middleware/authenticate.middleware";
import {
  acceptInvite,
  createOrg,
  getAllInvites,
  getMyOrganizations,
  getOrganization,
  getStats,
  inviteMember,
  updateOrg,
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

export default router;
