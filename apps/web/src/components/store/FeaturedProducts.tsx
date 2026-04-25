import Link from "next/link";
import Image from "next/image";
import type { Product } from "@ecommerce/types";
import { formatPrice } from "@ecommerce/utils";
import { getProducts } from "@/lib/api";

function ProductTile({ product }: { product: Product }) {
  const variant = product.variants[0];
  return (
    <Link
      href={`/products/${product.handle}`}
      className="group relative flex-shrink-0 w-48 sm:w-56"
    >
      <div className="aspect-[3/4] overflow-hidden bg-white/5">
        {product.thumbnail ? (
          <Image
            src={product.thumbnail}
            alt={product.title}
            width={224}
            height={299}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-[10px] tracking-widest uppercase text-white/20">
              Vela
            </span>
          </div>
        )}
      </div>
      <div className="mt-3 space-y-0.5">
        <p className="text-xs font-medium tracking-wide text-white/90 line-clamp-1">
          {product.title}
        </p>
        {variant && (
          <p className="text-xs text-white/40">
            {formatPrice(variant.priceAmount, variant.currency)}
          </p>
        )}
      </div>
    </Link>
  );
}

export async function FeaturedProducts() {
  const data = await getProducts({ limit: 12 }).catch(() => null);
  if (!data || data.products.length === 0) return null;

  const products = data.products;
  // Split into two rows; if fewer than 4 products, use the same set for both rows
  const mid = Math.ceil(products.length / 2);
  const row1 = products.length >= 4 ? products.slice(0, mid) : products;
  const row2 = products.length >= 4 ? products.slice(mid) : [...products].reverse();

  return (
    <section className="w-full overflow-hidden bg-foreground py-16 sm:py-24">
      {/* Header */}
      <div className="mx-auto mb-12 max-w-7xl px-6 sm:px-10">
        <p className="text-[10px] font-semibold tracking-[0.4em] uppercase text-white/30">
          The Collection
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
          Now Available
        </h2>
      </div>

      {/* Marquee rows */}
      <div
        className="flex flex-col gap-6"
        style={{
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          maskImage:
            "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        }}
      >
        {/* Row 1 — left */}
        <div className="group flex gap-4 overflow-hidden">
          <div className="flex animate-marquee gap-4 group-hover:[animation-play-state:paused]">
            {[...row1, ...row1].map((product, i) => (
              <ProductTile key={`r1-${product.id}-${i}`} product={product} />
            ))}
          </div>
        </div>

        {/* Row 2 — right */}
        <div className="group flex gap-4 overflow-hidden">
          <div className="flex animate-marquee-reverse gap-4 group-hover:[animation-play-state:paused]">
            {[...row2, ...row2].map((product, i) => (
              <ProductTile key={`r2-${product.id}-${i}`} product={product} />
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mx-auto mt-12 max-w-7xl px-6 sm:px-10">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase text-white/60 transition-colors hover:text-white"
        >
          View all pieces
          <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
}
