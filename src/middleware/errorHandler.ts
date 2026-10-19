import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";
import { isProduction } from "../config/env";

interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

function send(res: Response, status: number, body: ErrorBody): void {
  res.status(status).json(body);
}

/** כתובת שלא קיימת */
export function notFoundHandler(req: Request, res: Response): void {
  send(res, 404, {
    error: { code: "NOT_FOUND", message: `הכתובת ${req.method} ${req.originalUrl} לא קיימת` },
  });
}

/** טיפול מרכזי בכל השגיאות - תמיד מחזיר JSON בפורמט אחיד */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    send(res, err.status, {
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
    });
    return;
  }

  if (err instanceof ZodError) {
    send(res, 400, {
      error: {
        code: "VALIDATION_ERROR",
        message: "הנתונים שנשלחו אינם תקינים",
        details: err.issues.map((issue) => ({
          field: issue.path.join(".") || "(body)",
          message: issue.message,
        })),
      },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      send(res, 409, { error: { code: "CONFLICT", message: "קיימת כבר רשומה עם ערך זהה" } });
      return;
    }
    if (err.code === "P2025") {
      send(res, 404, { error: { code: "NOT_FOUND", message: "הפריט המבוקש לא נמצא" } });
      return;
    }
    if (err.code === "P2003") {
      send(res, 409, { error: { code: "CONFLICT", message: "הפעולה נחסמה כי הרשומה קשורה לרשומות אחרות" } });
      return;
    }
  }

  // JSON שבור בגוף הבקשה
  if (
    typeof err === "object" &&
    err !== null &&
    "type" in err &&
    (err as { type?: string }).type === "entity.parse.failed"
  ) {
    send(res, 400, { error: { code: "INVALID_JSON", message: "גוף הבקשה אינו JSON תקין" } });
    return;
  }

  if (
    typeof err === "object" &&
    err !== null &&
    "type" in err &&
    (err as { type?: string }).type === "entity.too.large"
  ) {
    send(res, 413, { error: { code: "PAYLOAD_TOO_LARGE", message: "גוף הבקשה גדול מדי" } });
    return;
  }

  // eslint-disable-next-line no-console
  console.error("Unexpected error:", err);
  send(res, 500, {
    error: {
      code: "INTERNAL_ERROR",
      message: isProduction
        ? "אירעה שגיאה בשרת. נסי שוב מאוחר יותר"
        : `אירעה שגיאה בשרת: ${err instanceof Error ? err.message : String(err)}`,
    },
  });
}
