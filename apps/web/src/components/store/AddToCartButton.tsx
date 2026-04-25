"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import type { Product } from "@ecommerce/types";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/actions/cart";

interface AddToCartButtonProps {
  product: Product;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants[0]?.id ?? ""
  );
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    if (!selectedVariantId) return;
    startTransition(async () => {
      await addToCart(selectedVariantId, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    });
  };

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
            {product.variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => setSelectedVariantId(variant.id)}
                className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  selectedVariantId === variant.id
                    ? "border-foreground bg-foreground text-background"
                    : "border-border hover:border-foreground"
                }`}
              >
                {variant.title}
              </button>
            ))}
          </div>
        </div>
      )}
      <Button
        onClick={handleAddToCart}
        disabled={isPending || !selectedVariantId}
        className={`w-full transition-all duration-300 ${
          added
            ? "bg-green-600 hover:bg-green-600 text-white"
            : ""
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
    </div>
  );
}
