import { Router } from "express";
import { authorize } from "../../middleware/authenticate.middleware";
import {
  deleteServerHandler,
  getServer,
  getServerMetricsHandler,
  listServers,
  updateServerHandler,
} from "./servers.controller";

const router = Router();

router.get("/:orgId/servers", authorize, listServers);
router.get("/:orgId/servers/:serverId", authorize, getServer);
router.put("/:orgId/servers/:serverId", authorize, updateServerHandler);
router.delete("/:orgId/servers/:serverId", authorize, deleteServerHandler);
router.get("/:orgId/servers/:serverId/metrics", authorize, getServerMetricsHandler);

export default router;
