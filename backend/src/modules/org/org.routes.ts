import { Router } from "express";
import { authorize } from "../../middleware/authenticate.middleware";
import {
  createOrg,
  getMyOrganizations,
  getOrganization,
  getStats,
  updateOrg,
} from "./org.controller";

const router = Router();

router.get("/", authorize, getMyOrganizations);
router.post("/", authorize, createOrg);
router.get("/:orgId", authorize, getOrganization);
router.put("/:orgId", authorize, updateOrg);
router.get("/:orgId/stats/history", authorize, getStats);

export default router;
