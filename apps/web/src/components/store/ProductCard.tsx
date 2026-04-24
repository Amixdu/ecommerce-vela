import Link from "next/link";
import Image from "next/image";
import type { Product } from "@ecommerce/types";
import { formatPrice } from "@ecommerce/utils";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const defaultVariant = product.variants[0];

  return (
    <Link
      href={`/products/${product.handle}`}
      className={cn(
        "group block overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="aspect-square overflow-hidden bg-secondary">
        {product.thumbnail ? (
          <Image
            src={product.thumbnail}
            alt={product.title}
            width={400}
            height={400}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-foreground line-clamp-1">
          {product.title}
        </h3>
        {product.description && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        )}
        {defaultVariant && (
          <p className="mt-3 font-medium text-foreground">
            {formatPrice(
              defaultVariant.priceAmount,
              defaultVariant.currency
            )}
          </p>
        )}
      </div>
    </Link>
  );
}
