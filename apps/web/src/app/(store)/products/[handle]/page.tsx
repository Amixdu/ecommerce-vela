import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
  return { title: product.title, description: product.description };
}

export default async function ProductDetailPage({ params }: Props) {
  const product: Product | null = await getProductByHandle(
    params.handle
  ).catch(() => null);

  if (!product) notFound();

  const defaultVariant = product.variants[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="lg:grid lg:grid-cols-2 lg:gap-x-12">
        {/* Image */}
        <div className="aspect-square overflow-hidden rounded-xl bg-secondary">
          {product.thumbnail ? (
            <Image
              src={product.thumbnail}
              alt={product.title}
              width={800}
              height={800}
              className="h-full w-full object-cover"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
        </div>

        {/* Details */}
        <div className="mt-10 lg:mt-0">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {product.title}
          </h1>

          {defaultVariant && (
            <p className="mt-4 text-2xl font-semibold text-foreground">
              {formatPrice(defaultVariant.priceAmount, defaultVariant.currency)}
            </p>
          )}

          {product.description && (
            <p className="mt-6 text-muted-foreground">{product.description}</p>
          )}

          <div className="mt-8">
            <AddToCartButton product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}
