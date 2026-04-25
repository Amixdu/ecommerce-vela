import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { CartIcon } from "@/components/layout/CartIcon";

export default async function HomePage() {
  const { userId } = auth();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Home nav */}
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
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-[10px] font-semibold tracking-[0.4em] uppercase text-muted-foreground">
          New Season
        </p>

        <h1 className="mt-4 text-[22vw] font-black leading-none tracking-[0.08em] uppercase text-foreground sm:text-[16vw] md:text-[14vw] lg:text-[12vw]">
          VELA
        </h1>

        <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted-foreground sm:max-w-sm sm:text-base">
          Curated essentials for those who value quality over quantity.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
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
      </main>

      {/* Footer strip */}
      <footer className="border-t border-border">
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
