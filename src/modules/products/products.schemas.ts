import { z } from "zod";
import { booleanQuery } from "../../utils/validation";

const nameSchema = z
  .string({ required_error: "שם המוצר הוא שדה חובה" })
  .trim()
  .min(2, "שם המוצר חייב להכיל לפחות 2 תווים")
  .max(80, "שם המוצר יכול להכיל עד 80 תווים");

const descriptionSchema = z
  .string({ required_error: "תיאור הוא שדה חובה" })
  .trim()
  .min(10, "תיאור חייב להכיל לפחות 10 תווים")
  .max(1000, "תיאור יכול להכיל עד 1000 תווים");

const priceSchema = z
  .number({ required_error: "מחיר הוא שדה חובה", invalid_type_error: "מחיר חייב להיות מספר" })
  .positive("מחיר חייב להיות גדול מ-0")
  .max(99999999, "מחיר גבוה מדי")
  .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, {
    message: "מחיר יכול לכלול עד 2 ספרות אחרי הנקודה",
  });

const imageUrlSchema = z
  .string({ required_error: "קישור לתמונה הוא שדה חובה" })
  .trim()
  .max(500, "קישור לתמונה ארוך מדי")
  .url("קישור לתמונה אינו תקין")
  .refine((value) => value.startsWith("https://") || value.startsWith("http://"), {
    message: "קישור לתמונה חייב להתחיל ב-https://",
  });

const categoryIdSchema = z
  .number({ required_error: "קטגוריה היא שדה חובה", invalid_type_error: "מזהה קטגוריה חייב להיות מספר" })
  .int("מזהה קטגוריה חייב להיות מספר שלם")
  .positive("מזהה קטגוריה לא תקין");

export const createProductSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  price: priceSchema,
  imageUrl: imageUrlSchema,
  categoryId: categoryIdSchema,
  isActive: z.boolean({ invalid_type_error: "isActive חייב להיות true או false" }).default(true),
});

/** בעריכה אפשר לשלוח רק את השדות שמשתנים, אבל לפחות אחד */
export const updateProductSchema = z
  .object({
    name: nameSchema.optional(),
    description: descriptionSchema.optional(),
    price: priceSchema.optional(),
    imageUrl: imageUrlSchema.optional(),
    categoryId: categoryIdSchema.optional(),
    isActive: z.boolean({ invalid_type_error: "isActive חייב להיות true או false" }).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "יש לשלוח לפחות שדה אחד לעדכון",
  });

export const listProductsQuerySchema = z.object({
  categoryId: z.coerce
    .number({ invalid_type_error: "categoryId חייב להיות מספר" })
    .int()
    .positive("categoryId לא תקין")
    .optional(),
  includeInactive: booleanQuery.optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
