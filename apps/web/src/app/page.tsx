import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
        Modern Commerce
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
        Discover our curated collection of quality essentials. Fast shipping,
        easy returns, and a seamless checkout experience.
      </p>
      <div className="mt-10 flex gap-4">
        <Button asChild size="lg">
          <Link href="/products">Shop Now</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/sign-in">Sign In</Link>
        </Button>
      </div>
    </main>
  );
}
