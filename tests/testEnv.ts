/**
 * הגדרות לסביבת הבדיקות.
 * הבדיקות רצות מול מסד PostgreSQL אמיתי ונפרד (לא מסד הפיתוח!),
 * כי כל בדיקה מוחקת את כל הנתונים לפני שהיא רצה.
 *
 * אפשר לשנות את הכתובת עם משתנה הסביבה TEST_DATABASE_URL.
 */
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/laklapa_test";

export const testEnv = {
  NODE_ENV: "test",
  DATABASE_URL: TEST_DATABASE_URL,
  JWT_SECRET: "test-secret-that-is-long-enough-for-hs256-signing-1234",
  JWT_EXPIRES_IN: "1h",
  CORS_ORIGINS: "*",
  BCRYPT_ROUNDS: "4",
};
