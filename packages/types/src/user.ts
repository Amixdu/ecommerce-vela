export interface UserAddress {
  id: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  postalCode: string;
  countryCode: string;
  phone?: string;
  isDefault: boolean;
}

export interface User {
  id: string;
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  addresses: UserAddress[];
  createdAt: string;
  updatedAt: string;
}
