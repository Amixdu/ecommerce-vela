import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import type { OrderListResponse } from "@ecommerce/types";
import { formatPrice, formatDate } from "@ecommerce/utils";
import { getOrders } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "My Orders" };

export default async function OrdersPage() {
  const { userId, getToken } = await auth();

  if (!userId) redirect("/sign-in?redirect_url=/orders");

  const token = await getToken();
  const data: OrderListResponse = token
    ? await getOrders(token).catch(() => ({ orders: [], count: 0, offset: 0, limit: 20 }))
    : { orders: [], count: 0, offset: 0, limit: 20 };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>

      {data.orders.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">No orders yet.</p>
          <Link
            href="/products"
            className="mt-4 inline-block text-sm font-medium underline"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {data.orders.map((order) => (
            <li
              key={order.id}
              className="rounded-xl border border-border p-6 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">Order #{order.displayId}</span>
                <Badge variant="outline">{order.status}</Badge>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                <span>{formatDate(order.createdAt)}</span>
                <span className="font-medium text-foreground">
                  {formatPrice(order.total, order.currency)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
