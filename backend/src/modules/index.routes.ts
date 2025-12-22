import { Router } from "express";
import authRoutes from "./auth/auth.routes";
import orgRoutes from "./org/org.routes";
import apiKeysRoutes from "./api-keys/api-keys.routes";
import serversRoutes from "./servers/servers.routes";
import endpointsRoutes from "./endpoints/endpoints.routes";
import databasesRoutes from "./databases/databases.routes";
import alertsRoutes from "./alerts/alerts.routes";
import ingestRoutes from "./ingest/ingest.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/org", orgRoutes);
router.use("/org", apiKeysRoutes);
router.use("/org", serversRoutes);
router.use("/org", endpointsRoutes);
router.use("/org", databasesRoutes);
router.use("/org", alertsRoutes);
router.use("/ingest", ingestRoutes);

export default router;
