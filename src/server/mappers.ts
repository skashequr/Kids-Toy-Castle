/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  Category,
  Product,
  ProductImage,
  ProductVariant,
  Review,
  BlogPost,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  FlashSaleProduct,
} from "@/types";

/** Stringify a Mongo _id / ObjectId safely. */
function id(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "_id" in value) return String(value._id);
  return String(value);
}

function iso(value: any): string {
  if (!value) return new Date().toISOString();
  return new Date(value).toISOString();
}

export function toCategory(doc: any): Category {
  return {
    id: id(doc._id ?? doc.id),
    name: doc.name,
    slug: doc.slug,
    image: doc.image ?? "",
    description: doc.description ?? undefined,
    productCount: doc.productCount ?? undefined,
  };
}

export function toProduct(doc: any): Product {
  const cat = doc.category;
  const category: Category =
    cat && typeof cat === "object" && cat.name
      ? toCategory(cat)
      : { id: id(cat), name: "", slug: "", image: "" };

  const images: ProductImage[] = (doc.images ?? []).map((img: any) => ({
    id: id(img._id ?? img.id),
    url: img.url,
    alt: img.alt ?? "",
    isPrimary: img.isPrimary ?? false,
  }));

  const variants: ProductVariant[] | undefined =
    doc.variants && doc.variants.length
      ? doc.variants.map((v: any) => ({
          id: id(v._id ?? v.id),
          image: v.image ?? undefined,
          name: v.name ?? undefined,
          color: v.color ?? undefined,
          colorHex: v.colorHex ?? undefined,
          size: v.size ?? undefined,
          stock: v.stock ?? 0,
          sku: v.sku,
          price: v.price ?? undefined,
        }))
      : undefined;

  return {
    id: id(doc._id ?? doc.id),
    name: doc.name,
    slug: doc.slug,
    description: doc.description ?? "",
    highlights: doc.highlights ?? [],
    price: doc.price,
    comparePrice: doc.comparePrice ?? undefined,
    category,
    images,
    variants,
    tags: doc.tags ?? [],
    sku: doc.sku,
    stock: doc.stock ?? 0,
    rating: doc.rating ?? 0,
    reviewCount: doc.reviewCount ?? 0,
    isNew: doc.isNewArrival ?? doc.isNew ?? false,
    isFeatured: doc.isFeatured ?? false,
    isBestSeller: doc.isBestSeller ?? false,
    isOnSale: doc.isOnSale ?? false,
    saleEndsAt: doc.saleEndsAt ? iso(doc.saleEndsAt) : undefined,
    specifications: (doc.specifications as Record<string, string>) ?? undefined,
    brand: doc.brand ?? undefined,
    weight: doc.weight ?? undefined,
    dimensions: doc.dimensions ?? undefined,
    material: doc.material ?? undefined,
    displayOrder: doc.displayOrder ?? 0,
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

export function toReview(doc: any): Review {
  return {
    id: id(doc._id ?? doc.id),
    user: { id: id(doc.userEmail ?? doc._id), name: doc.userName, avatar: undefined },
    product: { id: id(doc.product), name: doc.productName ?? "" },
    rating: doc.rating,
    title: doc.title ?? undefined,
    body: doc.body,
    images: doc.images ?? undefined,
    isVerified: doc.isVerified ?? false,
    helpful: doc.helpful ?? 0,
    createdAt: iso(doc.createdAt),
  };
}

export function toBlogPost(doc: any): BlogPost {
  return {
    id: id(doc._id ?? doc.id),
    title: doc.title,
    slug: doc.slug,
    excerpt: doc.excerpt ?? "",
    body: doc.body ?? "",
    coverImage: doc.coverImage ?? "",
    author: { name: doc.authorName ?? "Luxen Editorial" },
    category: doc.category ?? "",
    tags: doc.tags ?? undefined,
    readTime: doc.readTime ?? undefined,
    publishedAt: iso(doc.publishedAt ?? doc.createdAt),
  };
}

export function toFlashSaleProduct(doc: any): FlashSaleProduct {
  // doc.product must be a populated Product document.
  const base = toProduct(doc.product);
  return {
    ...base,
    flashPrice: doc.flashPrice,
    flashStock: doc.flashStock ?? 0,
    soldCount: doc.soldCount ?? 0,
    saleEndsAt: iso(doc.saleEndsAt),
  };
}

export function toOrder(doc: any): Order {
  const addr = doc.shippingAddress ?? {};
  return {
    id: id(doc._id ?? doc.id),
    orderNumber: doc.orderNumber,
    user: {
      id: id(doc.customerEmail ?? doc._id),
      name: addr.fullName ?? "",
      email: addr.email ?? doc.customerEmail ?? "",
      createdAt: iso(doc.createdAt),
    },
    items: (doc.items ?? []).map((it: any) => ({
      id: id(it.productId ?? it._id),
      variantId: it.variantId,
      variantLabel: it.variantLabel,
      variantSku: it.variantSku,
      product: {
        id: id(it.productId),
        name: it.name,
        slug: it.slug ?? "",
        description: "",
        price: it.price,
        category: { id: "", name: "", slug: "", image: "" },
        images: it.image ? [{ id: "", url: it.image, alt: it.name }] : [],
        sku: "",
        stock: 0,
        rating: 0,
        reviewCount: 0,
        createdAt: iso(doc.createdAt),
        updatedAt: iso(doc.createdAt),
      },
      quantity: it.quantity,
      price: it.price,
    })),
    shippingAddress: {
      id: id(doc._id),
      fullName: addr.fullName ?? "",
      phone: addr.phone ?? "",
      email: addr.email ?? undefined,
      address: addr.address ?? "",
      area: addr.area ?? "",
      city: addr.city ?? "",
      district: addr.district ?? "",
      postalCode: addr.postalCode ?? undefined,
    },
    status: (doc.status ?? "pending") as OrderStatus,
    paymentMethod: (doc.paymentMethod ?? "cash_on_delivery") as PaymentMethod,
    paymentStatus: (doc.paymentStatus ?? "pending") as PaymentStatus,
    subtotal: doc.subtotal ?? 0,
    discount: doc.discount ?? 0,
    shipping: doc.shipping ?? 0,
    total: doc.total ?? 0,
    couponCode: doc.couponCode ?? undefined,
    trackingNumber: doc.trackingNumber ?? undefined,
    courier: doc.courier ?? undefined,
    courierConsignmentId: doc.courierConsignmentId ?? undefined,
    courierStatus: doc.courierStatus ?? undefined,
    courierTrackingMessage: doc.courierTrackingMessage ?? undefined,
    courierTrackingHistory: doc.courierTrackingHistory?.map((event: { message?: string; status?: string; updatedAt?: Date }) => ({ message: event.message ?? "", status: event.status ?? undefined, updatedAt: iso(event.updatedAt) })),
    courierDeliveryCharge: doc.courierDeliveryCharge ?? undefined,
    courierCodAmount: doc.courierCodAmount ?? undefined,
    courierUpdatedAt: doc.courierUpdatedAt ? iso(doc.courierUpdatedAt) : undefined,
    courierStatusUpdatedAt: doc.courierStatusUpdatedAt ? iso(doc.courierStatusUpdatedAt) : undefined,
    courierReturnRequestId: doc.courierReturnRequestId ?? undefined,
    courierReturnStatus: doc.courierReturnStatus ?? undefined,
    notes: doc.orderNotes ?? undefined,
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
    estimatedDelivery: doc.estimatedDelivery ? iso(doc.estimatedDelivery) : undefined,
  };
}
