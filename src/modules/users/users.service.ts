import { Prisma, Role } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { notFound } from "../../utils/AppError";
import { serializeOrderSummary, serializeUser } from "../../utils/serializers";
import { createUserWithRole } from "../auth/auth.service";
import type { RegisterInput } from "../auth/auth.schemas";
import type { ListUsersQuery } from "./users.schemas";

export async function listUsers(query: ListUsersQuery) {
  const where: Prisma.UserWhereInput = { role: query.role };

  if (query.search && query.search.length > 0) {
    const search = query.search;
    const digits = search.replace(/[\s-]/g, "");
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      ...(/^\d+$/.test(digits) ? [{ phone: { contains: digits } }] : []),
    ];
  }

  const users = await prisma.user.findMany({
    where,
    include: { _count: { select: { orders: true } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  return users.map((user) => ({ ...serializeUser(user), ordersCount: user._count.orders }));
}

export async function getUser(id: number) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      orders: {
        include: { _count: { select: { items: true } } },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      },
    },
  });
  if (!user) throw notFound("המשתמשת לא נמצאה");

  return {
    ...serializeUser(user),
    ordersCount: user.orders.length,
    orders: user.orders.map(serializeOrderSummary),
  };
}

export async function createAdmin(input: RegisterInput) {
  const user = await createUserWithRole(input, Role.ADMIN);
  return serializeUser(user);
}
