import { z } from "zod";

export const updateStatusSchema = z.object({
  status: z
    .string()
    .min(1, { error: "Le statut est requis" })
    .refine((value) => ["collected", "delivered", "disputed"].includes(value), {
      message: 'Le statut doit être soit "collected", "delivered" ou "disputed"',
    }),
});