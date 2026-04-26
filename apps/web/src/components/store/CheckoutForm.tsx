"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import type { Cart } from "@ecommerce/types";
import { formatPrice } from "@ecommerce/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeCheckout, type CheckoutFormData } from "@/actions/checkout";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

function StripePaymentForm({
  cart,
  formData,
}: {
  cart: Cart;
  formData: CheckoutFormData;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !isReady) return;

    setIsProcessing(true);
    setErrorMessage(null);

    // 1. Stripe confirms the PaymentIntent (user's card is authorized)
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      // payment_intent_unexpected_state means the PI is stale (canceled or already
      // captured). Redirect to a fresh checkout page — setupStripePayment will
      // create a new PaymentIntent.
      if (
        error.code === "payment_intent_unexpected_state" ||
        error.payment_intent?.status === "canceled"
      ) {
        router.replace("/checkout");
        return;
      }
      setErrorMessage(error.message ?? "Payment failed. Please try again.");
      setIsProcessing(false);
      return;
    }

    // Medusa's Stripe provider uses capture_method:manual — status after
    // confirmPayment is "requires_capture", not "succeeded". Medusa captures
    // when POST /store/carts/:id/complete is called.
    const authorized =
      paymentIntent?.status === "succeeded" ||
      paymentIntent?.status === "requires_capture";

    if (!authorized) {
      setErrorMessage("Payment was not completed. Please try again.");
      setIsProcessing(false);
      return;
    }

    // 2. Tell Medusa to finalize the cart → creates the order
    try {
      await completeCheckout(formData);
      // completeCheckout redirects on success — code below only runs on error
    } catch (err: unknown) {
      const e = err as { digest?: string; message?: string };
      if (e?.digest?.startsWith?.("NEXT_REDIRECT")) throw err;
      // Medusa canceled the PI during rollback — redirect to a fresh checkout.
      // Stale-cart cases (variants deleted) are handled server-side in the action
      // and arrive here as a NEXT_REDIRECT, already re-thrown above.
      const msg = encodeURIComponent(e?.message ?? "Checkout failed. Please try again.");
      router.replace(`/checkout?error=${msg}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement onReady={() => setIsReady(true)} />
      {errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}
      <Button
        type="submit"
        disabled={!stripe || !isReady || isProcessing}
        className="w-full"
        size="lg"
      >
        {isProcessing
          ? "Processing…"
          : `Pay ${formatPrice(cart.totals.total, cart.totals.currency)}`}
      </Button>
    </form>
  );
}

interface CheckoutFormProps {
  cart: Cart;
  stripeClientSecret: string;
}

export function CheckoutForm({ cart, stripeClientSecret }: CheckoutFormProps) {
  const [formData, setFormData] = useState<CheckoutFormData>({
    email: "",
    firstName: "",
    lastName: "",
    address1: "",
    address2: "",
    city: "",
    province: "",
    postalCode: "",
    countryCode: "au",
    phone: "",
  });

  const updateField = (field: keyof CheckoutFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]">
      {/* Shipping + payment */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Shipping Information</h2>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => updateField("email", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              required
              value={formData.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              required
              value={formData.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address1">Address</Label>
          <Input
            id="address1"
            required
            value={formData.address1}
            onChange={(e) => updateField("address1", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              required
              value={formData.city}
              onChange={(e) => updateField("city", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postalCode">Postal Code</Label>
            <Input
              id="postalCode"
              required
              value={formData.postalCode}
              onChange={(e) => updateField("postalCode", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Payment</h2>
          <Elements
            key={stripeClientSecret}
            stripe={stripePromise}
            options={{ clientSecret: stripeClientSecret }}
          >
            <StripePaymentForm cart={cart} formData={formData} />
          </Elements>
        </div>
      </div>

      {/* Order summary */}
      <div>
        <h2 className="text-xl font-semibold">Order Summary</h2>
        <ul className="mt-4 divide-y divide-border">
          {cart.items.map((item) => (
            <li key={item.id} className="flex justify-between py-3 text-sm">
              <span>
                {item.title}{item.variantTitle ? ` — ${item.variantTitle}` : ""} × {item.quantity}
              </span>
              <span>{formatPrice(item.totalPrice, item.currency)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-border pt-4 font-semibold">
          <span>Total</span>
          <span>{formatPrice(cart.totals.total, cart.totals.currency)}</span>
        </div>
      </div>
    </div>
  );
}
