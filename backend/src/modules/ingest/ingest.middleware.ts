import { NextFunction, Request, Response } from "express";
import { getApiKeyByHash, updateApiKeyLastUsed } from "../../db/queries/api-keys";
import { sha256Hex } from "../../utils/crypto";

export async function authenticateApiKey(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["x-api-key"] || req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ success: false, message: "API key required" });
  }

  const apiKey = typeof authHeader === "string" 
    ? authHeader.replace(/^Bearer\s+/i, "") 
    : authHeader;

  const keyHash = sha256Hex(apiKey as string);
  const keyRecord = await getApiKeyByHash(keyHash);

  if (!keyRecord) {
    return res.status(401).json({ success: false, message: "Invalid API key" });
  }

  await updateApiKeyLastUsed(keyRecord.id);

  req.apiKey = {
    id: keyRecord.id,
    orgId: keyRecord.org_id,
  };

  next();
}
