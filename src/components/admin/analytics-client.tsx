"use client";

import { useState } from "react";
import { Eye, MousePointerClick, ShoppingBag, TrendingUp, Users, Wallet } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import type { AnalyticsDashboard, AnalyticsPeriod } from "@/server/services/analytics";

const PERIODS: Array<{ value: AnalyticsPeriod; label: string }> = [
  { value: 7, label: "7 days" },
  { value: 30, label: "1 month" },
  { value: 90, label: "3 months" },
  { value: 180, label: "6 months" },
  { value: 365, label: "1 year" },
];

function MetricCard({ label, value, hint, icon: Icon, tone }: { label: string; value: string; hint: string; icon: typeof Users; tone: "blue" | "pink" | "yellow" | "green" | "purple" }) {
  const tones = { blue: "bg-[#e4f5ff] text-[#248fd6]", pink: "bg-[#fff0f5] text-[#e8548b]", yellow: "bg-[#fff5d5] text-[#bc7c00]", green: "bg-[#e9f8ec] text-[#34784c]", purple: "bg-[#f0e8ff] text-[#7653a8]" };
  return <div className="rounded-2xl border border-[#d8edf9] bg-white p-4 shadow-sm"><div className="mb-4 flex items-start justify-between"><span className={cn("grid h-10 w-10 place-items-center rounded-xl", tones[tone])}><Icon className="h-5 w-5" /></span></div><p className="text-2xl font-black text-[#234963]">{value}</p><p className="mt-1 text-sm font-bold text-[#54758b]">{label}</p><p className="mt-1 text-xs text-[#8aa1b0]">{hint}</p></div>;
}

export function AdminAnalyticsClient({ initial }: { initial: AnalyticsDashboard }) {
  const [period, setPeriod] = useState<AnalyticsPeriod>(initial.periodDays);
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(false);
  const maxActivity = Math.max(1, ...data.series.map((point) => Math.max(point.visitors, point.addToCarts, point.orders)));
  const maxRevenue = Math.max(1, ...data.series.map((point) => point.revenue));
  const funnelBase = Math.max(1, data.summary.visitors);

  const selectPeriod = async (nextPeriod: AnalyticsPeriod) => {
    if (nextPeriod === period || loading) return;
    setPeriod(nextPeriod); setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?period=${nextPeriod}`, { cache: "no-store" });
      if (response.ok) setData(await response.json() as AnalyticsDashboard);
      else setPeriod(data.periodDays);
    } catch {
      setPeriod(data.periodDays);
    } finally { setLoading(false); }
  };

  const metrics = [
    { label: "Unique visitors", value: data.summary.visitors.toLocaleString(), hint: `${data.summary.pageViews.toLocaleString()} page views`, icon: Users, tone: "blue" as const },
    { label: "Product views", value: data.summary.productViews.toLocaleString(), hint: "Product detail page interest", icon: Eye, tone: "purple" as const },
    { label: "Added to cart", value: data.summary.addToCarts.toLocaleString(), hint: `${data.summary.checkoutStarts.toLocaleString()} checkout starts`, icon: ShoppingBag, tone: "pink" as const },
    { label: "Orders", value: data.summary.orders.toLocaleString(), hint: `${data.summary.conversionRate}% visitor conversion`, icon: MousePointerClick, tone: "green" as const },
    { label: "Revenue", value: formatPrice(data.summary.revenue), hint: "Excludes cancelled and returned", icon: Wallet, tone: "yellow" as const },
  ];

  return <div className="mx-auto max-w-7xl space-y-5 pb-8">
    <section className="relative overflow-hidden rounded-[2rem] bg-[#238fda] px-6 py-7 text-white shadow-[0_16px_38px_rgba(35,143,218,0.22)] sm:px-8">
      <div className="absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/10" /><div className="absolute bottom-0 right-28 h-20 w-20 rounded-t-full bg-[#f9c55b]/25" />
      <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-white/75">Growth center</p><h1 className="mt-1 text-3xl font-black tracking-tight">Analytics</h1><p className="mt-1 text-sm text-white/85">See how shoppers discover toys, add them to their bag, and complete orders.</p></div><div className="flex flex-wrap gap-1 rounded-xl bg-white/15 p-1">{PERIODS.map((option) => <button key={option.value} onClick={() => void selectPeriod(option.value)} className={cn("rounded-lg px-3 py-2 text-xs font-bold transition", period === option.value ? "bg-white text-[#248fd6] shadow-sm" : "text-white/85 hover:bg-white/15")} disabled={loading}>{option.label}</button>)}</div></div>
    </section>

    <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-5", loading && "animate-pulse opacity-70")}>{metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}</div>

    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_310px]">
      <div className="rounded-3xl border border-[#d8edf9] bg-white p-5 shadow-[0_10px_30px_rgba(35,143,218,0.08)]"><div className="mb-6 flex items-center justify-between"><div><h2 className="font-black text-[#234963]">Shopper activity</h2><p className="mt-1 text-xs text-[#7895aa]">Visitors, bags and orders across the selected period</p></div><TrendingUp className="h-5 w-5 text-[#248fd6]" /></div><div className="flex h-52 items-end gap-1.5 sm:gap-2">{data.series.map((point) => <div key={point.id} className="group flex h-full min-w-0 flex-1 flex-col justify-end"><div className="relative flex h-full items-end justify-center gap-px"><div className="w-1/3 rounded-t-md bg-[#d9effb] transition group-hover:bg-[#7ec8f0]" style={{ height: `${Math.max(point.visitors ? 8 : 0, (point.visitors / maxActivity) * 100)}%` }} /><div className="w-1/3 rounded-t-md bg-[#f9c6d7] transition group-hover:bg-[#f06a9f]" style={{ height: `${Math.max(point.addToCarts ? 8 : 0, (point.addToCarts / maxActivity) * 100)}%` }} /><div className="w-1/3 rounded-t-md bg-[#ccefd4] transition group-hover:bg-[#63b77a]" style={{ height: `${Math.max(point.orders ? 8 : 0, (point.orders / maxActivity) * 100)}%` }} /><div className="pointer-events-none absolute -top-12 z-10 hidden rounded-lg bg-[#234963] px-2 py-1.5 text-[10px] leading-4 text-white shadow-lg group-hover:block">{point.visitors} visitors<br />{point.addToCarts} carts · {point.orders} orders</div></div><span className="mt-2 truncate text-center text-[10px] font-bold text-[#7895aa]">{point.label}</span></div>)}</div><div className="mt-5 flex flex-wrap gap-4 text-xs font-bold text-[#7895aa]"><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-[#7ec8f0]" />Visitors</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-[#f06a9f]" />Added to cart</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-[#63b77a]" />Orders</span></div></div>
      <Funnel data={data} base={funnelBase} />
    </section>

    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_310px]">
      <div className="rounded-3xl border border-[#d8edf9] bg-white p-5 shadow-[0_10px_30px_rgba(35,143,218,0.08)]"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-black text-[#234963]">Revenue trend</h2><p className="mt-1 text-xs text-[#7895aa]">Valid order revenue by period</p></div><span className="rounded-full bg-[#fff5d5] px-2.5 py-1 text-xs font-bold text-[#bc7c00]">{formatPrice(data.summary.revenue)}</span></div><div className="flex h-40 items-end gap-1.5 sm:gap-2">{data.series.map((point) => <div key={point.id} className="group flex h-full min-w-0 flex-1 flex-col justify-end"><div className="relative flex h-full items-end"><div className="w-full rounded-t-lg bg-[#ffe2a0] transition group-hover:bg-[#f4b52d]" style={{ height: `${Math.max(point.revenue ? 7 : 0, (point.revenue / maxRevenue) * 100)}%` }} /><div className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#234963] px-2 py-1 text-[10px] text-white group-hover:block">{formatPrice(point.revenue)}</div></div><span className="mt-2 truncate text-center text-[10px] font-bold text-[#7895aa]">{point.label}</span></div>)}</div></div>
      <div className="rounded-3xl border border-[#d8edf9] bg-[#f7fcff] p-5"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#248fd6]">Data retention</p><h2 className="mt-2 font-black text-[#234963]">Your history stays available</h2><p className="mt-2 text-sm leading-6 text-[#6d899c]">Analytics events are stored continuously, so weekly, monthly, 3-month, 6-month and yearly reports all use real recorded data.</p><p className="mt-4 rounded-xl bg-white p-3 text-xs leading-5 text-[#7895aa]">Only anonymous browser session IDs and event types are recorded. Customer contact details are never used for analytics.</p></div>
    </section>

    <TopProducts products={data.topProducts} />
  </div>;
}

function Funnel({ data, base }: { data: AnalyticsDashboard; base: number }) {
  const steps = [{ label: "Visitors", value: data.summary.visitors, color: "bg-[#248fd6]" }, { label: "Product views", value: data.summary.productViews, color: "bg-[#8d69be]" }, { label: "Added to cart", value: data.summary.addToCarts, color: "bg-[#f06a9f]" }, { label: "Checkout started", value: data.summary.checkoutStarts, color: "bg-[#f4b52d]" }, { label: "Orders", value: data.summary.orders, color: "bg-[#63b77a]" }];
  return <div className="rounded-3xl border border-[#d8edf9] bg-white p-5 shadow-[0_10px_30px_rgba(35,143,218,0.08)]"><h2 className="font-black text-[#234963]">Shopping funnel</h2><p className="mt-1 text-xs text-[#7895aa]">From visit to checkout</p><div className="mt-6 space-y-5">{steps.map((step) => <div key={step.label}><div className="mb-1.5 flex justify-between text-xs"><span className="font-bold text-[#54758b]">{step.label}</span><span className="font-black text-[#234963]">{step.value.toLocaleString()}</span></div><div className="h-2 overflow-hidden rounded-full bg-[#edf6fb]"><div className={cn("h-full rounded-full", step.color)} style={{ width: `${Math.max(step.value ? 4 : 0, Math.min(100, (step.value / base) * 100))}%` }} /></div></div>)}</div></div>;
}

function TopProducts({ products }: { products: AnalyticsDashboard["topProducts"] }) {
  return <section className="overflow-hidden rounded-3xl border border-[#d8edf9] bg-white shadow-[0_10px_30px_rgba(35,143,218,0.08)]"><div className="border-b border-[#e7f2f8] px-5 py-4"><h2 className="font-black text-[#234963]">Top selling products</h2><p className="mt-1 text-xs text-[#7895aa]">Based on orders placed in this period</p></div>{products.length ? <div className="overflow-x-auto"><table className="min-w-[620px] w-full text-sm"><thead className="bg-[#f1faff] text-left text-xs font-bold uppercase tracking-wide text-[#7895aa]"><tr><th className="px-5 py-3">#</th><th className="px-5 py-3">Product</th><th className="px-5 py-3 text-center">Units sold</th><th className="px-5 py-3 text-right">Revenue</th></tr></thead><tbody className="divide-y divide-[#e7f2f8]">{products.map((product, index) => <tr key={product.name} className="hover:bg-[#f8fcff]"><td className="px-5 py-3.5 font-black text-[#248fd6]">{index + 1}</td><td className="px-5 py-3.5 font-semibold text-[#234963]">{product.name}</td><td className="px-5 py-3.5 text-center font-bold text-[#54758b]">{product.sales}</td><td className="px-5 py-3.5 text-right font-black text-[#e8548b]">{formatPrice(product.revenue)}</td></tr>)}</tbody></table></div> : <div className="px-5 py-12 text-center text-sm text-[#7895aa]">No orders recorded in this period yet.</div>}</section>;
}
