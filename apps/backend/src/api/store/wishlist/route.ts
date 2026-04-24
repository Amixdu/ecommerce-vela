import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { eq, and } from "drizzle-orm";
import { db, wishlists, customers } from "../../../db";

type AuthedRequest = MedusaRequest & { clerkUserId: string };

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const authedReq = req as AuthedRequest;
  const customer = await db.query.customers.findFirst({
    where: eq(customers.clerkId, authedReq.clerkUserId),
  });

  if (!customer) {
    return res.json({ wishlists: [] });
  }

  const items = await db.query.wishlists.findMany({
    where: eq(wishlists.customerId, customer.id),
  });

  return res.json({ wishlists: items });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const authedReq = req as AuthedRequest;
  const { productId, variantId } = req.body as {
    productId: string;
    variantId?: string;
  };

  const customer = await db.query.customers.findFirst({
    where: eq(customers.clerkId, authedReq.clerkUserId),
  });

  if (!customer) {
    return res.status(404).json({ message: "Customer not found" });
  }

  const existing = await db.query.wishlists.findFirst({
    where: and(
      eq(wishlists.customerId, customer.id),
      eq(wishlists.productId, productId)
    ),
  });

  if (existing) {
    return res.status(409).json({ message: "Already in wishlist" });
  }

  const [item] = await db
    .insert(wishlists)
    .values({
      id: crypto.randomUUID(),
      customerId: customer.id,
      productId,
      variantId,
    })
    .returning();

  return res.status(201).json({ wishlist: item });
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const authedReq = req as AuthedRequest;
  const { productId } = req.body as { productId: string };

  const customer = await db.query.customers.findFirst({
    where: eq(customers.clerkId, authedReq.clerkUserId),
  });

  if (!customer) {
    return res.status(404).json({ message: "Customer not found" });
  }

  await db
    .delete(wishlists)
    .where(
      and(
        eq(wishlists.customerId, customer.id),
        eq(wishlists.productId, productId)
      )
    );

  return res.status(204).send("");
}
