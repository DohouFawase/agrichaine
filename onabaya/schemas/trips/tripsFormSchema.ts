import { z } from "zod";

export const storeTripSchema = z.object({
  departure_city: z.string().min(1, { error: "La ville de départ est requise" }).max(100),
  destination_city: z
    .string()
    .min(1, { error: "La ville de destination est requise" })
    .max(100),
  available_weight: z
    .coerce.number({ error: "Le poids disponible doit être un nombre" })
    .int({ message: "Le poids disponible doit être un entier" })
    .min(1, { error: "Le poids disponible doit être au moins de 1 kg ou sac" }),
  departure_date: z.coerce
    .date({ error: "La date de départ doit être une date valide" })
    .refine((date) => date > new Date(), {
      message: "La date de départ doit être dans le futur",
    }),
});

export type StoreTripInput = z.infer<typeof storeTripSchema>;