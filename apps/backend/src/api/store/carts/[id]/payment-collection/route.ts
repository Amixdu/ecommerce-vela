import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  Modules,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils";
import type { IPaymentModuleService } from "@medusajs/framework/types";

// DELETE /store/carts/:id/payment-collection
// Removes the payment collection (and all its sessions) from the DB without
// calling Stripe, so that the cart can be modified freely.  The abandoned
// Stripe PaymentIntents expire automatically.
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id: cartId } = req.params;
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY);

  const [relation] = await remoteQuery(
    remoteQueryObjectFromString({
      entryPoint: "cart_payment_collection",
      variables: { filters: { cart_id: cartId } },
      fields: [
        "payment_collection.id",
        "payment_collection.payment_sessions.id",
      ],
    })
  );

  const collection = relation?.payment_collection;
  if (!collection) {
    return res.status(200).json({ deleted: false });
  }

  const paymentService: IPaymentModuleService = req.scope.resolve(
    Modules.PAYMENT
  );

  // Soft-delete at the DB level — skips the Stripe cancel API call so that
  // a stale or already-captured PI doesn't block cart item removal.
  await paymentService.softDeletePaymentCollections([collection.id]);

  res.status(200).json({ deleted: true });
}
