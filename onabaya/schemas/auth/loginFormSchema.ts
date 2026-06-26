import { z } from "zod";

export const loginSchema = z.object({
  phone: z.string().min(1, {
    message: "Le numero de telephone est requis",
  }),
  password: z.string().min(1, {
    message: "Le mot de passe est requis",
  }),
});

export type LoginInput = z.infer<typeof loginSchema>;