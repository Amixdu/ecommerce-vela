import type {
  Product,
  ProductStatus,
  ProductListResponse,
  ProductFilters,
  Cart,
  OrderListResponse,
} from "@ecommerce/types";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:9000";

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "";

// Medusa v2 raw response shapes (snake_case, prices as relation)
type MedusaPrice = { currency_code: string; amount: number };
type MedusaOptionValue = { value: string; option?: { title: string } };
type MedusaVariant = {
  id: string;
  title: string;
  sku?: string | null;
  prices?: MedusaPrice[];
  inventory_quantity?: number;
  options?: MedusaOptionValue[];
};
type MedusaImage = { id: string; url: string; alt?: string };
type MedusaCategory = { id: string; name: string; handle: string };
type MedusaProduct = {
  id: string;
  title: string;
  handle: string;
  description?: string | null;
  status: string;
  thumbnail?: string | null;
  images?: MedusaImage[];
  variants?: MedusaVariant[];
  categories?: MedusaCategory[];
  created_at: string;
  updated_at: string;
};
type MedusaProductList = {
  products: MedusaProduct[];
  count: number;
  offset: number;
  limit: number;
};

function transformVariant(v: MedusaVariant) {
  const price = v.prices?.[0];
  return {
    id: v.id,
    title: v.title,
    sku: v.sku ?? undefined,
    priceAmount: price?.amount ?? 0,
    currency: price?.currency_code ?? "usd",
    inventoryQuantity: v.inventory_quantity ?? 0,
    options: Object.fromEntries(
      (v.options ?? []).map((o) => [o.option?.title ?? "Option", o.value])
    ),
  };
}

function transformProduct(p: MedusaProduct): Product {
  return {
    id: p.id,
    title: p.title,
    handle: p.handle,
    description: p.description ?? undefined,
    status: p.status as ProductStatus,
    thumbnail: p.thumbnail ?? undefined,
    images: (p.images ?? []).map((img) => ({
      id: img.id,
      url: img.url,
      alt: img.alt,
    })),
    variants: (p.variants ?? []).map(transformVariant),
    categories: (p.categories ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      handle: c.handle,
    })),
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

const PRODUCT_FIELDS = "fields=*variants.prices,*categories";

async function apiFetch<T>(
  path: string,
  options?: RequestInit & { token?: string }
): Promise<T> {
  const { token, ...fetchOptions } = options ?? {};

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (PUBLISHABLE_KEY) {
    headers["x-publishable-api-key"] = PUBLISHABLE_KEY;
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...fetchOptions,
    headers,
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${res.url} — ${body}`);
  }

  return res.json() as Promise<T>;
}

export async function getProducts(
  filters: ProductFilters = {}
): Promise<ProductListResponse> {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.categoryId) params.set("category_id", filters.categoryId);
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.offset) params.set("offset", String(filters.offset));

  const query = params.toString();
  const path = `/store/products?${PRODUCT_FIELDS}${query ? `&${query}` : ""}`;

  const data = await apiFetch<MedusaProductList>(path, {
    next: { revalidate: 60 },
  });

  return {
    products: data.products.map(transformProduct),
    count: data.count,
    offset: data.offset,
    limit: data.limit,
  };
}

export async function getProductByHandle(handle: string): Promise<Product> {
  const data = await apiFetch<MedusaProductList>(
    `/store/products?handle=${handle}&${PRODUCT_FIELDS}`,
    { next: { revalidate: 60 } }
  );

  const product = data.products[0];
  if (!product) throw new Error(`Product not found: ${handle}`);
  return transformProduct(product);
}

export async function getCart(token: string): Promise<Cart> {
  return apiFetch<Cart>("/store/carts/me", { token, cache: "no-store" });
}

export async function getOrders(token: string): Promise<OrderListResponse> {
  return apiFetch<OrderListResponse>("/store/orders", {
    token,
    cache: "no-store",
  });
}

export async function createPaymentIntent(
  amount: number,
  currency: string,
  token: string
): Promise<{ clientSecret: string }> {
  return apiFetch<{ clientSecret: string }>("/store/payment-intents", {
    method: "POST",
    token,
    body: JSON.stringify({ amount, currency }),
    cache: "no-store",
  });
}
