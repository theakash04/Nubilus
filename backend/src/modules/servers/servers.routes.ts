import { Router } from "express";
import { authorize } from "../../middleware/authenticate.middleware";
import {
  deleteServerHandler,
  getServer,
  getServerMetricsHandler,
  getServerSettingsHandler,
  listServers,
  updateServerHandler,
  updateServerSettingsHandler,
} from "./servers.controller";

const router = Router();

router.get("/:orgId/servers", authorize, listServers);
router.get("/:orgId/servers/:serverId", authorize, getServer);
router.put("/:orgId/servers/:serverId", authorize, updateServerHandler);
router.delete("/:orgId/servers/:serverId", authorize, deleteServerHandler);
router.get("/:orgId/servers/:serverId/metrics", authorize, getServerMetricsHandler);
router.get("/:orgId/servers/:serverId/settings", authorize, getServerSettingsHandler);
router.put("/:orgId/servers/:serverId/settings", authorize, updateServerSettingsHandler);

export default router;
