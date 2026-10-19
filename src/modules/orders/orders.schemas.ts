import { z } from "zod";
import { DeliveryMethod, FlowerColor, OrderStatus } from "@prisma/client";
import { fullNameSchema, optionalText, phoneSchema } from "../../utils/validation";
import { isValidIsoDate, todayInIsrael } from "../../utils/dates";

const orderItemSchema = z.object({
  productId: z
    .number({ required_error: "מזהה מוצר הוא שדה חובה", invalid_type_error: "מזהה מוצר חייב להיות מספר" })
    .int()
    .positive("מזהה מוצר לא תקין"),
  quantity: z
    .number({ required_error: "כמות היא שדה חובה", invalid_type_error: "כמות חייבת להיות מספר" })
    .int("כמות חייבת להיות מספר שלם")
    .min(1, "כמות מינימלית היא 1")
    .max(20, "כמות מקסימלית היא 20"),
  preferredColor: z.nativeEnum(FlowerColor, {
    errorMap: () => ({ message: "צבע לא תקין. אפשרויות: WHITE, PINK, RED, YELLOW, PURPLE, MIXED" }),
  }),
  notes: optionalText(300, "הערות"),
});

const isoDate = z
  .string({ required_error: "תאריך הוא שדה חובה" })
  .refine(isValidIsoDate, { message: "תאריך לא תקין. פורמט נדרש: YYYY-MM-DD" });

export const createOrderSchema = z
  .object({
    items: z
      .array(orderItemSchema, { required_error: "יש לשלוח לפחות מוצר אחד", invalid_type_error: "items חייב להיות רשימה" })
      .min(1, "ההזמנה חייבת לכלול לפחות מוצר אחד")
      .max(20, "ההזמנה יכולה לכלול עד 20 פריטים"),
    deliveryMethod: z.nativeEnum(DeliveryMethod, {
      errorMap: () => ({ message: "אופן קבלה לא תקין. אפשרויות: DELIVERY, PICKUP" }),
    }),
    deliveryAddress: optionalText(200, "כתובת"),
    recipientName: fullNameSchema,
    recipientPhone: phoneSchema,
    requestedDate: isoDate,
    greetingText: optionalText(300, "נוסח כרטיס ברכה"),
  })
  .superRefine((data, ctx) => {
    if (data.deliveryMethod === DeliveryMethod.DELIVERY && (!data.deliveryAddress || data.deliveryAddress.length < 5)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deliveryAddress"],
        message: "במשלוח חובה למלא כתובת (לפחות 5 תווים)",
      });
    }
    if (isValidIsoDate(data.requestedDate) && data.requestedDate <= todayInIsrael()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["requestedDate"],
        message: "תאריך המסירה חייב להיות מחר או מאוחר יותר",
      });
    }
  });

export const updateStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus, {
    errorMap: () => ({
      message: "סטטוס לא תקין. אפשרויות: RECEIVED, IN_PREPARATION, SHIPPED, DELIVERED, CANCELLED",
    }),
  }),
});

export const adminListQuerySchema = z
  .object({
    status: z
      .nativeEnum(OrderStatus, { errorMap: () => ({ message: "סטטוס לא תקין" }) })
      .optional(),
    from: isoDate.optional(),
    to: isoDate.optional(),
    search: z.string().trim().max(60, "חיפוש ארוך מדי").optional(),
  })
  .refine((data) => !data.from || !data.to || data.from <= data.to, {
    message: "תאריך ההתחלה חייב להיות לפני תאריך הסיום",
    path: ["from"],
  });

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type AdminListQuery = z.infer<typeof adminListQuerySchema>;
