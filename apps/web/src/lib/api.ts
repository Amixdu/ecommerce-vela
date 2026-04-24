import type {
  Product,
  ProductListResponse,
  ProductFilters,
  Cart,
  OrderListResponse,
} from "@ecommerce/types";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:9000";

async function apiFetch<T>(
  path: string,
  options?: RequestInit & { token?: string }
): Promise<T> {
  const { token, ...fetchOptions } = options ?? {};

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...fetchOptions,
    headers,
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? "API request failed");
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
  return apiFetch<ProductListResponse>(
    `/store/products${query ? `?${query}` : ""}`,
    { next: { revalidate: 60 } }
  );
}

export async function getProductByHandle(handle: string): Promise<Product> {
  const data = await apiFetch<{ products: Product[] }>(
    `/store/products?handle=${handle}`,
    { next: { revalidate: 60 } }
  );

  const product = data.products[0];
  if (!product) throw new Error(`Product not found: ${handle}`);
  return product;
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
