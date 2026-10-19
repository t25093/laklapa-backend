import { DeliveryMethod, OrderStatus, Prisma, Role } from "@prisma/client";
import { prisma } from "../../db/prisma";
import type { AuthUser } from "../../types/express";
import { badRequest, conflict, notFound } from "../../utils/AppError";
import { isoDateToDb } from "../../utils/dates";
import { serializeOrder, serializeOrderSummary } from "../../utils/serializers";
import type { AdminListQuery, CreateOrderInput } from "./orders.schemas";

const itemsInclude = {
  items: {
    include: { product: { select: { id: true, name: true, imageUrl: true } } },
    orderBy: { id: "asc" },
  },
} satisfies Prisma.OrderInclude;

/** סטטוסים סופיים - אחריהם אי אפשר לשנות את ההזמנה */
const FINAL_STATUSES: OrderStatus[] = [OrderStatus.DELIVERED, OrderStatus.CANCELLED];

/**
 * יצירת הזמנה.
 * המחירים והסכום הכולל מחושבים כאן בשרת לפי המחירים במסד הנתונים,
 * כך שלקוחה לא יכולה לשנות אותם.
 */
export async function createOrder(userId: number, input: CreateOrderInput) {
  const productIds = [...new Set(input.items.map((item) => item.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  });
  const productsById = new Map(products.map((product) => [product.id, product]));

  const unavailable = input.items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !productsById.has(item.productId));
  if (unavailable.length > 0) {
    throw badRequest(
      "חלק מהמוצרים בסל אינם זמינים יותר",
      unavailable.map(({ item, index }) => ({
        field: `items.${index}.productId`,
        message: `המוצר ${item.productId} לא קיים או אינו זמין`,
      })),
    );
  }

  let total = new Prisma.Decimal(0);
  const itemsData = input.items.map((item) => {
    const product = productsById.get(item.productId)!;
    total = total.plus(product.price.times(item.quantity));
    return {
      productId: item.productId,
      quantity: item.quantity,
      preferredColor: item.preferredColor,
      notes: item.notes,
      unitPrice: product.price,
    };
  });

  const order = await prisma.order.create({
    data: {
      userId,
      deliveryMethod: input.deliveryMethod,
      deliveryAddress: input.deliveryMethod === DeliveryMethod.DELIVERY ? input.deliveryAddress : null,
      recipientName: input.recipientName,
      recipientPhone: input.recipientPhone,
      requestedDate: isoDateToDb(input.requestedDate),
      greetingText: input.greetingText,
      totalAmount: total,
      items: { create: itemsData },
    },
    include: itemsInclude,
  });

  return serializeOrder(order);
}

export async function listMyOrders(userId: number) {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: { _count: { select: { items: true } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  return orders.map(serializeOrderSummary);
}

/** לקוחה יכולה לראות רק הזמנה שלה. הזמנה של אחרת מחזירה 404 כדי לא לחשוף שהיא קיימת */
export async function getOrder(id: number, user: AuthUser) {
  const isAdmin = user.role === Role.ADMIN;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { ...itemsInclude, user: isAdmin },
  });
  if (!order || (!isAdmin && order.userId !== user.id)) {
    throw notFound("ההזמנה לא נמצאה");
  }
  return serializeOrder(order);
}

export async function cancelMyOrder(id: number, userId: number) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.userId !== userId) {
    throw notFound("ההזמנה לא נמצאה");
  }
  if (order.status !== OrderStatus.RECEIVED) {
    throw conflict("אפשר לבטל הזמנה רק לפני שהמעצבת התחילה להכין אותה");
  }

  // עדכון מותנה - מונע מצב שבו המעצבת שינתה סטטוס בדיוק באותו רגע
  const result = await prisma.order.updateMany({
    where: { id, userId, status: OrderStatus.RECEIVED },
    data: { status: OrderStatus.CANCELLED },
  });
  if (result.count === 0) {
    throw conflict("אפשר לבטל הזמנה רק לפני שהמעצבת התחילה להכין אותה");
  }

  const updated = await prisma.order.findUniqueOrThrow({ where: { id }, include: itemsInclude });
  return serializeOrder(updated);
}

export async function listAllOrders(query: AdminListQuery) {
  const where: Prisma.OrderWhereInput = {};

  if (query.status) {
    where.status = query.status;
  }

  if (query.from || query.to) {
    where.requestedDate = {
      ...(query.from ? { gte: isoDateToDb(query.from) } : {}),
      ...(query.to ? { lte: isoDateToDb(query.to) } : {}),
    };
  }

  if (query.search && query.search.length > 0) {
    const search = query.search.replace(/^#/, "");
    const asNumber = /^\d+$/.test(search) ? Number(search) : null;
    where.OR = [
      { recipientName: { contains: search, mode: "insensitive" } },
      ...(asNumber !== null && asNumber <= 2147483647 ? [{ id: asNumber }] : []),
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      _count: { select: { items: true } },
      user: { select: { id: true, fullName: true } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  return orders.map((order) => ({
    ...serializeOrderSummary(order),
    customer: { id: order.user.id, fullName: order.user.fullName },
  }));
}

export async function updateOrderStatus(id: number, status: OrderStatus) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw notFound("ההזמנה לא נמצאה");

  if (FINAL_STATUSES.includes(order.status) && order.status !== status) {
    throw conflict("לא ניתן לשנות הזמנה שכבר נמסרה או בוטלה");
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status },
    include: { ...itemsInclude, user: true },
  });
  return serializeOrder(updated);
}
