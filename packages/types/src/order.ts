export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus = "awaiting" | "captured" | "refunded" | "failed";

export interface OrderAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  postalCode: string;
  countryCode: string;
  phone?: string;
}

export interface OrderLineItem {
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

export interface Order {
  id: string;
  displayId: number;
  customerId: string;
  email: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  items: OrderLineItem[];
  shippingAddress: OrderAddress;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  total: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderListResponse {
  orders: Order[];
  count: number;
  offset: number;
  limit: number;
}
