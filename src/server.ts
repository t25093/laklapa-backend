import { env } from "./config/env";
import { createApp } from "./app";
import { prisma } from "./db/prisma";

const app = createApp();

const server = app.listen(env.PORT, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`✅ Laklapa API פועל על פורט ${env.PORT}`);
  // eslint-disable-next-line no-console
  console.log(`   Swagger: http://localhost:${env.PORT}/api-docs`);
});

async function shutdown(signal: string): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(`${signal} התקבל, סוגר את השרת...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
