import { z } from "zod";

/** מזהה מספרי בכתובת, למשל /products/5 */
export const idParamSchema = z.object({
  id: z.coerce
    .number({ invalid_type_error: "מזהה חייב להיות מספר" })
    .int("מזהה חייב להיות מספר שלם")
    .positive("מזהה חייב להיות מספר חיובי"),
});

/** טלפון ישראלי: 9-10 ספרות שמתחילות ב-0. מקפים ורווחים מוסרים אוטומטית. */
export const phoneSchema = z
  .string({ required_error: "טלפון הוא שדה חובה" })
  .trim()
  .transform((value) => value.replace(/[\s-]/g, ""))
  .refine((value) => /^0\d{8,9}$/.test(value), { message: "מספר טלפון לא תקין (לדוגמה 050-1234567)" });

export const emailSchema = z
  .string({ required_error: "אימייל הוא שדה חובה" })
  .trim()
  .toLowerCase()
  .max(254, "אימייל ארוך מדי")
  .email("כתובת אימייל לא תקינה");

export const passwordSchema = z
  .string({ required_error: "סיסמה היא שדה חובה" })
  .min(8, "סיסמה חייבת להכיל לפחות 8 תווים")
  .max(72, "סיסמה ארוכה מדי")
  .refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), {
    message: "סיסמה חייבת להכיל לפחות אות אחת באנגלית וספרה אחת",
  });

export const fullNameSchema = z
  .string({ required_error: "שם מלא הוא שדה חובה" })
  .trim()
  .min(2, "שם מלא חייב להכיל לפחות 2 תווים")
  .max(60, "שם מלא יכול להכיל עד 60 תווים");

/** שדה טקסט אופציונלי: מחרוזת ריקה נחשבת כ"לא נשלח" */
export const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} יכול להכיל עד ${max} תווים`)
    .optional()
    .nullable()
    .transform((value) => (value && value.length > 0 ? value : null));

/** ערך בוליאני שמגיע מכתובת (query string): "true" / "false" */
export const booleanQuery = z
  .enum(["true", "false"], { errorMap: () => ({ message: "הערך חייב להיות true או false" }) })
  .transform((value) => value === "true");
