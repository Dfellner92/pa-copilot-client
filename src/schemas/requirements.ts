import { z } from "zod";

export const requirementsSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Code is required")
    .max(10, "Too long")
    .regex(/^[A-Za-z0-9]+$/, "Letters/numbers only"),
});

export type RequirementsInput = z.infer<typeof requirementsSchema>;
