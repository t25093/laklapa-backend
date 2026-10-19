import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import request from "supertest";
import { Prisma, Role, type Category, type Product, type User } from "@prisma/client";
import { createApp } from "../src/app";
import { prisma } from "../src/db/prisma";
import { signAccessToken } from "../src/utils/jwt";
import { addDays, todayInIsrael } from "../src/utils/dates";
import { testEnv } from "./testEnv";

export const app = createApp();
export const api = () => request(app);
export { prisma };

export const PASSWORD = "Password123";

/** מוחק את כל הנתונים ומאפס את המונים */
export async function resetDb(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "order_items", "orders", "contact_messages", "products", "categories", "users" RESTART IDENTITY CASCADE',
  );
}

export async function createUser(
  role: Role,
  overrides: Partial<{ fullName: string; email: string; phone: string }> = {},
): Promise<User> {
  const unique = Math.random().toString(36).slice(2, 8);
  return prisma.user.create({
    data: {
      fullName: overrides.fullName ?? (role === Role.ADMIN ? "מעצבת בדיקה" : "לקוחה בדיקה"),
      email: overrides.email ?? `${role.toLowerCase()}-${unique}@test.local`,
      phone: overrides.phone ?? "0501234567",
      role,
      passwordHash: await bcrypt.hash(PASSWORD, 4),
    },
  });
}

export const tokenFor = (user: User): string => signAccessToken(user);
export const auth = (user: User): [string, string] => ["Authorization", `Bearer ${tokenFor(user)}`];

export function expiredTokenFor(user: User): string {
  const oneMinuteAgo = Math.floor(Date.now() / 1000) - 60;
  return jwt.sign(
    { sub: String(user.id), role: user.role, iat: oneMinuteAgo - 60, exp: oneMinuteAgo },
    testEnv.JWT_SECRET,
    { algorithm: "HS256" },
  );
}

export async function createCategory(name = "זרים"): Promise<Category> {
  return prisma.category.create({ data: { name } });
}

export async function createProduct(
  categoryId: number,
  overrides: Partial<{ name: string; price: number; isActive: boolean }> = {},
): Promise<Product> {
  return prisma.product.create({
    data: {
      name: overrides.name ?? "זר בדיקה",
      description: "תיאור מוצר לבדיקה אוטומטית",
      price: new Prisma.Decimal(overrides.price ?? 100),
      imageUrl: "https://placehold.co/600x400?text=Test",
      categoryId,
      isActive: overrides.isActive ?? true,
    },
  });
}

export const tomorrow = (): string => addDays(todayInIsrael(), 1);
export const today = (): string => todayInIsrael();

export function orderBody(productId: number, overrides: Record<string, unknown> = {}) {
  return {
    items: [{ productId, quantity: 2, preferredColor: "PINK", notes: "בלי חבצלות" }],
    deliveryMethod: "DELIVERY",
    deliveryAddress: "רחוב הפרחים 12, תל אביב",
    recipientName: "שרה לוי",
    recipientPhone: "052-7654321",
    requestedDate: addDays(todayInIsrael(), 3),
    greetingText: "מזל טוב!",
    ...overrides,
  };
}
