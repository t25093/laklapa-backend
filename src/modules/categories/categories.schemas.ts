import { z } from "zod";

export const categoryBodySchema = z.object({
  name: z
    .string({ required_error: "שם קטגוריה הוא שדה חובה" })
    .trim()
    .min(2, "שם קטגוריה חייב להכיל לפחות 2 תווים")
    .max(40, "שם קטגוריה יכול להכיל עד 40 תווים"),
});

export type CategoryInput = z.infer<typeof categoryBodySchema>;
