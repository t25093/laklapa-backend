import type { Role } from "@prisma/client";

export interface AuthUser {
  id: number;
  role: Role;
  email: string;
  fullName: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** המשתמשת המחוברת - נקבעת רק לפי ה-Token */
      user?: AuthUser;
    }
  }
}

export {};
