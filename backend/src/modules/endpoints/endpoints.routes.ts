import { Router } from "express";
import { authorize } from "../../middleware/authenticate.middleware";
import {
  createEndpointHandler,
  deleteEndpointHandler,
  getEndpoint,
  getEndpointChecks,
  getEndpointSettingsHandler,
  listEndpoints,
  updateEndpointHandler,
  updateEndpointSettingsHandler,
} from "./endpoints.controller";

const router = Router();

router.get("/:orgId/endpoints", authorize, listEndpoints);
router.post("/:orgId/endpoints", authorize, createEndpointHandler);
router.get("/:orgId/endpoints/:endpointId", authorize, getEndpoint);
router.put("/:orgId/endpoints/:endpointId", authorize, updateEndpointHandler);
router.delete("/:orgId/endpoints/:endpointId", authorize, deleteEndpointHandler);
router.get("/:orgId/endpoints/:endpointId/checks", authorize, getEndpointChecks);
router.get("/:orgId/endpoints/:endpointId/settings", authorize, getEndpointSettingsHandler);
router.put("/:orgId/endpoints/:endpointId/settings", authorize, updateEndpointSettingsHandler);

export default router;
