import { z } from "zod";
import { Role } from "@prisma/client";
import { registerSchema } from "../auth/auth.schemas";

export const listUsersQuerySchema = z.object({
  role: z
    .nativeEnum(Role, { errorMap: () => ({ message: "תפקיד לא תקין. אפשרויות: CUSTOMER, ADMIN" }) })
    .default(Role.CUSTOMER),
  search: z.string().trim().max(60, "חיפוש ארוך מדי").optional(),
});

/** יצירת מעצבת חדשה - אותם שדות כמו בהרשמה */
export const createAdminSchema = registerSchema;

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
