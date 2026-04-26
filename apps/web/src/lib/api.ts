import type {
  Product,
  ProductStatus,
  ProductListResponse,
  ProductFilters,
  Cart,
  CartLineItem,
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
  const price =
    v.prices?.find((p) => p.currency_code === STORE_CURRENCY) ??
    v.prices?.[0];
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
    thumbnail: p.thumbnail ?? p.images?.[0]?.url ?? undefined,
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
const STORE_CURRENCY = (
  process.env.NEXT_PUBLIC_STORE_CURRENCY ?? "aud"
).toLowerCase();

type MedusaCartLineItem = {
  id: string;
  product_id: string;
  variant_id: string;
  product_title: string;
  variant_title: string;
  thumbnail?: string | null;
  quantity: number;
  unit_price: number;
  subtotal?: number | null;
};
type MedusaCart = {
  id: string;
  customer_id?: string | null;
  email?: string | null;
  currency_code: string;
  items?: MedusaCartLineItem[];
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  tax_total: number;
  total: number;
  region_id?: string | null;
  created_at: string;
  updated_at: string;
};

function transformCart(c: MedusaCart): Cart {
  return {
    id: c.id,
    customerId: c.customer_id ?? undefined,
    email: c.email ?? undefined,
    items: (c.items ?? []).map(
      (item): CartLineItem => ({
        id: item.id,
        variantId: item.variant_id,
        productId: item.product_id,
        title: item.product_title,
        variantTitle: item.variant_title,
        thumbnail: item.thumbnail ?? undefined,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.subtotal ?? item.unit_price * item.quantity,
        currency: c.currency_code,
      })
    ),
    totals: {
      subtotal: c.subtotal,
      discountTotal: c.discount_total,
      shippingTotal: c.shipping_total,
      taxTotal: c.tax_total,
      total: c.total,
      currency: c.currency_code,
    },
    regionId: c.region_id ?? undefined,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };
}

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
    { cache: "no-store" } // always fresh so variant IDs are never stale for add-to-cart
  );

  const product = data.products[0];
  if (!product) throw new Error(`Product not found: ${handle}`);
  return transformProduct(product);
}

export async function getCart(cartId: string): Promise<Cart> {
  const data = await apiFetch<{ cart: MedusaCart }>(
    `/store/carts/${cartId}`,
    { cache: "no-store" }
  );
  return transformCart(data.cart);
}

export async function getOrders(token: string): Promise<OrderListResponse> {
  return apiFetch<OrderListResponse>("/store/orders/mine", {
    token,
    cache: "no-store",
  });
}

type MedusaPaymentCollection = {
  id: string;
  payment_sessions?: Array<{
    id: string;
    provider_id: string;
    data: { client_secret?: string };
  }>;
};

export async function setupStripePayment(
  cartId: string
): Promise<{ clientSecret: string }> {
  // POST /store/payment-collections is idempotent — returns existing if one exists
  const { payment_collection } = await apiFetch<{
    payment_collection: MedusaPaymentCollection;
  }>("/store/payment-collections", {
    method: "POST",
    body: JSON.stringify({ cart_id: cartId }),
    cache: "no-store",
  });

  // Reuse an existing Stripe session if one is already attached — avoids
  // accumulating multiple PaymentIntents across repeated checkout visits.
  const existingSecret = payment_collection.payment_sessions?.find(
    (s) => s.provider_id === "pp_stripe_stripe" && s.data?.client_secret
  )?.data?.client_secret;

  if (existingSecret) return { clientSecret: existingSecret };

  // No session yet — create one; Medusa calls Stripe and returns a client_secret
  const { payment_collection: withSession } = await apiFetch<{
    payment_collection: MedusaPaymentCollection;
  }>(`/store/payment-collections/${payment_collection.id}/payment-sessions`, {
    method: "POST",
    body: JSON.stringify({ provider_id: "pp_stripe_stripe" }),
    cache: "no-store",
  });

  const clientSecret = withSession.payment_sessions?.find(
    (s) => s.provider_id === "pp_stripe_stripe"
  )?.data?.client_secret;
  if (!clientSecret) throw new Error("Failed to create Stripe payment session");

  return { clientSecret };
}
