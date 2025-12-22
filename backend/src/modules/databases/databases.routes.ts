import { Router } from "express";
import { authorize } from "../../middleware/authenticate.middleware";
import {
  createDatabaseTargetHandler,
  deleteDatabaseTargetHandler,
  getDatabaseMetricsHandler,
  getDatabaseTarget,
  listDatabaseTargets,
  updateDatabaseTargetHandler,
} from "./databases.controller";

const router = Router();

router.get("/:orgId/databases", authorize, listDatabaseTargets);
router.post("/:orgId/databases", authorize, createDatabaseTargetHandler);
router.get("/:orgId/databases/:dbId", authorize, getDatabaseTarget);
router.put("/:orgId/databases/:dbId", authorize, updateDatabaseTargetHandler);
router.delete("/:orgId/databases/:dbId", authorize, deleteDatabaseTargetHandler);
router.get("/:orgId/databases/:dbId/metrics", authorize, getDatabaseMetricsHandler);

export default router;
