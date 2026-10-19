import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { env } from "../config/env";

export interface TokenPayload {
  sub: string;
  role: Role;
}

export function signAccessToken(user: { id: number; role: Role }): string {
  const payload: TokenPayload = { sub: String(user.id), role: user.role };
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    algorithm: "HS256",
  });
}

/** מחזיר את מזהה המשתמשת מתוך Token תקין, או זורק שגיאה */
export function verifyAccessToken(token: string): number {
  const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
  if (typeof decoded !== "object" || decoded === null || typeof decoded.sub !== "string") {
    throw new Error("Invalid token payload");
  }
  const id = Number(decoded.sub);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid token subject");
  }
  return id;
}
