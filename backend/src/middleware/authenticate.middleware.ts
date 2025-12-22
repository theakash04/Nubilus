import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AccessTokenPayload, RefreshTokenPayload } from "../types/jwt";
import { findRefreshTokenById } from "../db/queries/users";
import { sha256Hex } from "../utils/crypto";

export async function authorize(req: Request, res: Response, next: NextFunction) {
  const accessToken = req.cookies?.accessToken;
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return logoutAndReject(res);
  }

  let refreshPayload: RefreshTokenPayload;

  try {
    refreshPayload = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    ) as RefreshTokenPayload;

    if (refreshPayload.type !== "refresh") {
      return logoutAndReject(res);
    }
  } catch (error) {
    return logoutAndReject(res);
  }

  const stored = await findRefreshTokenById(refreshPayload.jti);

  if (!stored) {
    return logoutAndReject(res);
  }

  if (stored.revoked) {
    return logoutAndReject(res);
  }

  if (new Date(stored.expires_at) < new Date()) {
    return logoutAndReject(res);
  }

  if (sha256Hex(refreshToken) !== stored.token_hash) {
    return logoutAndReject(res);
  }

  if (accessToken) {
    try {
      const payload = jwt.verify(accessToken, process.env.JWT_SECRET!) as AccessTokenPayload;
      if (payload.type === "access" && payload.userId === refreshPayload.userId) {
        req.user = { userId: payload.userId };
        return next();
      }
    } catch (err: any) {
      // access token expired or invalid, continue to issue new one
    }
  }

  const newAccessToken = jwt.sign(
    {
      userId: refreshPayload.userId,
      type: "access",
    },
    process.env.JWT_SECRET!,
    { expiresIn: "15m" }
  );

  res.cookie("accessToken", newAccessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: 15 * 60 * 1000,
  });

  req.user = { userId: refreshPayload.userId };

  return next();
}

function logoutAndReject(res: Response) {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  return res.status(401).json({ success: false, message: "Session expired or revoked" });
}
