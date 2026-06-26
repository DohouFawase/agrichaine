import { z } from "zod";

async function productExists(productId: string) {
  return true;
}

async function paymentReferenceExists(paymentReference: string) {
  return false;
}

export const storeOrderSchema = z
  .object({
    product_id: z.string().uuid({
      message: "L'ID du produit doit être un UUID valide",
    }),
    quantity_ordered: z
      .coerce.number({
        error: "La quantité commandée doit être un nombre",
      })
      .min(0.1, { error: "La quantité commandée doit être au moins de 0.1" }),
    payment_reference: z
      .string()
      .min(1, { error: "La référence de paiement est requise" }),
  })
  .superRefine(async (data, ctx) => {
    const exists = await productExists(data.product_id);
    if (!exists) {
      ctx.addIssue({
        code: "custom",
        path: ["product_id"],
        message: "Le produit sélectionné n'existe pas",
      });
    }

    const taken = await paymentReferenceExists(data.payment_reference);
    if (taken) {
      ctx.addIssue({
        code: "custom",
        path: ["payment_reference"],
        message: "La référence de paiement est déjà utilisée",
      });
    }
  });

export type StoreOrderInput = z.infer<typeof storeOrderSchema>;



export const validateCollectionSchema = z.object({
  scanned_code: z.string().min(1, { error: "Le code scanné est requis" }),
  quantity_collected: z
    .coerce.number({ error: "La quantité collectée doit être un nombre" })
    .int({ message: "La quantité collectée doit être un entier" })
    .min(0, { error: "La quantité collectée doit être au moins de 0" }),
});

export type ValidateCollectionInput = z.infer<typeof validateCollectionSchema>;



export const rateProducerSchema = z.object({
  rating: z
    .coerce.number({ error: "La note est requise" })
    .int({ message: "La note doit être un entier" })
    .min(1, { error: "La note doit être au moins de 1" })
    .max(5, { error: "La note doit être au plus de 5" }),
  comment: z
    .string()
    .max(500, { error: "Le commentaire ne doit pas dépasser 500 caractères" })
    .optional()
    .or(z.literal("")),
});

export type RateProducerInput = z.infer<typeof rateProducerSchema>