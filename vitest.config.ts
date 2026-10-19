import { defineConfig } from "vitest/config";
import { testEnv } from "./tests/testEnv";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["./tests/globalSetup.ts"],
    env: testEnv,
    // כל קבצי הבדיקה משתמשים באותו מסד נתונים - מריצים אותם אחד אחרי השני
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 60000,
  },
});
