import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";

export type AuthedRequest = Request & { userId: string };

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const auth = getAuth(req);
  if (!auth.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as unknown as AuthedRequest).userId = auth.userId;
  next();
}

export function authed(req: Request): AuthedRequest {
  return req as unknown as AuthedRequest;
}
