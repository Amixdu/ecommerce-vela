"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

const BACKEND_URL =
  process.env.BACKEND_URL || "http://localhost:9000";

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "";

async function backendFetch(
  path: string,
  token: string,
  options: RequestInit = {}
) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(PUBLISHABLE_KEY && { "x-publishable-api-key": PUBLISHABLE_KEY }),
      ...(options.headers as Record<string, string>),
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? "API error");
  }

  return res.status === 204 ? null : res.json();
}

export async function addToCart(variantId: string, quantity: number) {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");

  await backendFetch("/store/carts/me/line-items", token, {
    method: "POST",
    body: JSON.stringify({ variant_id: variantId, quantity }),
  });

  revalidatePath("/cart");
}

export async function updateCartItem(itemId: string, quantity: number) {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");

  if (quantity <= 0) {
    await backendFetch(`/store/carts/me/line-items/${itemId}`, token, {
      method: "DELETE",
    });
  } else {
    await backendFetch(`/store/carts/me/line-items/${itemId}`, token, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    });
  }

  revalidatePath("/cart");
}

export async function removeCartItem(itemId: string) {
  return updateCartItem(itemId, 0);
}
