import type {
  Category,
  ContactMessage,
  Order,
  OrderItem,
  Prisma,
  Product,
  User,
} from "@prisma/client";
import { dbDateToIso } from "./dates";

/**
 * פונקציות שממירות רשומות ממסד הנתונים לתשובות JSON.
 * כאן מוודאים שסיסמאות לא נחשפות ושמחירים מוחזרים כמספרים.
 */

const money = (value: Prisma.Decimal): number => Number(value.toFixed(2));

export function serializeUser(user: User) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

export function serializeCategory(category: Category) {
  return {
    id: category.id,
    name: category.name,
    createdAt: category.createdAt.toISOString(),
  };
}

export function serializeProduct(product: Product & { category: Category }) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: money(product.price),
    imageUrl: product.imageUrl,
    isActive: product.isActive,
    category: { id: product.category.id, name: product.category.name },
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

type OrderItemWithProduct = OrderItem & { product: Pick<Product, "id" | "name" | "imageUrl"> };

export function serializeOrderItem(item: OrderItemWithProduct) {
  const unitPrice = money(item.unitPrice);
  return {
    id: item.id,
    product: { id: item.product.id, name: item.product.name, imageUrl: item.product.imageUrl },
    quantity: item.quantity,
    preferredColor: item.preferredColor,
    notes: item.notes,
    unitPrice,
    lineTotal: Number((unitPrice * item.quantity).toFixed(2)),
  };
}

export function serializeOrderSummary(order: Order & { _count: { items: number } }) {
  return {
    id: order.id,
    status: order.status,
    deliveryMethod: order.deliveryMethod,
    recipientName: order.recipientName,
    requestedDate: dbDateToIso(order.requestedDate),
    totalAmount: money(order.totalAmount),
    itemsCount: order._count.items,
    createdAt: order.createdAt.toISOString(),
  };
}

export function serializeOrder(
  order: Order & { items: OrderItemWithProduct[]; user?: User },
) {
  return {
    id: order.id,
    status: order.status,
    deliveryMethod: order.deliveryMethod,
    deliveryAddress: order.deliveryAddress,
    recipientName: order.recipientName,
    recipientPhone: order.recipientPhone,
    requestedDate: dbDateToIso(order.requestedDate),
    greetingText: order.greetingText,
    totalAmount: money(order.totalAmount),
    items: order.items.map(serializeOrderItem),
    ...(order.user
      ? {
          customer: {
            id: order.user.id,
            fullName: order.user.fullName,
            email: order.user.email,
            phone: order.user.phone,
          },
        }
      : {}),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export function serializeContactMessage(message: ContactMessage) {
  return {
    id: message.id,
    userId: message.userId,
    name: message.name,
    email: message.email,
    phone: message.phone,
    subject: message.subject,
    message: message.message,
    isHandled: message.isHandled,
    createdAt: message.createdAt.toISOString(),
  };
}
