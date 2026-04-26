import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@ecommerce/utils";

export const metadata: Metadata = { title: "Order Confirmed" };

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:9000";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "";

type MedusaOrderItem = {
  id: string;
  product_title: string;
  variant_title: string;
  thumbnail?: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

type MedusaAddress = {
  first_name?: string;
  last_name?: string;
  address_1?: string;
  city?: string;
  postal_code?: string;
  country_code?: string;
};

type MedusaOrder = {
  id: string;
  display_id: number;
  status: string;
  email: string;
  currency_code: string;
  total: number;
  subtotal: number;
  shipping_total: number;
  tax_total: number;
  items?: MedusaOrderItem[];
  shipping_address?: MedusaAddress;
};

async function getOrder(id: string): Promise<MedusaOrder | null> {
  const res = await fetch(
    `${BACKEND_URL}/store/orders/${id}?fields=*items,*shipping_address`,
    {
      headers: {
        "Content-Type": "application/json",
        ...(PUBLISHABLE_KEY && { "x-publishable-api-key": PUBLISHABLE_KEY }),
      },
      cache: "no-store",
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.order ?? null;
}

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { confirmed?: string };
}) {
  const order = await getOrder(params.id);
  if (!order) notFound();

  const confirmed = searchParams.confirmed === "true";
  const addr = order.shipping_address;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      {confirmed ? (
        <div className="mb-8 flex flex-col items-center text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500" strokeWidth={1.5} />
          <h1 className="mt-4 text-2xl font-bold tracking-tight">
            Thank you for your order!
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A confirmation will be sent to{" "}
            <span className="font-medium text-foreground">{order.email}</span>
          </p>
        </div>
      ) : (
        <h1 className="mb-8 text-2xl font-bold tracking-tight">Order details</h1>
      )}

      <div className="space-y-6">
        {/* Order meta */}
        <div className="flex items-center justify-between border border-border bg-card px-5 py-4">
          <div className="flex items-center gap-3 text-sm">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Order #{order.display_id}</span>
          </div>
          <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium capitalize text-muted-foreground">
            {order.status}
          </span>
        </div>

        {/* Items */}
        <div className="border border-border bg-card">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Items
            </h2>
          </div>
          <ul className="divide-y divide-border">
            {(order.items ?? []).map((item) => (
              <li key={item.id} className="flex items-center gap-4 px-5 py-4">
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-secondary">
                  {item.thumbnail ? (
                    <Image
                      src={item.thumbnail}
                      alt={item.product_title}
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      No img
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-sm font-medium">{item.product_title}</span>
                  {item.variant_title && item.variant_title !== item.product_title && (
                    <span className="text-xs text-muted-foreground">{item.variant_title}</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    Qty {item.quantity} &times;{" "}
                    {formatPrice(item.unit_price, order.currency_code)}
                  </span>
                </div>
                <span className="text-sm font-semibold">
                  {formatPrice(item.subtotal ?? item.unit_price * item.quantity, order.currency_code)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Totals */}
        <div className="border border-border bg-card px-5 py-4">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <dt>Subtotal</dt>
              <dd>{formatPrice(order.subtotal, order.currency_code)}</dd>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <dt>Shipping</dt>
              <dd>
                {(order.shipping_total ?? 0) === 0
                  ? "Free"
                  : formatPrice(order.shipping_total, order.currency_code)}
              </dd>
            </div>
            {(order.tax_total ?? 0) > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <dt>Tax</dt>
                <dd>{formatPrice(order.tax_total, order.currency_code)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-3 font-semibold text-foreground">
              <dt>Total</dt>
              <dd>{formatPrice(order.total, order.currency_code)}</dd>
            </div>
          </dl>
        </div>

        {/* Shipping address */}
        {addr && (addr.first_name || addr.address_1) && (
          <div className="border border-border bg-card px-5 py-4">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Shipping to
            </h2>
            <address className="not-italic text-sm text-foreground">
              {addr.first_name || addr.last_name
                ? `${addr.first_name ?? ""} ${addr.last_name ?? ""}`.trim()
                : null}
              {addr.address_1 && <>, {addr.address_1}</>}
              {addr.city && <>, {addr.city}</>}
              {addr.postal_code && <> {addr.postal_code}</>}
              {addr.country_code && (
                <>, {addr.country_code.toUpperCase()}</>
              )}
            </address>
          </div>
        )}
      </div>

      <div className="mt-8 flex gap-4">
        <Button asChild className="flex-1" size="lg">
          <Link href="/products">Continue Shopping</Link>
        </Button>
        <Button asChild variant="outline" className="flex-1" size="lg">
          <Link href="/orders">All Orders</Link>
        </Button>
      </div>
    </div>
  );
}
