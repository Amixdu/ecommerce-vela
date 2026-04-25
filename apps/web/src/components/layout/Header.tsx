import { Suspense } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { CartIcon } from "@/components/layout/CartIcon";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-sm font-black tracking-[0.25em] uppercase text-foreground hover:opacity-70 transition-opacity"
        >
          Vela
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/products"
            className="text-xs font-medium tracking-wide uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Collection
          </Link>
          <SignedIn>
            <Link
              href="/orders"
              className="text-xs font-medium tracking-wide uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              Orders
            </Link>
          </SignedIn>
        </nav>

        <div className="flex items-center gap-2">
          <Suspense
            fallback={
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ShoppingCart className="h-4 w-4" />
              </Button>
            }
          >
            <CartIcon />
          </Suspense>

          <SignedOut>
            <Button asChild variant="outline" size="sm" className="text-xs tracking-wide uppercase h-8 px-4">
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </SignedOut>

          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
