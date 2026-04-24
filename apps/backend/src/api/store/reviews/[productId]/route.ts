import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { eq, avg, count } from "drizzle-orm";
import { db, productReviews, customers } from "../../../../db";

type AuthedRequest = MedusaRequest & { clerkUserId?: string };

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { productId } = req.params;

  const reviews = await db.query.productReviews.findMany({
    where: eq(productReviews.productId, productId),
    orderBy: (r, { desc }) => [desc(r.createdAt)],
  });

  const [stats] = await db
    .select({
      averageRating: avg(productReviews.rating),
      reviewCount: count(productReviews.id),
    })
    .from(productReviews)
    .where(eq(productReviews.productId, productId));

  return res.json({ reviews, stats });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const authedReq = req as AuthedRequest;
  const { productId } = req.params;
  const { rating, title, body } = req.body as {
    rating: number;
    title?: string;
    body?: string;
  };

  if (!authedReq.clerkUserId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (rating < 1 || rating > 5) {
    return res.status(422).json({ message: "Rating must be between 1 and 5" });
  }

  const customer = await db.query.customers.findFirst({
    where: eq(customers.clerkId, authedReq.clerkUserId),
  });

  if (!customer) {
    return res.status(404).json({ message: "Customer not found" });
  }

  const [review] = await db
    .insert(productReviews)
    .values({
      id: crypto.randomUUID(),
      productId,
      customerId: customer.id,
      rating,
      title,
      body,
    })
    .returning();

  return res.status(201).json({ review });
}
