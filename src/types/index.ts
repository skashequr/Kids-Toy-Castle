export type ProductCategory =
  | "watches"
  | "wallets"
  | "mens-apparel"
  | "womens-apparel"
  | "cosmetics"
  | "perfumes"
  | "bags"
  | "sunglasses"
  | "lifestyle-accessories"
  | "gift-items"
  | "sunnah-items"
  | "gadgets";

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  description?: string;
  productCount?: number;
  parent?: string; // parent category slug for subcategories
}

export interface ProductVariant {
  image?: string;
  name?: string;
  id: string;
  color?: string;
  colorHex?: string;
  size?: string;
  stock: number;
  sku: string;
  price?: number;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary?: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  highlights?: string[];
  price: number;
  comparePrice?: number;
  category: Category;
  images: ProductImage[];
  variants?: ProductVariant[];
  tags?: string[];
  sku: string;
  stock: number;
  rating: number;
  reviewCount: number;
  isNew?: boolean;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isOnSale?: boolean;
  saleEndsAt?: string;
  specifications?: Record<string, string>;
  brand?: string;
  weight?: string;
  dimensions?: string;
  material?: string;
  displayOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  price: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponCode?: string;
  giftWrap?: boolean;
  orderNotes?: string;
}

export interface WishlistItem {
  id: string;
  product: Product;
  addedAt: string;
}

export interface Address {
  id: string;
  label?: string;
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  area: string;
  city: string;
  district: string;
  postalCode?: string;
  isDefault?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  loyaltyPoints?: number;
  addresses?: Address[];
  createdAt: string;
}

export interface OrderItem {
  variantId?: string;
  variantLabel?: string;
  variantSku?: string;
  id: string;
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  price: number;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "returned"
  | "cancelled";

export type PaymentMethod =
  | "cash_on_delivery"
  | "bkash"
  | "nagad"
  | "rocket"
  | "sslcommerz"
  | "visa"
  | "mastercard";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface Order {
  id: string;
  orderNumber: string;
  user: User;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress?: Address;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponCode?: string;
  trackingNumber?: string;
  courier?: string;
  courierConsignmentId?: number;
  courierStatus?: string;
  courierTrackingMessage?: string;
  courierTrackingHistory?: Array<{ message: string; status?: string; updatedAt: string }>;
  courierDeliveryCharge?: number;
  courierCodAmount?: number;
  courierUpdatedAt?: string;
  courierStatusUpdatedAt?: string;
  courierReturnRequestId?: number;
  courierReturnStatus?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
}

export interface Review {
  id: string;
  user: Pick<User, "id" | "name" | "avatar">;
  product: Pick<Product, "id" | "name">;
  rating: number;
  title?: string;
  body: string;
  images?: string[];
  isVerified?: boolean;
  helpful?: number;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverImage: string;
  author: {
    name: string;
    avatar?: string;
  };
  category: string;
  tags?: string[];
  readTime?: number;
  publishedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount?: number;
  expiresAt?: string;
  isActive: boolean;
}

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
  badge?: string;
  image?: string;
}

export interface FilterState {
  category?: string[];
  brand?: string[];
  priceMin?: number;
  priceMax?: number;
  color?: string[];
  size?: string[];
  gender?: string[];
  rating?: number;
  inStock?: boolean;
  sortBy?: "store-order" | "newest" | "popular" | "price-asc" | "price-desc" | "best-selling";
}

export type SortOption = {
  label: string;
  value: NonNullable<FilterState["sortBy"]>;
};

export interface FlashSaleProduct extends Product {
  flashPrice: number;
  flashStock: number;
  soldCount: number;
  saleEndsAt: string;
}
