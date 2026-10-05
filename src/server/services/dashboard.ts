import { connectDB } from "../db/connect";
import { AnalyticsEvent } from "../models/AnalyticsEvent";
import { Order } from "../models/Order";
import { Review } from "../models/Review";
import { toOrder } from "../mappers";
import type { Order as OrderType } from "@/types";

const BANGLADESH_OFFSET = "+06:00";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type DashboardDateRange = { from: string; to: string };

export type DashboardStats = {
  range: DashboardDateRange;
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  pendingReviews: number;
  pageViews: number;
  conversionRate: number;
  refundRate: number;
  recentOrders: OrderType[];
  topProducts: Array<{ id: string; name: string; unitsSold: number; revenue: number }>;
};

export type DashboardExportRow = {
  orderNumber: string;
  createdAt: Date;
  customer: string;
  email: string;
  phone: string;
  items: string;
  quantity: number;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
};

type DashboardOrderRow = {
  _id: unknown;
  orderNumber: string;
  createdAt: Date;
  customerEmail?: string;
  items: Array<{ productId?: unknown; name: string; variantLabel?: string; variantSku?: string; quantity: number; price: number }>;
  shippingAddress: { fullName?: string; phone?: string; email?: string };
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
};

function datePartsInBangladesh(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function shiftDate(value: string, days: number) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function isValidDate(value: string | null | undefined): value is string {
  if (!value || !DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

export function getDefaultDashboardRange(): DashboardDateRange {
  const to = datePartsInBangladesh();
  return { from: shiftDate(to, -29), to };
}

export function normalizeDashboardRange(from?: string | null, to?: string | null): DashboardDateRange {
  if (!isValidDate(from) || !isValidDate(to) || from > to) return getDefaultDashboardRange();
  return { from, to };
}

function rangeQuery(range: DashboardDateRange) {
  return {
    $gte: new Date(`${range.from}T00:00:00${BANGLADESH_OFFSET}`),
    $lt: new Date(`${shiftDate(range.to, 1)}T00:00:00${BANGLADESH_OFFSET}`),
  };
}

export async function getDashboardStats(input?: DashboardDateRange): Promise<DashboardStats> {
  await connectDB();
  const range = normalizeDashboardRange(input?.from, input?.to);
  const createdAt = rangeQuery(range);

  const [orderDocs, pendingReviews, events] = await Promise.all([
    Order.find({ createdAt }).sort({ createdAt: -1 }).lean(),
    Review.countDocuments({ status: "pending", createdAt }),
    AnalyticsEvent.find({ createdAt }).select("type sessionId").lean(),
  ]);

  const orders = orderDocs as unknown as DashboardOrderRow[];
  const activeOrders = orders.filter((order) => !["cancelled", "returned"].includes(order.status));
  const returnedOrders = orders.filter((order) => order.status === "returned");
  const visitorSessions = new Set(events.filter((event) => event.type === "page_view").map((event) => event.sessionId));
  const customerKeys = new Set(
    orders
      .map((order) => order.customerEmail ?? order.shippingAddress.email ?? order.shippingAddress.phone)
      .filter((value): value is string => Boolean(value))
  );
  const products = new Map<string, { id: string; name: string; unitsSold: number; revenue: number }>();

  for (const order of activeOrders) {
    for (const item of order.items ?? []) {
      const id = item.productId ? String(item.productId) : item.name;
      const product = products.get(id) ?? { id, name: item.name, unitsSold: 0, revenue: 0 };
      const quantity = Number(item.quantity) || 0;
      product.unitsSold += quantity;
      product.revenue += quantity * (Number(item.price) || 0);
      products.set(id, product);
    }
  }

  return {
    range,
    totalRevenue: activeOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0),
    totalOrders: orders.length,
    totalProducts: activeOrders.reduce(
      (sum, order) => sum + (order.items ?? []).reduce((itemSum, item) => itemSum + (Number(item.quantity) || 0), 0),
      0
    ),
    totalCustomers: customerKeys.size,
    pendingReviews,
    pageViews: events.filter((event) => event.type === "page_view").length,
    conversionRate: visitorSessions.size ? Number(((activeOrders.length / visitorSessions.size) * 100).toFixed(1)) : 0,
    refundRate: orders.length ? Number(((returnedOrders.length / orders.length) * 100).toFixed(1)) : 0,
    recentOrders: orderDocs.slice(0, 5).map(toOrder),
    topProducts: [...products.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
  };
}

export async function getDashboardExportRows(input?: DashboardDateRange): Promise<DashboardExportRow[]> {
  await connectDB();
  const range = normalizeDashboardRange(input?.from, input?.to);
  const docs = await Order.find({ createdAt: rangeQuery(range) }).sort({ createdAt: -1 }).lean();
  const orders = docs as unknown as DashboardOrderRow[];

  return orders.map((order) => ({
    orderNumber: order.orderNumber,
    createdAt: new Date(order.createdAt),
    customer: order.shippingAddress.fullName ?? "",
    email: order.customerEmail ?? order.shippingAddress.email ?? "",
    phone: order.shippingAddress.phone ?? "",
    items: (order.items ?? []).map((item) => `${item.name}${item.variantLabel ? ` (${item.variantLabel})` : ""}${item.variantSku ? ` [${item.variantSku}]` : ""} x${item.quantity}`).join(", "),
    quantity: (order.items ?? []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    subtotal: Number(order.subtotal) || 0,
    discount: Number(order.discount) || 0,
    shipping: Number(order.shipping) || 0,
    total: Number(order.total) || 0,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
  }));
}
