import { Router } from "express";
import { authorize } from "../../middleware/authenticate.middleware";
import {
  acknowledgeAlertHandler,
  createAlertRuleHandler,
  deleteAlertRuleHandler,
  getAlertRule,
  listAlertRules,
  listAlerts,
  resolveAlertHandler,
  updateAlertRuleHandler,
} from "./alerts.controller";

const router = Router();

router.get("/:orgId/alert-rules", authorize, listAlertRules);
router.post("/:orgId/alert-rules", authorize, createAlertRuleHandler);
router.get("/:orgId/alert-rules/:ruleId", authorize, getAlertRule);
router.put("/:orgId/alert-rules/:ruleId", authorize, updateAlertRuleHandler);
router.delete("/:orgId/alert-rules/:ruleId", authorize, deleteAlertRuleHandler);

router.get("/:orgId/alerts", authorize, listAlerts);
router.put("/:orgId/alerts/:alertId/acknowledge", authorize, acknowledgeAlertHandler);
router.put("/:orgId/alerts/:alertId/resolve", authorize, resolveAlertHandler);

export default router;
