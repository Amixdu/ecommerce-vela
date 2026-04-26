"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:9000";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "";
const CART_COOKIE = "medusa_cart_id";

function medusaHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...(PUBLISHABLE_KEY && { "x-publishable-api-key": PUBLISHABLE_KEY }),
  };
}

async function backendFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      ...medusaHeaders(),
      ...(options.headers as Record<string, string>),
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? "API error");
  }

  return res.status === 204 ? null : res.json();
}

async function getFirstRegionId(): Promise<string> {
  const data = await backendFetch("/store/regions");
  const region = data?.regions?.[0];
  if (!region) throw new Error("No regions found. Create one in the Medusa admin: Settings → Regions.");
  return region.id;
}

async function getOrCreateCartId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(CART_COOKIE)?.value;
  if (existing) return existing;

  const regionId = await getFirstRegionId();
  const { cart } = await backendFetch("/store/carts", {
    method: "POST",
    body: JSON.stringify({ region_id: regionId }),
  });

  cookieStore.set(CART_COOKIE, cart.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return cart.id;
}

export async function addToCart(variantId: string, quantity: number) {
  const cartId = await getOrCreateCartId();

  await clearPaymentCollection(cartId);

  await backendFetch(`/store/carts/${cartId}/line-items`, {
    method: "POST",
    body: JSON.stringify({ variant_id: variantId, quantity }),
  });

  revalidatePath("/", "layout");
}

async function clearPaymentCollection(cartId: string) {
  // Removes any Stripe PaymentIntent from Medusa's DB without calling the
  // Stripe cancel API.  Required before cart mutations because Medusa's
  // refresh-payment-collection workflow fails when Stripe rejects the cancel.
  await backendFetch(`/store/carts/${cartId}/payment-collection`, {
    method: "DELETE",
  }).catch(() => {
    // Non-fatal — if there's no collection, or deletion fails, proceed anyway
  });
}

export async function updateCartItem(itemId: string, quantity: number) {
  const cookieStore = await cookies();
  const cartId = cookieStore.get(CART_COOKIE)?.value;
  if (!cartId) return;

  await clearPaymentCollection(cartId);

  if (quantity <= 0) {
    await backendFetch(`/store/carts/${cartId}/line-items/${itemId}`, {
      method: "DELETE",
    });
  } else {
    await backendFetch(`/store/carts/${cartId}/line-items/${itemId}`, {
      method: "POST",
      body: JSON.stringify({ quantity }),
    });
  }

  revalidatePath("/", "layout");
}

export async function removeCartItem(itemId: string) {
  return updateCartItem(itemId, 0);
}
