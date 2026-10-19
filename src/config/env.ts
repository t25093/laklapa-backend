import "dotenv/config";
import { z } from "zod";

/**
 * כל ההגדרות של השרת נקראות ממשתני סביבה ונבדקות כאן פעם אחת.
 * אם משהו חסר או שגוי - השרת לא יעלה, ותוצג הודעה ברורה.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z
    .string({ required_error: "DATABASE_URL חסר" })
    .min(1, "DATABASE_URL חסר")
    .refine((v) => v.startsWith("postgresql://") || v.startsWith("postgres://"), {
      message: "DATABASE_URL חייב להתחיל ב-postgresql://",
    }),
  JWT_SECRET: z
    .string({ required_error: "JWT_SECRET חסר" })
    .min(32, "JWT_SECRET חייב להכיל לפחות 32 תווים"),
  JWT_EXPIRES_IN: z.string().min(1).default("1d"),
  CORS_ORIGINS: z.string().default("*"),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const problems = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  // eslint-disable-next-line no-console
  console.error(`\n❌ הגדרות סביבה שגויות:\n${problems}\n\nבדקי את קובץ .env או את משתני הסביבה בשירות הענן.\n`);
  process.exit(1);
}

export const env = parsed.data;

/** רשימת הכתובות שמורשות לפנות לשרת (CORS). "*" = כל כתובת. */
export const corsOrigins: string[] = env.CORS_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

export const isProduction = env.NODE_ENV === "production";
