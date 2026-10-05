"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "../db/connect";
import { Order } from "../models/Order";
import { Product } from "../models/Product";
import { Customer } from "../models/Customer";
import { requireAdmin } from "../guard";
import { validateCheckoutContact } from "@/lib/checkout-validation";

export type OrderItemInput = {
  productId?: string;
  name: string;
  slug?: string;
  image?: string;
  variantLabel?: string;
  variantId?: string;
  variantSku?: string;
  quantity: number;
  price: number;
};

export type CreateOrderInput = {
  fullName: string;
  email?: string;
  phone: string;
  address: string;
  area?: string;
  city?: string;
  district?: string;
  postalCode?: string;
  items: OrderItemInput[];
  subtotal: number;
  discount?: number;
  shipping?: number;
  total: number;
  couponCode?: string;
  giftWrap?: boolean;
  orderNotes?: string;
  paymentMethod?: string;
};

function generateOrderNumber() {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `LXN-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

export async function createOrder(
  input: CreateOrderInput
): Promise<{ ok: boolean; orderNumber?: string; error?: string }> {
  await connectDB();

  if (!input.items?.length) return { ok: false, error: "Cart is empty." };
  const contactErrors = validateCheckoutContact(input);
  if (Object.keys(contactErrors).length) return { ok: false, error: Object.values(contactErrors).join(". ") };
  input = {
    ...input,
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    address: input.address.trim(),
    email: input.email?.trim() || undefined,
    city: input.city?.trim() || "",
    district: input.district?.trim() || "",
    area: input.area?.trim() || "",
  };

  // Resolve the selected variant from the catalog; never trust a client label or image.
  const resolvedItems: OrderItemInput[] = [];
  const requested = new Map<string, number>();
  for (const item of input.items) {
    if (!item.productId || !/^[a-f0-9]{24}$/i.test(item.productId) || !Number.isInteger(item.quantity) || item.quantity < 1) {
      return { ok: false, error: "Invalid cart item. Please add the product again." };
    }
    const product = await Product.findById(item.productId).lean();
    if (!product || !product.isActive) return { ok: false, error: "This product is no longer available." };
    const variant = product.variants?.find((v) => String(v._id) === item.variantId);
    if ((product.variants?.length && !variant) || (item.variantId && !variant)) {
      return { ok: false, error: "Please select an available variant and add it to your cart again." };
    }
    const key = item.productId + ":" + (item.variantId ?? "");
    const count = (requested.get(key) ?? 0) + item.quantity;
    requested.set(key, count);
    if (count > (variant?.stock ?? product.stock)) return { ok: false, error: "The selected product or variant has insufficient stock." };
    if (variant && item.price !== (variant.price ?? product.price)) return { ok: false, error: "Variant price has changed. Please add it to your cart again." };
    resolvedItems.push({
      ...item,
      name: product.name,
      slug: product.slug,
      image: variant?.image || product.images?.[0]?.url,
      variantId: variant ? String(variant._id) : undefined,
      variantSku: variant?.sku,
      variantLabel: variant ? [variant.name, variant.color, variant.size].filter(Boolean).join(" / ") || variant.sku : undefined,
    });
  }
  const orderNumber = generateOrderNumber();
  await Order.create({
    orderNumber,
    customerEmail: input.email?.toLowerCase(),
    items: resolvedItems,
    shippingAddress: {
      fullName: input.fullName,
      phone: input.phone,
      email: input.email,
      address: input.address,
      area: input.area,
      city: input.city,
      district: input.district,
      postalCode: input.postalCode,
    },
    subtotal: input.subtotal,
    discount: input.discount ?? 0,
    shipping: input.shipping ?? 0,
    total: input.total,
    couponCode: input.couponCode,
    giftWrap: false,
    orderNotes: input.orderNotes,
    paymentMethod: input.paymentMethod ?? "cash_on_delivery",
    paymentStatus: "pending",
    status: "pending",
  });

  // Upsert a customer record keyed by email.
  if (input.email) {
    await Customer.updateOne(
      { email: input.email.toLowerCase() },
      {
        $set: {
          name: input.fullName,
          phone: input.phone,
          city: input.city,
          lastOrderAt: new Date(),
        },
        $inc: { ordersCount: 1, totalSpent: input.total },
        $setOnInsert: { email: input.email.toLowerCase(), isActive: true },
      },
      { upsert: true }
    );
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin/customers");
  return { ok: true, orderNumber };
}

export async function createAdminOrder(
  input: CreateOrderInput & { status?: string; paymentStatus?: string }
): Promise<{ ok: boolean; orderNumber?: string; error?: string }> {
  await requireAdmin();
  await connectDB();

  if (!input.items?.length) return { ok: false, error: "Cart is empty." };
  if (!input.fullName || !input.phone || !input.address || !input.city) {
    return { ok: false, error: "Missing required shipping details." };
  }

  if (input.items.some((item) => !item.name.trim() || !Number.isInteger(item.quantity) || item.quantity < 1 || !Number.isFinite(item.price) || item.price < 0)) return { ok: false, error: "Enter a valid item, quantity and price." };
  const subtotal = Math.round(input.items.reduce((sum, item) => sum + item.quantity * item.price, 0) * 100) / 100;
  const discount = input.discount ?? 0;
  const shipping = input.shipping ?? 0;
  if (![discount, shipping].every((n) => Number.isFinite(n) && n >= 0) || discount > subtotal) return { ok: false, error: "Invalid discount or shipping amount." };
  if (input.status && !["pending", "confirmed", "processing", "shipped", "delivered", "returned", "cancelled"].includes(input.status)) return { ok: false, error: "Invalid status." };
  input = { ...input, subtotal, discount, shipping, total: Math.round((subtotal - discount + shipping) * 100) / 100 };
  const orderNumber = generateOrderNumber();
  await Order.create({
    orderNumber,
    deliveredAt: input.status === "delivered" ? new Date() : undefined,
    customerEmail: input.email?.toLowerCase(),
    items: input.items,
    shippingAddress: {
      fullName: input.fullName,
      phone: input.phone,
      email: input.email,
      address: input.address,
      area: input.area,
      city: input.city,
      district: input.district,
      postalCode: input.postalCode,
    },
    subtotal: input.subtotal,
    discount: input.discount ?? 0,
    shipping: input.shipping ?? 0,
    total: input.total,
    couponCode: input.couponCode,
    giftWrap: input.giftWrap ?? false,
    orderNotes: input.orderNotes,
    paymentMethod: input.paymentMethod ?? "cash_on_delivery",
    paymentStatus: input.paymentStatus ?? "pending",
    status: input.status ?? "pending",
  });

  // Upsert a customer record keyed by email.
  if (input.email) {
    await Customer.updateOne(
      { email: input.email.toLowerCase() },
      {
        $set: {
          name: input.fullName,
          phone: input.phone,
          city: input.city,
          lastOrderAt: new Date(),
        },
        $inc: { ordersCount: 1, totalSpent: input.total },
        $setOnInsert: { email: input.email.toLowerCase(), isActive: true },
      },
      { upsert: true }
    );
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin/customers");
  return { ok: true, orderNumber };
}

export async function updateOrderStatus(id: string, status: string) {
  return updateOrderDelivery(id, { status });
}

/** Internal admin note shared by the Orders and Delivery workspaces. */
export async function updateOrderNotes(id: string, notes: string) {
  return updateOrderDelivery(id, { notes });
}

export async function updateOrderDelivery(
  id: string,
  input: {
    courier?: string;
    trackingNumber?: string;
    estimatedDelivery?: string;
    status?: string;
    notes?: string;
  }
) {
  await requireAdmin();
  await connectDB();
  if (!/^[a-f0-9]{24}$/i.test(id)) return { ok: false, error: "Invalid order ID." };
  const statuses = ["pending", "confirmed", "processing", "shipped", "delivered", "returned", "cancelled"];
  if (input.status !== undefined && !statuses.includes(input.status)) return { ok: false, error: "Invalid order status." };
  if (input.estimatedDelivery && Number.isNaN(Date.parse(input.estimatedDelivery))) return { ok: false, error: "Invalid delivery date." };
  const existing = await Order.findById(id).select("deliveredAt").lean();
  if (!existing) return { ok: false, error: "Order no longer exists. Refresh the page." };
  const update: Record<string, unknown> = {};
  if (input.status === "delivered" && !existing.deliveredAt) update.deliveredAt = new Date();
  if (input.courier !== undefined) update.courier = input.courier;
  if (input.trackingNumber !== undefined) update.trackingNumber = input.trackingNumber;
  if (input.estimatedDelivery !== undefined) update.estimatedDelivery = input.estimatedDelivery ? new Date(input.estimatedDelivery) : null;
  if (input.status !== undefined) update.status = input.status;
  if (input.notes !== undefined) update.orderNotes = input.notes.trim();
  const result = await Order.updateOne({ _id: id }, { $set: update }, { runValidators: true });
  if (!result.matchedCount) return { ok: false, error: "Order no longer exists." };
  revalidatePath("/admin");
  revalidatePath("/admin/finance");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/delivery");
  return { ok: true };
}

export type TrackedOrder = {
  orderNumber: string;
  status: string;
  courier: string | null;
  trackingNumber: string | null;
  estimatedDelivery: string | null;
  total: number;
  createdAt: string;
};

/** Public order lookup for the Track Order page. */
export async function trackOrder(
  orderNumber: string
): Promise<{ ok: boolean; order?: TrackedOrder }> {
  await connectDB();
  const doc = await Order.findOne({ orderNumber: orderNumber.trim().toUpperCase() }).lean();
  if (!doc) return { ok: false };
  return {
    ok: true,
    order: {
      orderNumber: doc.orderNumber,
      status: doc.status ?? "pending",
      courier: doc.courier ?? null,
      trackingNumber: doc.trackingNumber ?? null,
      estimatedDelivery: doc.estimatedDelivery
        ? new Date(doc.estimatedDelivery as Date).toISOString()
        : null,
      total: doc.total ?? 0,
      createdAt: new Date(doc.createdAt as Date).toISOString(),
    },
  };
}
