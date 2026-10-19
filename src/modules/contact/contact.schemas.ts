import { z } from "zod";
import { booleanQuery, emailSchema, fullNameSchema, phoneSchema } from "../../utils/validation";

export const createContactSchema = z.object({
  name: fullNameSchema,
  email: emailSchema,
  phone: z
    .union([phoneSchema, z.literal(""), z.null()])
    .optional()
    .transform((value) => (value ? value : null)),
  subject: z
    .string({ required_error: "נושא הוא שדה חובה" })
    .trim()
    .min(2, "נושא חייב להכיל לפחות 2 תווים")
    .max(100, "נושא יכול להכיל עד 100 תווים"),
  message: z
    .string({ required_error: "הודעה היא שדה חובה" })
    .trim()
    .min(5, "הודעה חייבת להכיל לפחות 5 תווים")
    .max(2000, "הודעה יכולה להכיל עד 2000 תווים"),
});

export const listContactQuerySchema = z.object({
  isHandled: booleanQuery.optional(),
});

export const updateContactSchema = z.object({
  isHandled: z.boolean({
    required_error: "isHandled הוא שדה חובה",
    invalid_type_error: "isHandled חייב להיות true או false",
  }),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
