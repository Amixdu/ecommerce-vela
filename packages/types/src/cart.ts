export interface CartLineItem {
  id: string;
  variantId: string;
  productId: string;
  title: string;
  variantTitle: string;
  thumbnail?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
}

export interface CartTotals {
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  total: number;
  currency: string;
}

export interface Cart {
  id: string;
  customerId?: string;
  email?: string;
  items: CartLineItem[];
  totals: CartTotals;
  regionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddToCartPayload {
  variantId: string;
  quantity: number;
}

export interface UpdateCartItemPayload {
  itemId: string;
  quantity: number;
}
