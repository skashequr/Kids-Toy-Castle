import { connectDB } from "../db/connect";
import { AnalyticsEvent } from "../models/AnalyticsEvent";
import { Order } from "../models/Order";

export const ANALYTICS_PERIODS = [7, 30, 90, 180, 365] as const;
export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];

export type AnalyticsDashboard = {
  periodDays: AnalyticsPeriod;
  summary: {
    visitors: number;
    pageViews: number;
    productViews: number;
    addToCarts: number;
    checkoutStarts: number;
    orders: number;
    revenue: number;
    conversionRate: number;
  };
  series: Array<{ id: string; label: string; visitors: number; addToCarts: number; orders: number; revenue: number }>;
  topProducts: Array<{ name: string; sales: number; revenue: number }>;
};

type EventRow = { type: string; sessionId: string; createdAt: Date };
type OrderRow = {
  createdAt: Date;
  status: string;
  total: number;
  items: Array<{ name: string; quantity: number; price: number }>;
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function bucketSize(days: AnalyticsPeriod) {
  if (days <= 30) return 1;
  if (days <= 90) return 7;
  return 30;
}

function bucketLabel(date: Date, days: AnalyticsPeriod) {
  if (days <= 30) return new Intl.DateTimeFormat("en-BD", { month: "short", day: "numeric" }).format(date);
  return new Intl.DateTimeFormat("en-BD", { month: "short", year: "2-digit" }).format(date);
}

export async function getAnalyticsDashboard(periodDays: AnalyticsPeriod): Promise<AnalyticsDashboard> {
  await connectDB();

  const today = startOfDay(new Date());
  const start = new Date(today);
  start.setDate(start.getDate() - (periodDays - 1));

  const [events, orders] = await Promise.all([
    AnalyticsEvent.find({ createdAt: { $gte: start } }).select("type sessionId createdAt").lean(),
    Order.find({ createdAt: { $gte: start } }).select("createdAt status total items").lean(),
  ]);

  const eventRows = events as unknown as EventRow[];
  const orderRows = orders as unknown as OrderRow[];
  const activeOrders = orderRows.filter((order) => !["cancelled", "returned"].includes(order.status));
  const visitors = new Set(eventRows.filter((event) => event.type === "page_view").map((event) => event.sessionId));

  const size = bucketSize(periodDays);
  const bucketStarts: Date[] = [];
  for (let offset = 0; offset < periodDays; offset += size) {
    const date = new Date(start);
    date.setDate(date.getDate() + offset);
    bucketStarts.push(date);
  }
  const series = bucketStarts.map((date) => ({
    id: date.toISOString(),
    label: bucketLabel(date, periodDays),
    visitors: 0,
    addToCarts: 0,
    orders: 0,
    revenue: 0,
    sessions: new Set<string>(),
  }));

  const bucketIndex = (date: Date) => {
    const elapsed = Math.max(0, startOfDay(date).getTime() - start.getTime());
    return Math.min(series.length - 1, Math.floor(elapsed / (size * 86_400_000)));
  };

  for (const event of eventRows) {
    const bucket = series[bucketIndex(event.createdAt)];
    if (event.type === "page_view") bucket.sessions.add(event.sessionId);
    if (event.type === "add_to_cart") bucket.addToCarts += 1;
  }
  for (const order of activeOrders) {
    const bucket = series[bucketIndex(order.createdAt)];
    bucket.orders += 1;
    bucket.revenue += Number(order.total) || 0;
  }

  const products = new Map<string, { sales: number; revenue: number }>();
  for (const order of activeOrders) {
    for (const item of order.items ?? []) {
      const record = products.get(item.name) ?? { sales: 0, revenue: 0 };
      record.sales += Number(item.quantity) || 0;
      record.revenue += (Number(item.quantity) || 0) * (Number(item.price) || 0);
      products.set(item.name, record);
    }
  }

  const addToCarts = eventRows.filter((event) => event.type === "add_to_cart").length;
  return {
    periodDays,
    summary: {
      visitors: visitors.size,
      pageViews: eventRows.filter((event) => event.type === "page_view").length,
      productViews: eventRows.filter((event) => event.type === "product_view").length,
      addToCarts,
      checkoutStarts: eventRows.filter((event) => event.type === "checkout_started").length,
      orders: activeOrders.length,
      revenue: activeOrders.reduce((total, order) => total + (Number(order.total) || 0), 0),
      conversionRate: visitors.size ? Number(((activeOrders.length / visitors.size) * 100).toFixed(1)) : 0,
    },
    series: series.map(({ sessions, ...point }) => ({ ...point, visitors: sessions.size })),
    topProducts: [...products.entries()]
      .map(([name, values]) => ({ name, ...values }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5),
  };
}
