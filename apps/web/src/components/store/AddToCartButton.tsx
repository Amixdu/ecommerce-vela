"use client";

import { useState, useTransition } from "react";
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

  const handleAddToCart = () => {
    if (!selectedVariantId) return;
    startTransition(async () => {
      await addToCart(selectedVariantId, 1);
    });
  };

  if (product.variants.length === 0) {
    return (
      <Button disabled className="w-full">
        Out of Stock
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      {product.variants.length > 1 && (
        <div>
          <label className="mb-2 block text-sm font-medium">Variant</label>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => setSelectedVariantId(variant.id)}
                className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  selectedVariantId === variant.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary"
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
        className="w-full"
        size="lg"
      >
        {isPending ? "Adding…" : "Add to Cart"}
      </Button>
    </div>
  );
}
