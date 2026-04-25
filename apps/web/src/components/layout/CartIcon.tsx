import Link from "next/link";
import { cookies } from "next/headers";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCart } from "@/lib/api";

export async function CartIcon() {
  const cartId = (await cookies()).get("medusa_cart_id")?.value;
  const cart = cartId ? await getCart(cartId).catch(() => null) : null;
  const count =
    cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <Button asChild variant="ghost" size="icon" className="relative h-8 w-8">
      <Link href="/cart">
        <ShoppingCart className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold leading-none text-white">
            {count > 99 ? "99" : count}
          </span>
        )}
        <span className="sr-only">Cart, {count} items</span>
      </Link>
    </Button>
  );
}
