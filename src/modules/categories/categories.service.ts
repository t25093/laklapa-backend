import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { conflict, notFound } from "../../utils/AppError";
import { serializeCategory } from "../../utils/serializers";
import type { CategoryInput } from "./categories.schemas";

function handleUniqueName(err: unknown): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    throw conflict("קטגוריה בשם זה כבר קיימת");
  }
  throw err;
}

export async function listCategories() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return categories.map(serializeCategory);
}

export async function createCategory(input: CategoryInput) {
  try {
    const category = await prisma.category.create({ data: { name: input.name } });
    return serializeCategory(category);
  } catch (err) {
    return handleUniqueName(err);
  }
}

export async function updateCategory(id: number, input: CategoryInput) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw notFound("הקטגוריה לא נמצאה");
  try {
    const category = await prisma.category.update({ where: { id }, data: { name: input.name } });
    return serializeCategory(category);
  } catch (err) {
    return handleUniqueName(err);
  }
}

export async function deleteCategory(id: number) {
  const existing = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!existing) throw notFound("הקטגוריה לא נמצאה");
  if (existing._count.products > 0) {
    throw conflict("לא ניתן למחוק קטגוריה שיש בה מוצרים. יש להעביר את המוצרים לקטגוריה אחרת קודם");
  }
  await prisma.category.delete({ where: { id } });
}
