import { Router } from "express";
import {
  getActiveSessions,
  getActiveSessionsAuth,
  getUser,
  login,
  logout,
  logoutFromSession,
  requestSessionManagementOTP,
  resetPassword,
  revokeSessionAuth,
  sendResetPassOtp,
  setPassword,
  verifyResetPassOtp,
  verifySessionManagementOTP,
} from "./auth.controller";
import { authorize } from "../../middleware/authenticate.middleware";

const router = Router();

router.post("/login", login);
router.post("/request", requestSessionManagementOTP);
router.post("/verify", verifySessionManagementOTP);
router.get("/session", getActiveSessions);
router.delete("/session/logout", logoutFromSession);
router.post("/reset-password/send", sendResetPassOtp);
router.post("/reset-password/verify", verifyResetPassOtp);
router.post("/reset-password", resetPassword);

// auth needed
router.get("/user", authorize, getUser);
router.get("/logout", authorize, logout);
router.post("/set-password", authorize, setPassword);
router.get("/sessions", authorize, getActiveSessionsAuth);
router.delete("/sessions/:id", authorize, revokeSessionAuth);

export default router;
