import { Router } from "express";
import {
  getActiveSessions,
  getUser,
  login,
  logout,
  logoutFromSession,
  requestSessionManagementOTP,
  verifySessionManagementOTP,
} from "./auth.controller";
import { authorize } from "../../middleware/authenticate.middleware";

const router = Router();

router.post("/login", login);
router.post("/request", requestSessionManagementOTP);
router.post("/verify", verifySessionManagementOTP);
router.get("/session", getActiveSessions);
router.delete("/session/logout", logoutFromSession);

// auth needed
router.get("/user", authorize, getUser);
router.get("/logout", authorize, logout);

export default router;
