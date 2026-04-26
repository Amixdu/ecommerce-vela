import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { getOrdersListWorkflow } from "@medusajs/core-flows";
import { createClerkClient } from "@clerk/backend";

type AuthedRequest = MedusaRequest & { clerkUserId: string };

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

// GET /store/orders
// Protected by requireClerkAuth middleware (middlewares.ts).
// Verifies the Clerk JWT server-side, fetches the user's email from Clerk
// (never trusts client-sent data), then queries orders by that email.
// Uses getOrdersListWorkflow so computed fields like `total` are populated.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { clerkUserId } = req as AuthedRequest;

  const clerkUser = await clerk.users.getUser(clerkUserId);
  const email = clerkUser.primaryEmailAddress?.emailAddress;

  if (!email) {
    return res.status(200).json({ orders: [], count: 0, offset: 0, limit: 20 });
  }

  const { result } = await getOrdersListWorkflow(req.scope).run({
    input: {
      fields: [
        "id",
        "display_id",
        "status",
        "email",
        "currency_code",
        "total",
        "created_at",
        "updated_at",
      ],
      variables: {
        filters: { email },
        order: { created_at: "DESC" },
        skip: 0,
        take: 20,
      },
    },
  });

  type OrderRow = {
    id: string;
    display_id: number;
    status: string;
    email: string;
    currency_code: string;
    total: number;
    created_at: string;
    updated_at: string;
  };

  const rows = ((result as { rows?: OrderRow[] }).rows ??
    (result as unknown as OrderRow[])) as OrderRow[];

  const orders = rows.map((o) => ({
    id: o.id,
    displayId: o.display_id,
    status: o.status,
    email: o.email,
    currency: o.currency_code,
    total: typeof o.total === "number" ? o.total : Number(o.total) || 0,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
  }));

  return res.status(200).json({
    orders,
    count: orders.length,
    offset: 0,
    limit: 20,
  });
}
