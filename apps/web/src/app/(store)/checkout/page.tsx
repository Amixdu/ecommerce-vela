import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { CheckoutForm } from "@/components/store/CheckoutForm";
import { getCart, setupStripePayment } from "@/lib/api";

export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const cookieStore = await cookies();
  const cartId = cookieStore.get("medusa_cart_id")?.value;

  if (!cartId) redirect("/cart");

  const cart = await getCart(cartId).catch(() => null);
  if (!cart || cart.items.length === 0) redirect("/cart");

  let clientSecret: string;
  try {
    ({ clientSecret } = await setupStripePayment(cartId));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Cart contains variant IDs from deleted/unpublished products (e.g. after a reseed).
    // Clear the stale cart and send the user back to start fresh.
    if (msg.includes("do not exist") || msg.includes("not published")) {
      // Cookies can't be written from Server Components — redirect to the Route
      // Handler which deletes the cookie and then sends the user to /cart.
      redirect("/api/clear-cart");
    }
    throw err;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
      {searchParams.error && (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {decodeURIComponent(searchParams.error)}
        </p>
      )}
      <CheckoutForm cart={cart} stripeClientSecret={clientSecret} />
    </div>
  );
}
