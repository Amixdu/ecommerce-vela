"use client";

import { useTransition } from "react";
import Image from "next/image";
import type { CartLineItem } from "@ecommerce/types";
import { formatPrice } from "@ecommerce/utils";
import { Button } from "@/components/ui/button";
import { updateCartItem, removeCartItem } from "@/actions/cart";
import { Minus, Plus, Trash2 } from "lucide-react";

interface CartItemRowProps {
  item: CartLineItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const [isPending, startTransition] = useTransition();

  const decrement = () =>
    startTransition(() => updateCartItem(item.id, item.quantity - 1));
  const increment = () =>
    startTransition(() => updateCartItem(item.id, item.quantity + 1));
  const remove = () => startTransition(() => removeCartItem(item.id));

  return (
    <div className="flex items-center gap-4 py-4">
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
        {item.thumbnail ? (
          <Image
            src={item.thumbnail}
            alt={item.title}
            width={80}
            height={80}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No img
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <span className="font-medium text-foreground">{item.title}</span>
        {item.variantTitle !== item.title && (
          <span className="text-sm text-muted-foreground">
            {item.variantTitle}
          </span>
        )}
        <span className="text-sm font-medium">
          {formatPrice(item.unitPrice, item.currency)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={decrement}
          disabled={isPending}
          className="h-7 w-7"
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-6 text-center text-sm font-medium">
          {item.quantity}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={increment}
          disabled={isPending}
          className="h-7 w-7"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <span className="font-semibold">
          {formatPrice(item.totalPrice, item.currency)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={remove}
          disabled={isPending}
          className="h-7 w-7 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
