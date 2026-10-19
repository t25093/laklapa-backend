import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { badRequest, notFound } from "../../utils/AppError";
import { serializeProduct } from "../../utils/serializers";
import type { CreateProductInput, ListProductsQuery, UpdateProductInput } from "./products.schemas";

async function ensureCategoryExists(categoryId: number): Promise<void> {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    throw badRequest("הקטגוריה שנבחרה לא קיימת", [{ field: "categoryId", message: "הקטגוריה לא קיימת" }]);
  }
}

/**
 * רשימת מוצרים.
 * לקוחות ואורחות רואות רק מוצרים זמינים. מעצבת יכולה לבקש גם מוסתרים.
 */
export async function listProducts(query: ListProductsQuery, isAdmin: boolean) {
  const where: Prisma.ProductWhereInput = {};
  if (!(isAdmin && query.includeInactive === true)) {
    where.isActive = true;
  }
  if (query.categoryId !== undefined) {
    where.categoryId = query.categoryId;
  }

  const products = await prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  return products.map(serializeProduct);
}

export async function getProduct(id: number, isAdmin: boolean) {
  const product = await prisma.product.findUnique({ where: { id }, include: { category: true } });
  if (!product || (!product.isActive && !isAdmin)) {
    throw notFound("המוצר לא נמצא");
  }
  return serializeProduct(product);
}

export async function createProduct(input: CreateProductInput) {
  await ensureCategoryExists(input.categoryId);
  const product = await prisma.product.create({
    data: {
      name: input.name,
      description: input.description,
      price: new Prisma.Decimal(input.price.toFixed(2)),
      imageUrl: input.imageUrl,
      categoryId: input.categoryId,
      isActive: input.isActive,
    },
    include: { category: true },
  });
  return serializeProduct(product);
}

export async function updateProduct(id: number, input: UpdateProductInput) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw notFound("המוצר לא נמצא");
  if (input.categoryId !== undefined) {
    await ensureCategoryExists(input.categoryId);
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.price !== undefined ? { price: new Prisma.Decimal(input.price.toFixed(2)) } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
    include: { category: true },
  });
  return serializeProduct(product);
}
