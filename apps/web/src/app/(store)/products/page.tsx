import type { Metadata } from "next";
import type { ProductListResponse } from "@ecommerce/types";
import { ProductCard } from "@/components/store/ProductCard";
import { getProducts } from "@/lib/api";

export const metadata: Metadata = { title: "Collection" };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string };
}) {
  const data: ProductListResponse = await getProducts({
    q: searchParams.q,
    categoryId: searchParams.category,
  });

  return (
    <div>
      {/* Page header */}
      <div className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-[10px] font-semibold tracking-[0.4em] uppercase text-muted-foreground">
            Vela
          </p>
          <h1 className="mt-1 text-4xl font-bold tracking-tight text-foreground">
            Collection
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {data.count} {data.count === 1 ? "piece" : "pieces"}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {data.products.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-muted-foreground">No products found.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.products.map((product) => (
              <li key={product.id} className="bg-background">
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
