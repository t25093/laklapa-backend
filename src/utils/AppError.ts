/**
 * שגיאה "מתוכננת" עם קוד HTTP והודעה בעברית.
 * כל שגיאה כזו מגיעה ל-errorHandler ומוחזרת ללקוח בפורמט אחיד.
 */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const badRequest = (message: string, details?: Array<{ field: string; message: string }>) =>
  new AppError(400, "VALIDATION_ERROR", message, details);

export const unauthorized = (message = "יש להתחבר כדי לבצע פעולה זו") =>
  new AppError(401, "UNAUTHORIZED", message);

export const forbidden = (message = "אין לך הרשאה לבצע פעולה זו") =>
  new AppError(403, "FORBIDDEN", message);

export const notFound = (message = "הפריט המבוקש לא נמצא") => new AppError(404, "NOT_FOUND", message);

export const conflict = (message: string) => new AppError(409, "CONFLICT", message);
