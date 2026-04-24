import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { CartItemRow } from "@/components/store/CartItemRow";
import { getCart } from "@/lib/api";
import { formatPrice } from "@ecommerce/utils";

export const metadata: Metadata = { title: "Cart" };

export default async function CartPage() {
  const { getToken } = await auth();
  const token = await getToken();
  const cart = token ? await getCart(token).catch(() => null) : null;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">Your cart is empty</h1>
        <p className="mt-4 text-muted-foreground">
          Add some products to get started.
        </p>
        <Button asChild className="mt-8">
          <Link href="/products">Browse Products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Shopping Cart</h1>

      <ul className="mt-8 divide-y divide-border">
        {cart.items.map((item) => (
          <li key={item.id}>
            <CartItemRow item={item} />
          </li>
        ))}
      </ul>

      <div className="mt-8 rounded-xl border border-border p-6">
        <dl className="space-y-3">
          <div className="flex justify-between text-sm text-muted-foreground">
            <dt>Subtotal</dt>
            <dd>{formatPrice(cart.totals.subtotal, cart.totals.currency)}</dd>
          </div>
          {cart.totals.discountTotal > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <dt>Discount</dt>
              <dd>
                -{formatPrice(cart.totals.discountTotal, cart.totals.currency)}
              </dd>
            </div>
          )}
          <div className="flex justify-between text-sm text-muted-foreground">
            <dt>Shipping</dt>
            <dd>
              {cart.totals.shippingTotal === 0
                ? "Free"
                : formatPrice(cart.totals.shippingTotal, cart.totals.currency)}
            </dd>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <dt>Tax</dt>
            <dd>{formatPrice(cart.totals.taxTotal, cart.totals.currency)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-3 font-semibold">
            <dt>Total</dt>
            <dd>{formatPrice(cart.totals.total, cart.totals.currency)}</dd>
          </div>
        </dl>

        <Button asChild className="mt-6 w-full" size="lg">
          <Link href="/checkout">Proceed to Checkout</Link>
        </Button>
      </div>
    </div>
  );
}
