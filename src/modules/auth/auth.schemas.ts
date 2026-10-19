import { z } from "zod";
import { emailSchema, fullNameSchema, passwordSchema, phoneSchema } from "../../utils/validation";

/** הרשמה - יוצרת תמיד לקוחה. שדה role, אם נשלח, מתעלמים ממנו */
export const registerSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ required_error: "סיסמה היא שדה חובה" }).min(1, "סיסמה היא שדה חובה"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
