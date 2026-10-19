import { PrismaClient } from "@prisma/client";

/** חיבור יחיד ומשותף למסד הנתונים לכל השרת */
export const prisma = new PrismaClient();
