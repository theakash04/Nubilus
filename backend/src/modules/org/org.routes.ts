import { Router } from "express";
import { authorize } from "../../middleware/authenticate.middleware";
import { createOrg, getMyOrganizations, getOrganization, updateOrg } from "./org.controller";

const router = Router();

router.get("/", authorize, getMyOrganizations);
router.post("/", authorize, createOrg);
router.get("/:orgId", authorize, getOrganization);
router.put("/:orgId", authorize, updateOrg);

export default router;
