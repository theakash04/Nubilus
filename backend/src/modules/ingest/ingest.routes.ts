import { Router } from "express";
import { authenticateApiKey } from "./ingest.middleware";
import { heartbeat, registerServer, submitHealthCheck, submitMetrics } from "./ingest.controller";

const router = Router();

router.post("/register", authenticateApiKey, registerServer);
router.post("/metrics", authenticateApiKey, submitMetrics);
router.post("/heartbeat", authenticateApiKey, heartbeat);
router.post("/health", authenticateApiKey, submitHealthCheck);

export default router;
