import { Prisma, Role } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { conflict, notFound, unauthorized } from "../../utils/AppError";
import { signAccessToken } from "../../utils/jwt";
import { hashPassword, verifyPassword } from "../../utils/password";
import { serializeUser } from "../../utils/serializers";
import type { LoginInput, RegisterInput } from "./auth.schemas";

/** יצירת משתמשת חדשה עם תפקיד מוגדר (משמש גם ליצירת מעצבת) */
export async function createUserWithRole(input: RegisterInput, role: Role) {
  const passwordHash = await hashPassword(input.password);
  try {
    return await prisma.user.create({
      data: {
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw conflict("כתובת האימייל כבר רשומה במערכת");
    }
    throw err;
  }
}

export async function register(input: RegisterInput) {
  const user = await createUserWithRole(input, Role.CUSTOMER);
  return { token: signAccessToken(user), user: serializeUser(user) };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // אותה הודעה במקרה של אימייל שגוי או סיסמה שגויה - כדי לא לחשוף אילו אימיילים קיימים
  const valid = user ? await verifyPassword(input.password, user.passwordHash) : false;
  if (!user || !valid) {
    throw unauthorized("אימייל או סיסמה שגויים");
  }

  return { token: signAccessToken(user), user: serializeUser(user) };
}

export async function getMe(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw notFound("המשתמשת לא נמצאה");
  }
  return serializeUser(user);
}
