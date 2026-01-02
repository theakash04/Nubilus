import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { sha256Hex } from "../utils/crypto";
import { Request, Response } from "express";
import { findAllRefreshTokenByUserId, saveRefreshToken } from "../db/queries/users";
import { AppError } from "./handler";

export async function createSession({
  userId,
  req,
  res,
}: {
  userId: string;
  req: Request;
  res: Response;
}) {
  // Enforce max active sessions
  const activeSessions = await findAllRefreshTokenByUserId(userId);
  if (activeSessions.length >= 5) {
    throw new AppError(
      "Maximum active sessions reached. Please logout from other devices to continue.",
      403
    );
  }

  // Create access token
  const accessToken = jwt.sign({ userId, type: "access" }, process.env.JWT_SECRET!, {
    expiresIn: "15m",
  });

  // Create refresh token
  const jti = uuidv4();
  const refreshToken = jwt.sign(
    { userId, type: "refresh", jti },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: "30d" }
  );

  const tokenHash = sha256Hex(refreshToken);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await saveRefreshToken({
    id: jti,
    userId,
    tokenHash,
    expiresAt,
    userAgent: req.get("user-agent"),
    ipAddress: req.ip,
  });

  // Set cookies
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}
