import Link from "next/link";
import Image from "next/image";
import { Check } from "lucide-react";
import type { Product } from "@ecommerce/types";
import { formatPrice } from "@ecommerce/utils";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  inCart?: boolean;
  className?: string;
}

export function ProductCard({ product, inCart, className }: ProductCardProps) {
  const defaultVariant = product.variants[0];

  return (
    <Link
      href={`/products/${product.handle}`}
      className={cn("group relative block overflow-hidden bg-background", className)}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
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

        {inCart && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-foreground/90 px-2.5 py-1 text-[10px] font-medium tracking-wide text-background backdrop-blur-sm">
            <Check className="h-2.5 w-2.5" />
            In bag
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
