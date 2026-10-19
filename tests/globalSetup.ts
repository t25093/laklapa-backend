import { execSync } from "node:child_process";
import { TEST_DATABASE_URL } from "./testEnv";

/** לפני כל הבדיקות: מריץ את ה-Migrations על מסד הבדיקות */
export default function setup(): void {
  if (!/test/i.test(TEST_DATABASE_URL)) {
    throw new Error(
      `מסד הבדיקות חייב להכיל "test" בשם, כדי לא למחוק בטעות נתונים אמיתיים. התקבל: ${TEST_DATABASE_URL}`,
    );
  }
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
}
