"use server";

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:9000";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "";

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

export async function completeCheckout(
  formData: CheckoutFormData,
  paymentIntentId: string
) {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${BACKEND_URL}/store/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(PUBLISHABLE_KEY && { "x-publishable-api-key": PUBLISHABLE_KEY }),
    },
    body: JSON.stringify({
      shipping_address: {
        first_name: formData.firstName,
        last_name: formData.lastName,
        address_1: formData.address1,
        address_2: formData.address2,
        city: formData.city,
        province: formData.province,
        postal_code: formData.postalCode,
        country_code: formData.countryCode,
        phone: formData.phone,
      },
      email: formData.email,
      payment_intent_id: paymentIntentId,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Checkout failed" }));
    throw new Error(err.message);
  }

  const { order } = await res.json();
  redirect(`/orders/${order.id}?confirmed=true`);
}
