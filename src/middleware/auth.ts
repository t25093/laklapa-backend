import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { prisma } from "../db/prisma";
import { forbidden, unauthorized } from "../utils/AppError";
import { verifyAccessToken } from "../utils/jwt";
import type { AuthUser } from "../types/express";

/** שולף את ה-Token מהכותרת Authorization: Bearer <token> */
function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw unauthorized("פורמט ההרשאה שגוי. יש לשלוח: Authorization: Bearer <token>");
  }
  return token;
}

/** בודק את ה-Token וטוען את המשתמשת ממסד הנתונים */
async function resolveUser(token: string): Promise<AuthUser> {
  let userId: number;
  try {
    userId = verifyAccessToken(token);
  } catch {
    throw unauthorized("ה-Token אינו תקין או שפג תוקפו. יש להתחבר מחדש");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw unauthorized("המשתמשת לא קיימת. יש להתחבר מחדש");
  }

  return { id: user.id, role: user.role, email: user.email, fullName: user.fullName };
}

/** חובה להיות מחוברת. ללא Token תקין מוחזר 401 */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = extractBearerToken(req);
  if (!token) {
    throw unauthorized();
  }
  req.user = await resolveUser(token);
  next();
}

/** התחברות לא חובה: אם נשלח Token הוא נבדק, ואם לא - ממשיכים כאורחת */
export async function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = extractBearerToken(req);
  if (token) {
    req.user = await resolveUser(token);
  }
  next();
}

/** מאפשר גישה רק לתפקידים שצוינו. יש להפעיל אחרי authenticate */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw unauthorized();
    }
    if (!roles.includes(req.user.role)) {
      throw forbidden();
    }
    next();
  };
}

/** מחזיר את המשתמשת המחוברת (לשימוש בתוך Controllers אחרי authenticate) */
export function currentUser(req: Request): AuthUser {
  if (!req.user) {
    throw unauthorized();
  }
  return req.user;
}
