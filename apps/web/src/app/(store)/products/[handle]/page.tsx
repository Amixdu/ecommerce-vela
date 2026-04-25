import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@ecommerce/types";
import { formatPrice } from "@ecommerce/utils";
import { getProductByHandle } from "@/lib/api";
import { AddToCartButton } from "@/components/store/AddToCartButton";

interface Props {
  params: { handle: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductByHandle(params.handle).catch(() => null);
  if (!product) return { title: "Product Not Found" };
  return { title: product.title, description: product.description ?? undefined };
}

export default async function ProductDetailPage({ params }: Props) {
  const product: Product | null = await getProductByHandle(params.handle).catch(() => null);
  if (!product) notFound();

  const defaultVariant = product.variants[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/products" className="hover:text-foreground transition-colors uppercase tracking-wide">
          Collection
        </Link>
        <span>/</span>
        <span className="text-foreground">{product.title}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Image */}
        <div className="aspect-[3/4] overflow-hidden bg-secondary">
          {product.thumbnail ? (
            <Image
              src={product.thumbnail}
              alt={product.title}
              width={800}
              height={1067}
              className="h-full w-full object-cover"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-xs tracking-widest uppercase text-muted-foreground">
                No image
              </span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col justify-center lg:py-8">
          <p className="text-[10px] font-semibold tracking-[0.4em] uppercase text-muted-foreground">
            Vela
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
            {product.title}
          </h1>

          {defaultVariant && (
            <p className="mt-4 text-xl font-medium text-foreground">
              {formatPrice(defaultVariant.priceAmount, defaultVariant.currency)}
            </p>
          )}

          {product.description && (
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          )}

          <div className="mt-10 border-t border-border pt-8">
            <AddToCartButton product={product} />
          </div>

          {/* Trust signals */}
          <div className="mt-8 flex flex-col gap-2 text-xs text-muted-foreground">
            <span>✓ Free shipping on all orders</span>
            <span>✓ Easy 30-day returns</span>
            <span>✓ Secure checkout</span>
          </div>
        </div>
      </div>
    </div>
  );
}
