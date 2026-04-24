import type { Metadata } from "next";
import type { ProductListResponse } from "@ecommerce/types";
import { ProductCard } from "@/components/store/ProductCard";
import { getProducts } from "@/lib/api";

export const metadata: Metadata = { title: "Products" };

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
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        All Products
      </h1>
      <p className="mt-2 text-muted-foreground">{data.count} products</p>

      {data.products.length === 0 ? (
        <p className="mt-16 text-center text-muted-foreground">
          No products found.
        </p>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
