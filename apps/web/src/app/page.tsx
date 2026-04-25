import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { CartIcon } from "@/components/layout/CartIcon";
import { getProducts } from "@/lib/api";
import type { Product } from "@ecommerce/types";

function ProductStrip({ products }: { products: Product[] }) {
  // Duplicate for seamless loop
  const tiles = [...products, ...products];

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        WebkitMaskImage:
          "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
        maskImage:
          "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
      }}
    >
      <div className="group flex gap-3">
        <div className="flex animate-marquee-reverse gap-3 group-hover:[animation-play-state:paused]">
          {tiles.map((product, i) => (
            <Link
              key={`${product.id}-${i}`}
              href={`/products/${product.handle}`}
              className="relative h-[260px] w-[174px] flex-shrink-0 overflow-hidden bg-secondary sm:h-[340px] sm:w-[226px]"
            >
              {product.thumbnail ? (
                <Image
                  src={product.thumbnail}
                  alt={product.title}
                  fill
                  className="object-cover transition-transform duration-700 hover:scale-105"
                  sizes="452px"
                  quality={90}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="text-[10px] tracking-widest uppercase text-muted-foreground">
                    Vela
                  </span>
                </div>
              )}
              {/* Product name on hover */}
              <div className="absolute inset-x-0 bottom-0 translate-y-full bg-foreground/90 px-3 py-2 transition-transform duration-300 hover:translate-y-0 group-hover:translate-y-0">
                <p className="text-[10px] font-medium tracking-wide text-white truncate">
                  {product.title}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const { userId } = auth();
  const data = await getProducts({ limit: 12 }).catch(() => null);
  const products = data?.products ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <span className="text-lg font-black tracking-[0.25em] uppercase select-none">
          Vela
        </span>
        <nav className="flex items-center gap-6">
          <Link
            href="/products"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Collection
          </Link>
          {userId && (
            <Link
              href="/orders"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Orders
            </Link>
          )}
          <Suspense
            fallback={
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-4 w-4" />
              </Button>
            }
          >
            <CartIcon />
          </Suspense>
          <SignedOut>
            <Button asChild variant="outline" size="sm">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col">
        {/* Text block */}
        <div className="flex flex-col items-center px-6 pb-10 pt-10 text-center sm:px-10 sm:pt-14">
          <p className="text-[10px] font-semibold tracking-[0.4em] uppercase text-muted-foreground">
            New Season
          </p>
          <h1 className="mt-3 text-[18vw] font-black leading-none tracking-[0.06em] uppercase text-foreground sm:text-[13vw] md:text-[11vw] lg:text-[9vw]">
            VELA
          </h1>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground sm:max-w-sm">
            Curated essentials for those who value quality over quantity.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="gap-2 px-8">
              <Link href="/products">
                Shop Collection
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            {!userId && (
              <Button asChild size="lg" variant="outline" className="px-8">
                <Link href="/sign-up">Create Account</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Product strip */}
        {products.length > 0 && <ProductStrip products={products} />}
      </main>

      {/* Footer strip */}
      <footer className="border-t border-border mt-10">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 px-6 py-5 text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground">
          <span>Free Shipping</span>
          <span className="hidden sm:inline">·</span>
          <span>Easy Returns</span>
          <span className="hidden sm:inline">·</span>
          <span>Curated Quality</span>
          <span className="hidden sm:inline">·</span>
          <span>Secure Checkout</span>
        </div>
      </footer>
    </div>
  );
}
