export type ProductStatus = "draft" | "published" | "archived";

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
}

export interface ProductVariant {
  id: string;
  title: string;
  sku?: string;
  priceAmount: number;
  currency: string;
  inventoryQuantity: number;
  options: Record<string, string>;
}

export interface ProductCategory {
  id: string;
  name: string;
  handle: string;
}

export interface Product {
  id: string;
  title: string;
  handle: string;
  description?: string;
  status: ProductStatus;
  thumbnail?: string;
  images: ProductImage[];
  variants: ProductVariant[];
  categories: ProductCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResponse {
  products: Product[];
  count: number;
  offset: number;
  limit: number;
}

export interface ProductFilters {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: ProductStatus;
  q?: string;
  limit?: number;
  offset?: number;
}
