import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import type { OrderListResponse } from "@ecommerce/types";
import { formatPrice, formatDate } from "@ecommerce/utils";
import { getOrders } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage() {
  const { userId, getToken } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/orders");

  const token = await getToken();
  const data: OrderListResponse = token
    ? await getOrders(token).catch(() => ({ orders: [], count: 0, offset: 0, limit: 20 }))
    : { orders: [], count: 0, offset: 0, limit: 20 };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {data.count} {data.count === 1 ? "order" : "orders"}
      </p>

      {data.orders.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-center">
          <Package className="h-12 w-12 text-muted-foreground/40" strokeWidth={1} />
          <p className="mt-4 text-sm text-muted-foreground">No orders yet.</p>
          <Link
            href="/products"
            className="mt-3 text-sm font-medium underline underline-offset-4 hover:text-muted-foreground transition-colors"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {data.orders.map((order) => (
            <li
              key={order.id}
              className="group flex items-center justify-between border border-border bg-card p-5 transition-colors hover:border-foreground/20"
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-foreground">
                  Order #{order.displayId}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(order.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-xs capitalize">
                  {order.status}
                </Badge>
                <span className="text-sm font-medium text-foreground">
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
