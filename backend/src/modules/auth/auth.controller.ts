import { Request, Response } from "express";
import bcrypt from "bcrypt";
import {
  findAllRefreshTokenByUserId,
  getUserByEmail,
  getUserById,
  revokeRefreshToken,
  saveRefreshToken,
} from "../../db/queries/users";
import { AppError, sendResponse } from "../../utils/handler";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sha256Hex } from "../../utils/crypto";
import { createSession } from "../../utils/createSession";

// otp store
const otpStore = new Map<string, { otp: string; email: string; expiresAt: number }>();

export async function login(req: Request, res: Response) {
  if (!req.body) {
    throw new AppError("req body is required", 400);
  }
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("email and password required", 400);
  }

  // check password
  const user = await getUserByEmail(email);
  const passMatch = await bcrypt.compare(
    password,
    user?.password_hash || "$2b$10$DmUzh1O3EsvHW7.ArlTZF.9sF7BA4hSmTcRxiAx9aMXNaCNe2HJ2e"
  );

  if (!user || !passMatch) {
    throw new AppError("Invalid email or password", 401);
  }

  await createSession({
    userId: user.id,
    req,
    res,
  });

  sendResponse(res, 200, "logged in successfully!");
}

export async function logout(req: Request, res: Response) {
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError("unauthorize", 401);
  }

  // revoke all refresh tokens for the user
  const activeSessions = await findAllRefreshTokenByUserId(userId);
  for (const session of activeSessions) {
    await revokeRefreshToken(session.id);
  }

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  sendResponse(res, 200, "logged out successfully!");
}

// request session management
export async function requestSessionManagementOTP(req: Request, res: Response) {
  const { email } = req.body;

  if (!email) {
    throw new AppError("Email is required", 400);
  }

  const user = await getUserByEmail(email);
  if (!user) {
    sendResponse(res, 200, "If this email is registered, you will receive an OTP");
    return;
  }

  // generate 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  const otpId = crypto.randomUUID();

  otpStore.set(otpId, {
    otp,
    email: user.email,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  });

  // TODO: send otp mail
  console.log(user.email, otp);
  // await sendOTPEmail(user.email, otp);

  // Clean up expired OTPs
  setTimeout(() => otpStore.delete(otpId), 5 * 60 * 1000);

  sendResponse(res, 200, "OTP sent to your email", { otpId });
}

export async function verifySessionManagementOTP(req: Request, res: Response) {
  const { otpId, otp } = req.body;

  if (!otpId || !otp) {
    throw new AppError("OTP ID and OTP are required", 400);
  }

  const storedData = otpStore.get(otpId);

  if (!storedData) {
    throw new AppError("Invalid or expired OTP", 401);
  }

  if (storedData.expiresAt < Date.now()) {
    otpStore.delete(otpId);
    throw new AppError("OTP has expired", 401);
  }

  if (storedData.otp !== otp) {
    throw new AppError("Invalid OTP", 401);
  }

  otpStore.delete(otpId);

  const user = await getUserByEmail(storedData.email);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // gen temp auth header token
  const tempAuthToken = jwt.sign(
    {
      userId: user.id,
      type: "session_management",
      email: user.email,
    },
    process.env.JWT_SESSION_SECRET!,
    { expiresIn: "10m" }
  );

  sendResponse(res, 200, "OTP verified successfully", {
    authToken: tempAuthToken,
    expiresIn: 600,
  });
}

export async function getActiveSessions(req: Request, res: Response) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Authorization token required", 401);
  }

  const token = authHeader.substring(7);

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SESSION_SECRET!) as {
      userId: string;
      type: string;
      email: string;
    };
  } catch (error) {
    console.log(error);
    throw new AppError("Invalid or expired authorization token", 401);
  }

  if (decoded.type !== "session_management") {
    throw new AppError("Invalid token type", 403);
  }

  const activeSessions = await findAllRefreshTokenByUserId(decoded.userId);

  const sessionData = activeSessions.map(session => ({
    id: session.id,
    deviceInfo: session.user_agent || "Unknown Device",
    ipAddress: session.ip_address,
    createdAt: session.created_at,
    expiresAt: session.expires_at,
    isCurrent: false,
  }));

  sendResponse(res, 200, "Active sessions retrieved", { sessions: sessionData });
}

export async function logoutFromSession(req: Request, res: Response) {
  const authHeader = req.headers.authorization;
  const { sessionId } = req.body;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Authorization token required", 401);
  }

  const token = authHeader.substring(7);

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SESSION_SECRET!) as {
      userId: string;
      type: string;
    };
  } catch (error) {
    throw new AppError("Invalid or expired authorization token", 401);
  }

  if (decoded.type !== "session_management") {
    throw new AppError("Invalid token type", 403);
  }

  if (!sessionId) {
    throw new AppError("sessionId is required", 400);
  }

  // Verify session belongs to user
  const activeSessions = await findAllRefreshTokenByUserId(decoded.userId);
  const session = activeSessions.find(s => s.id === sessionId);

  if (!session) {
    throw new AppError("Session not found or doesn't belong to you", 404);
  }

  await revokeRefreshToken(session.id);

  sendResponse(res, 200, "Session terminated successfully");
}

export async function getUser(req: Request, res: Response) {
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError("unauthorize", 401);
  }

  // get user
  const user = await getUserById(userId);

  if (!user) {
    throw new AppError("User not found", 400);
  }

  sendResponse(res, 200, "user found successfully!", user);
}
