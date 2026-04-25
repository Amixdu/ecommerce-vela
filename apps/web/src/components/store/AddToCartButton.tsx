"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import type { Product } from "@ecommerce/types";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/actions/cart";

interface AddToCartButtonProps {
  product: Product;
  cartItems?: Record<string, number>; // variantId → quantity already in cart
}

export function AddToCartButton({
  product,
  cartItems: initialCartItems = {},
}: AddToCartButtonProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants[0]?.id ?? ""
  );
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  // Tracks in-cart quantities locally so the indicator updates immediately after adding
  const [localCartItems, setLocalCartItems] = useState(initialCartItems);

  const handleAddToCart = () => {
    if (!selectedVariantId) return;
    startTransition(async () => {
      await addToCart(selectedVariantId, 1);
      setLocalCartItems((prev) => ({
        ...prev,
        [selectedVariantId]: (prev[selectedVariantId] ?? 0) + 1,
      }));
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    });
  };

  const selectedQty = localCartItems[selectedVariantId] ?? 0;

  if (product.variants.length === 0) {
    return (
      <Button disabled className="w-full" size="lg">
        Out of Stock
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      {product.variants.length > 1 && (
        <div>
          <label className="mb-2 block text-sm font-medium">Select Size</label>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((variant) => {
              const qtyInCart = localCartItems[variant.id] ?? 0;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedVariantId(variant.id)}
                  className={`relative rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    selectedVariantId === variant.id
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:border-foreground"
                  }`}
                >
                  {variant.title}
                  {qtyInCart > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[9px] font-bold text-background ring-2 ring-background">
                      {qtyInCart > 9 ? "9+" : qtyInCart}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Button
        onClick={handleAddToCart}
        disabled={isPending || !selectedVariantId}
        className={`w-full transition-all duration-300 ${
          added ? "bg-green-600 hover:bg-green-600 text-white" : ""
        }`}
        size="lg"
      >
        {isPending ? (
          "Adding…"
        ) : added ? (
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            Added to Bag
          </span>
        ) : (
          "Add to Bag"
        )}
      </Button>

      {selectedQty > 0 && !added && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Check className="h-3 w-3 text-green-600" />
          {selectedQty === 1 ? "1 already in your bag" : `${selectedQty} already in your bag`}
        </p>
      )}
    </div>
  );
}
