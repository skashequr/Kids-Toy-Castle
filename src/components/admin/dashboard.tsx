"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  CalendarRange,
  DollarSign,
  Download,
  Eye,
  LoaderCircle,
  Package,
  ShoppingCart,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { formatDate, formatPrice, cn } from "@/lib/utils";
import type { DashboardDateRange, DashboardStats } from "@/server/services/dashboard";

type Preset = "7" | "30" | "month" | "year" | "custom";

const STATUS_STYLES: Record<string, string> = {
  delivered: "bg-[#dcf7df] text-[#25734e]",
  shipped: "bg-[#dcefff] text-[#236aab]",
  processing: "bg-[#eee2ff] text-[#7046a4]",
  confirmed: "bg-[#dcefff] text-[#236aab]",
  pending: "bg-[#fff1ba] text-[#8a5b00]",
  returned: "bg-[#ffe6ca] text-[#a65313]",
  cancelled: "bg-[#ffe1e9] text-[#b83361]",
};

const CARD_STYLES = [
  { surface: "bg-[#e4f5ff]", icon: "bg-[#2a9ee8]", text: "text-[#176799]" },
  { surface: "bg-[#ffe6f0]", icon: "bg-[#f16aa0]", text: "text-[#a72e62]" },
  { surface: "bg-[#fff3c9]", icon: "bg-[#f3b82e]", text: "text-[#875a00]" },
  { surface: "bg-[#e7f6db]", icon: "bg-[#65b96b]", text: "text-[#2c773d]" },
];

function inputDate(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function shiftDate(value: string, days: number) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function presetRange(preset: Exclude<Preset, "custom">): DashboardDateRange {
  const to = inputDate();
  if (preset === "7") return { from: shiftDate(to, -6), to };
  if (preset === "30") return { from: shiftDate(to, -29), to };
  if (preset === "month") return { from: `${to.slice(0, 7)}-01`, to };
  return { from: `${to.slice(0, 4)}-01-01`, to };
}

function displayRange(range: DashboardDateRange) {
  const format = (value: string) => new Intl.DateTimeFormat("bn-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
  return range.from === range.to ? format(range.from) : `${format(range.from)} – ${format(range.to)}`;
}

export function AdminDashboard({ stats: initialStats }: { stats: DashboardStats }) {
  const [data, setData] = useState(initialStats);
  const [preset, setPreset] = useState<Preset>("30");
  const [from, setFrom] = useState(initialStats.range.from);
  const [to, setTo] = useState(initialStats.range.to);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const loadRange = async (range: DashboardDateRange) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams(range);
      const response = await fetch(`/api/admin/dashboard?${params}`, { cache: "no-store" });
      if (!response.ok) throw new Error("ড্যাশবোর্ডের তথ্য লোড করা যায়নি।");
      const nextData = await response.json() as DashboardStats;
      setData(nextData);
      setFrom(nextData.range.from);
      setTo(nextData.range.to);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "ড্যাশবোর্ডের তথ্য লোড করা যায়নি।");
    } finally {
      setLoading(false);
    }
  };

  const selectPreset = (value: Preset) => {
    setPreset(value);
    if (value !== "custom") void loadRange(presetRange(value));
  };

  const applyCustomRange = () => {
    if (!from || !to || from > to) {
      setError("সঠিক From ও To date নির্বাচন করুন।");
      return;
    }
    void loadRange({ from, to });
  };

  const downloadReport = async () => {
    setDownloading(true);
    setError("");
    try {
      const params = new URLSearchParams(data.range);
      const response = await fetch(`/api/admin/dashboard/export?${params}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Excel report তৈরি করা যায়নি।");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `dashboard-${data.range.from}-to-${data.range.to}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Excel report তৈরি করা যায়নি।");
    } finally {
      setDownloading(false);
    }
  };

  const primaryStats = [
    { label: "Total Revenue", value: data.totalRevenue, icon: DollarSign, format: "currency" },
    { label: "Total Orders", value: data.totalOrders, icon: ShoppingCart, format: "number" },
    { label: "Customers", value: data.totalCustomers, icon: Users, format: "number" },
    { label: "Items Sold", value: data.totalProducts, icon: Package, format: "number" },
  ];

  const quickStats = [
    { label: "Page Views", value: data.pageViews.toLocaleString("en-BD"), icon: Eye, color: "text-[#2a9ee8]" },
    { label: "Pending Reviews", value: data.pendingReviews.toLocaleString("en-BD"), icon: Star, color: "text-[#f16aa0]" },
    { label: "Conversion Rate", value: `${data.conversionRate}%`, icon: TrendingUp, color: "text-[#65b96b]" },
    { label: "Refund Rate", value: `${data.refundRate}%`, icon: TrendingDown, color: "text-[#f3b82e]" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8">
      <Link href="/admin/finance" className="flex items-center justify-between rounded-2xl border border-[#d8edf9] bg-white p-4 text-sm font-bold text-[#238fda]">Finance · Income, expenses & profit/loss <ArrowUpRight className="h-5 w-5" /></Link>
      <section className="relative overflow-hidden rounded-[2rem] bg-[#238fda] px-6 py-7 text-white shadow-[0_18px_42px_rgba(35,143,218,.22)] sm:px-8 sm:py-8">
        <div className="absolute -right-14 -top-16 h-52 w-52 rounded-full border-[22px] border-white/10" />
        <div className="absolute bottom-0 right-24 h-16 w-16 rounded-t-full bg-[#ffd85c]/90" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold"><Sparkles className="h-3.5 w-3.5 text-[#ffe477]" /> Kids Toy Castle Admin</p>
            <h1 className="font-serif text-3xl font-bold sm:text-4xl">বিক্রয়ের পারফরম্যান্স</h1>
            <p className="mt-2 text-sm text-white/85 sm:text-base">{displayRange(data.range)} সময়ের অর্ডার, গ্রাহক ও বিক্রয়ের সারাংশ।</p>
          </div>

          <div className="w-full space-y-3 xl:w-auto xl:min-w-[520px]">
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <label className="relative min-w-[185px]">
                <CalendarRange className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/80" />
                <select
                  aria-label="Dashboard date range"
                  value={preset}
                  onChange={(event) => selectPreset(event.target.value as Preset)}
                  disabled={loading}
                  className="h-11 w-full appearance-none rounded-xl border border-white/25 bg-white/15 pl-10 pr-4 text-sm font-semibold text-white outline-none backdrop-blur-sm transition focus:border-white focus:ring-4 focus:ring-white/15 disabled:opacity-60"
                >
                  <option className="text-slate-800" value="30">Last 30 Days</option>
                  <option className="text-slate-800" value="7">Last 7 Days</option>
                  <option className="text-slate-800" value="month">This Month</option>
                  <option className="text-slate-800" value="year">This Year</option>
                  <option className="text-slate-800" value="custom">Custom Date Range</option>
                </select>
              </label>
              <button
                type="button"
                onClick={() => void downloadReport()}
                disabled={loading || downloading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-[#1678bb] shadow-sm transition hover:bg-[#f2fbff] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {downloading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Excel Download
              </button>
            </div>

            {preset === "custom" && (
              <div className="grid gap-2 rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <label className="text-xs font-semibold text-white/85">From
                  <input type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-white/30 bg-white px-3 text-sm font-semibold text-[#234963] outline-none focus:ring-2 focus:ring-white/50" />
                </label>
                <label className="text-xs font-semibold text-white/85">To
                  <input type="date" value={to} min={from || undefined} max={inputDate()} onChange={(event) => setTo(event.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-white/30 bg-white px-3 text-sm font-semibold text-[#234963] outline-none focus:ring-2 focus:ring-white/50" />
                </label>
                <button type="button" onClick={applyCustomRange} disabled={loading || !from || !to || from > to} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#ffd85c] px-4 text-sm font-bold text-[#5e4700] transition hover:bg-[#ffe684] disabled:cursor-not-allowed disabled:opacity-60">
                  {loading && <LoaderCircle className="h-4 w-4 animate-spin" />} Apply
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {error && <div role="alert" className="rounded-2xl border border-[#ffc5d5] bg-[#fff0f5] px-4 py-3 text-sm font-semibold text-[#a72e62]">{error}</div>}

      <section className={cn("grid gap-4 transition-opacity sm:grid-cols-2 xl:grid-cols-4", loading && "pointer-events-none opacity-55")} aria-busy={loading}>
        {primaryStats.map((stat, index) => {
          const style = CARD_STYLES[index];
          const Icon = stat.icon;
          const value = stat.format === "currency" ? formatPrice(stat.value) : stat.value.toLocaleString("en-BD");
          return (
            <article key={stat.label} className={`${style.surface} rounded-3xl border border-white/80 p-5 shadow-[0_8px_22px_rgba(44,94,134,.08)]`}>
              <div className="flex items-start justify-between gap-3">
                <span className={`${style.icon} grid h-11 w-11 place-items-center rounded-2xl text-white shadow-sm`}><Icon className="h-5 w-5" /></span>
                <span className="rounded-full bg-white/70 px-2 py-1 text-[11px] font-bold text-[#54758b]">এই সময়</span>
              </div>
              <p className={`mt-5 text-2xl font-bold tracking-tight ${style.text}`}>{value}</p>
              <p className={`mt-1 text-sm font-medium opacity-75 ${style.text}`}>{stat.label}</p>
            </article>
          );
        })}
      </section>

      <section className={cn("grid gap-6 transition-opacity xl:grid-cols-[minmax(0,1fr)_350px]", loading && "pointer-events-none opacity-55")}>
        <article className="overflow-hidden rounded-3xl border border-[#d9ecf7] bg-white shadow-[0_8px_24px_rgba(44,94,134,.07)]">
          <div className="flex items-center justify-between border-b border-[#e6f1f8] px-5 py-5 sm:px-6">
            <div><h2 className="font-serif text-xl font-bold text-[#1b588b]">সাম্প্রতিক অর্ডার</h2><p className="mt-1 text-xs text-[#6b8497]">নির্বাচিত সময়ের সর্বশেষ বিক্রয়</p></div>
            <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm font-bold text-[#f05f9a] transition hover:text-[#d94580]">সব দেখুন <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[640px] px-5 pb-2 sm:px-6">
              <div className="grid grid-cols-[1.1fr_1.4fr_.8fr_1fr_.9fr] gap-3 border-b border-[#edf4f8] py-3 text-[11px] font-bold uppercase tracking-wide text-[#7d98aa]">
                <span>Order ID</span><span>Customer</span><span className="text-right">Amount</span><span className="text-center">Status</span><span className="text-right">Date</span>
              </div>
              {data.recentOrders.length === 0 ? <p className="py-10 text-center text-sm text-[#6b8497]">এই সময়ে কোনো অর্ডার পাওয়া যায়নি।</p> : data.recentOrders.map((order) => (
                <div key={order.id} className="grid grid-cols-[1.1fr_1.4fr_.8fr_1fr_.9fr] items-center gap-3 border-b border-[#edf4f8] py-4 text-sm last:border-0 hover:bg-[#f4fbff]">
                  <span className="truncate font-mono text-xs font-bold text-[#3976a3]">{order.orderNumber}</span>
                  <span className="truncate font-semibold text-[#234963]">{order.shippingAddress.fullName}</span>
                  <span className="text-right font-bold text-[#ef6197]">{formatPrice(order.total)}</span>
                  <span className="text-center"><span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold capitalize", STATUS_STYLES[order.status] ?? "bg-slate-100 text-slate-600")}>{order.status}</span></span>
                  <span className="text-right text-xs text-[#748da0]">{formatDate(order.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-[#d9ecf7] bg-white p-5 shadow-[0_8px_24px_rgba(44,94,134,.07)] sm:p-6">
          <div className="flex items-center justify-between"><div><h2 className="font-serif text-xl font-bold text-[#1b588b]">জনপ্রিয় খেলনা</h2><p className="mt-1 text-xs text-[#6b8497]">নির্বাচিত সময়ে বিক্রিতে এগিয়ে</p></div><Link href="/admin/products" className="text-sm font-bold text-[#f05f9a] hover:text-[#d94580]">সব দেখুন</Link></div>
          <div className="mt-5 space-y-3">
            {data.topProducts.length === 0 ? <p className="py-8 text-center text-sm text-[#6b8497]">এই সময়ে কোনো বিক্রয় পাওয়া যায়নি।</p> : data.topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center gap-3 rounded-2xl bg-[#f5fbff] p-3">
                <span className="w-4 text-center text-sm font-bold text-[#83a8c1]">{index + 1}</span>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#ffe6f0] text-xl">🧸</span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#234963]">{product.name}</p><p className="mt-0.5 text-xs text-[#748da0]">{product.unitsSold.toLocaleString("en-BD")} টি বিক্রি</p></div>
                <span className="text-sm font-bold text-[#ef6197]">{formatPrice(product.revenue)}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className={cn("grid grid-cols-2 gap-4 transition-opacity lg:grid-cols-4", loading && "pointer-events-none opacity-55")}>
        {quickStats.map(({ label, value, icon: Icon, color }) => (
          <article key={label} className="flex items-center gap-3 rounded-2xl border border-[#d9ecf7] bg-white p-4 shadow-[0_6px_18px_rgba(44,94,134,.06)]">
            <span className={`grid h-10 w-10 place-items-center rounded-xl bg-[#f3faff] ${color}`}><Icon className="h-5 w-5" /></span>
            <div><p className="text-lg font-bold text-[#234963]">{value}</p><p className="text-xs text-[#748da0]">{label}</p></div>
          </article>
        ))}
      </section>
    </div>
  );
}
