import { defineMiddlewares } from "@medusajs/medusa";
import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { verifyToken } from "@clerk/backend";

export async function requireClerkAuth(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing authorization header" });
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });
    (req as MedusaRequest & { clerkUserId: string }).clerkUserId = payload.sub;
    next();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[requireClerkAuth] token verification failed:", message);
    return res.status(401).json({ message: "Invalid or expired token", detail: message });
  }
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/orders/mine",
      middlewares: [requireClerkAuth],
    },
    {
      matcher: "/store/wishlist*",
      middlewares: [requireClerkAuth],
    },
    {
      matcher: "/store/reviews*",
      method: ["POST"],
      middlewares: [requireClerkAuth],
    },
  ],
});
