import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartItemRow } from "@/components/store/CartItemRow";
import { getCart } from "@/lib/api";
import { formatPrice } from "@ecommerce/utils";

export const metadata: Metadata = { title: "Cart" };

export default async function CartPage() {
  const cartId = (await cookies()).get("medusa_cart_id")?.value;
  const cart = cartId ? await getCart(cartId).catch(() => null) : null;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-32 text-center">
        <ShoppingBag className="h-12 w-12 text-muted-foreground/40" strokeWidth={1} />
        <h1 className="mt-6 text-2xl font-bold tracking-tight">Your bag is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add something beautiful to get started.
        </p>
        <Button asChild className="mt-8 px-8" size="lg">
          <Link href="/products">Browse Collection</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Your Bag</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {cart.items.length} {cart.items.length === 1 ? "item" : "items"}
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
        {/* Items */}
        <ul className="divide-y divide-border">
          {cart.items.map((item) => (
            <li key={item.id}>
              <CartItemRow item={item} />
            </li>
          ))}
        </ul>

        {/* Summary */}
        <div className="h-fit border border-border bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider">
            Order Summary
          </h2>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <dt>Subtotal</dt>
              <dd>{formatPrice(cart.totals.subtotal, cart.totals.currency)}</dd>
            </div>
            {cart.totals.discountTotal > 0 && (
              <div className="flex justify-between text-green-600">
                <dt>Discount</dt>
                <dd>−{formatPrice(cart.totals.discountTotal, cart.totals.currency)}</dd>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <dt>Shipping</dt>
              <dd>
                {cart.totals.shippingTotal === 0
                  ? "Free"
                  : formatPrice(cart.totals.shippingTotal, cart.totals.currency)}
              </dd>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <dt>Tax</dt>
              <dd>{formatPrice(cart.totals.taxTotal, cart.totals.currency)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 font-semibold text-foreground">
              <dt>Total</dt>
              <dd>{formatPrice(cart.totals.total, cart.totals.currency)}</dd>
            </div>
          </dl>

          <Button asChild className="mt-6 w-full" size="lg">
            <Link href="/checkout">Proceed to Checkout</Link>
          </Button>

          <Link
            href="/products"
            className="mt-4 block text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
