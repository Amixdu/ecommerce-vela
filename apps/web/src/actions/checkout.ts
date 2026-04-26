"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:9000";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "";

function medusaHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...(PUBLISHABLE_KEY && { "x-publishable-api-key": PUBLISHABLE_KEY }),
  };
}

async function backendFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: { ...medusaHeaders(), ...(options.headers as Record<string, string>) },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? "API error");
  }
  return res.status === 204 ? null : res.json();
}

export interface CheckoutFormData {
  email: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  postalCode: string;
  countryCode: string;
  phone?: string;
}

export async function completeCheckout(formData: CheckoutFormData) {
  const cookieStore = await cookies();
  const cartId = cookieStore.get("medusa_cart_id")?.value;
  if (!cartId) throw new Error("No cart found");

  // Attach shipping address and email to the cart
  try {
    await backendFetch(`/store/carts/${cartId}`, {
      method: "POST",
      body: JSON.stringify({
        email: formData.email,
        shipping_address: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          address_1: formData.address1,
          ...(formData.address2 ? { address_2: formData.address2 } : {}),
          city: formData.city,
          ...(formData.province ? { province: formData.province } : {}),
          postal_code: formData.postalCode,
          country_code: formData.countryCode.toLowerCase(),
          ...(formData.phone ? { phone: formData.phone } : {}),
        },
      }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("do not exist") || msg.includes("not published")) {
      // Cart has stale variant IDs (e.g. after a reseed). Server actions CAN
      // write cookies — delete the cart and send user back to start fresh.
      cookieStore.delete("medusa_cart_id");
      redirect("/cart?cleared=1");
    }
    throw err;
  }

  // Attach a shipping method — required before completing the cart
  try {
    const { shipping_options } = await backendFetch(
      `/store/shipping-options?cart_id=${cartId}`
    );
    const optionId = shipping_options?.[0]?.id;
    if (!optionId) throw new Error("No shipping options available for this cart");
    await backendFetch(`/store/carts/${cartId}/shipping-methods`, {
      method: "POST",
      body: JSON.stringify({ option_id: optionId }),
    });
  } catch (err) {
    console.error("[completeCheckout] shipping method setup failed:", err);
    throw err;
  }

  // Complete the cart — Medusa verifies the Stripe payment and creates the order
  let result: { type: string; order?: { id: string } };
  try {
    result = await backendFetch(`/store/carts/${cartId}/complete`, {
      method: "POST",
    });
  } catch (err) {
    console.error("[completeCheckout] POST /store/carts/:id/complete failed:", err);
    throw err;
  }

  console.log("[completeCheckout] complete result:", JSON.stringify(result));

  if (result?.type !== "order") {
    throw new Error(
      `Order creation failed (type: ${result?.type ?? "unknown"}) — check backend logs`
    );
  }

  // Clear the cart cookie and refresh layout (updates cart bubble)
  cookieStore.delete("medusa_cart_id");
  revalidatePath("/", "layout");

  redirect(`/orders/${result.order.id}?confirmed=true`);
}
