import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { CheckoutForm } from "@/components/store/CheckoutForm";
import { getCart, createPaymentIntent } from "@/lib/api";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const { userId, getToken } = await auth();

  if (!userId) redirect("/sign-in?redirect_url=/checkout");

  const [token, cartId] = await Promise.all([
    getToken(),
    cookies().then((c) => c.get("medusa_cart_id")?.value),
  ]);
  const cart = cartId ? await getCart(cartId).catch(() => null) : null;

  if (!cart || cart.items.length === 0) redirect("/cart");

  const { clientSecret } = await createPaymentIntent(
    cart.totals.total,
    cart.totals.currency,
    token!
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
      <CheckoutForm cart={cart} stripeClientSecret={clientSecret} />
    </div>
  );
}
