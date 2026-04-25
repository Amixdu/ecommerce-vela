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
      className={cn("group block overflow-hidden bg-background", className)}
    >
      {/* Image */}
      <div className="aspect-[3/4] overflow-hidden bg-secondary">
        {product.thumbnail ? (
          <Image
            src={product.thumbnail}
            alt={product.title}
            width={600}
            height={800}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-xs tracking-widest uppercase text-muted-foreground">
              No image
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-foreground line-clamp-1 group-hover:underline underline-offset-2">
          {product.title}
        </h3>
        {defaultVariant && (
          <p className="mt-1 text-sm text-muted-foreground">
            {formatPrice(defaultVariant.priceAmount, defaultVariant.currency)}
          </p>
        )}
      </div>
    </Link>
  );
}
