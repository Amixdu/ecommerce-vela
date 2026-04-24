import type { Cart, CartLineItem } from "@ecommerce/types";

export function getCartItemCount(cart: Cart): number {
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function findCartItem(
  cart: Cart,
  variantId: string
): CartLineItem | undefined {
  return cart.items.find((item) => item.variantId === variantId);
}

export function isCartEmpty(cart: Cart): boolean {
  return cart.items.length === 0;
}
