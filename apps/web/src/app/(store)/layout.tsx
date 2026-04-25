import { Header } from "@/components/layout/Header";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Header />
      <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      <footer className="shrink-0 border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <span className="text-xs font-black tracking-[0.25em] uppercase text-foreground">
            Vela
          </span>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Vela. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <span>Free Shipping</span>
            <span>Easy Returns</span>
            <span>Secure Checkout</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
