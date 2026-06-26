import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(1, { error: "Le nom est requis" }).max(255),
    last_name: z
      .string()
      .min(1, { error: "Le nom de famille est requis" })
      .max(255),
    email: z
      .string()
      .min(1, { error: "L'email est requis" })
      .email({ message: "L'email n'est pas valide" })
      .max(255),
    phone: z
      .string()
      .min(1, { error: "Le numero de telephone est requis" })
      .max(20),
    role: z.enum(["producer", "transporter", "buyer"], {
      error: 'Le role doit etre soit "producer", "transporter" ou "buyer"',
    }),
    password: z
      .string()
      .min(1, { error: "Le mot de passe est requis" })
      .min(6, { error: "Le mot de passe doit contenir au moins 6 caracteres" }),
    confirmPassword: z
      .string()
      .min(1, { error: "La confirmation du mot de passe est requise" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les mots de passe ne correspondent pas",
  });

export type RegisterInput = z.infer<typeof registerSchema>;