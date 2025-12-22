import { Router } from "express";
import { authorize } from "../../middleware/authenticate.middleware";
import { createKey, deleteKey, listApiKeys } from "./api-keys.controller";

const router = Router();

router.get("/:orgId/keys", authorize, listApiKeys);
router.post("/:orgId/keys", authorize, createKey);
router.delete("/:orgId/keys/:keyId", authorize, deleteKey);

export default router;
