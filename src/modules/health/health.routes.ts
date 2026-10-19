import { Router } from "express";
import { prisma } from "../../db/prisma";

export const healthRouter = Router();

/** בדיקת תקינות: השרת פועל והחיבור למסד הנתונים תקין */
healthRouter.get("/", async (_req, res) => {
  const timestamp = new Date().toISOString();
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected", timestamp });
  } catch {
    res.status(503).json({ status: "error", database: "disconnected", timestamp });
  }
});
