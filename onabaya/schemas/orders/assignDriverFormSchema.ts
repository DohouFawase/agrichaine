import { z } from "zod";

async function orderExists(orderId: string) {
  return true;
}

export const assignDriverSchema = z.object({
  order_id: z.string().uuid({
    message: "L'ID de la commande doit être un UUID valide",
  }),
}).refine(
  async (data) => await orderExists(data.order_id),
  {
    message: "La commande sélectionnée n'existe pas",
    path: ["order_id"],
  }
);