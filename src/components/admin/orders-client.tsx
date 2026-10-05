"use client";

import { dhakaDate, orderPresetRange, inOrderDateRange, type OrderDateRange } from "@/lib/order-date-range";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Eye, Truck, X, Plus, StickyNote, Save, CalendarRange, Download, LoaderCircle } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { updateOrderStatus, createAdminOrder, updateOrderNotes } from "@/server/actions/orders";
import { toast } from "@/components/ui/toaster";

type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "returned" | "cancelled";

export interface AdminOrderRow {
  id: string;
  orderNumber: string;
  customer: string;
  phone: string;
  address: string;
  items: number;
  lineItems?: Array<{ name: string; image?: string; variantLabel?: string; variantSku?: string; quantity: number; price: number }>;
  total: number;
  subtotal?: number; discount?: number; shipping?: number; email?: string; paymentStatus?: string;
  status: OrderStatus;
  date: string;
  courier: string;
  trackingNumber: string;
  paymentMethod: string;
  notes: string;
}

type Order = AdminOrderRow;

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-[#fff2c8] text-[#956400]",
  confirmed: "bg-[#e2f4ff] text-[#1d75ad]",
  processing: "bg-[#f0e5ff] text-[#7a48ab]",
  shipped: "bg-[#e8edff] text-[#4857ac]",
  delivered: "bg-[#e8f8e8] text-[#34784c]",
  returned: "bg-[#ffeccf] text-[#a75d13]",
  cancelled: "bg-[#ffe3ec] text-[#c84270]",
};

const ALL_STATUSES: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered", "returned", "cancelled"];

export function AdminOrdersClient({ initialOrders, initialRange }: { initialOrders: AdminOrderRow[]; initialRange: OrderDateRange }) {
  const [range, setRange] = useState(initialRange);
  const [draft, setDraft] = useState(initialRange);
  const [period, setPeriod] = useState("30");
  const [exporting, setExporting] = useState(false);
  const [dateError, setDateError] = useState("");

  const router = useRouter();
  const [sourceOrders, setSourceOrders] = useState(initialOrders);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [savingStatus, setSavingStatus] = useState<string | null>(null);
  if (sourceOrders !== initialOrders) { setSourceOrders(initialOrders); setOrders(initialOrders); }
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    area: "",
    district: "",
    itemName: "",
    itemQuantity: "1",
    itemPrice: "",
    subtotal: "",
    discount: "0",
    shipping: "0",
    paymentMethod: "cash_on_delivery",
    status: "pending",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dateOrders = orders.filter((o) => inOrderDateRange(o.date, range));
  const filtered = dateOrders.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch = o.orderNumber.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const downloadOrders = async () => {
    setExporting(true);
    try {
      const { buildWorkbook } = await import("@/lib/orders-workbook");
      const bytes = buildWorkbook(range, filtered.map((o) => ({
        orderNumber: o.orderNumber, createdAt: new Date(o.date), customer: o.customer, email: o.email ?? "", phone: o.phone,
        items: (o.lineItems ?? []).map((i) => [i.name, i.variantLabel, i.variantSku].filter(Boolean).join(" / ") + " x" + i.quantity).join(", "),
        quantity: o.items, subtotal: o.subtotal ?? o.total, discount: o.discount ?? 0, shipping: o.shipping ?? 0,
        total: o.total, status: o.status, paymentMethod: o.paymentMethod, paymentStatus: o.paymentStatus ?? "",
      })));
      const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const link = document.createElement("a");
      link.href = url; link.download = `orders-${range.from}-to-${range.to}.xlsx`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { toast.error("Excel download failed. Please try again."); }
    finally { setExporting(false); }
  };

  const updateStatus = async (id: string, status: OrderStatus) => {
    if (savingStatus) return;
    setSavingStatus(id);
    try {
      const result = await updateOrderStatus(id, status);
      if (!result.ok) { toast.error(result.error || "Could not update status."); return; }
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
      setViewOrder((o) => o?.id === id ? { ...o, status } : o);
      toast.success("Order status saved.");
    } catch { toast.error("Could not update status. Please retry."); }
    finally { setSavingStatus(null); }
  };

  const openOrder = (order: Order) => { setViewOrder(order); setNoteDraft(order.notes); };

  const saveOrderNote = async () => {
    if (!viewOrder || isSavingNote) return;
    const id = viewOrder.id;
    setIsSavingNote(true);
    try {
      const result = await updateOrderNotes(id, noteDraft);
      if (!result.ok) { toast.error(result.error || "Could not save the note."); return; }
      setOrders((previous) => previous.map((order) => order.id === id ? { ...order, notes: noteDraft.trim() } : order));
      setViewOrder((order) => order?.id === id ? { ...order, notes: noteDraft.trim() } : order);
      toast.success("Order note saved.");
    } catch { toast.error("Could not save the note. Please retry."); }
    finally { setIsSavingNote(false); }
  };

  const handleAddOrder = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      const itemQuantity = Number(formData.itemQuantity);
      const itemPrice = Number(formData.itemPrice);
      const subtotal = itemQuantity * itemPrice;
      const discount = Number(formData.discount);
      const shipping = Number(formData.shipping);
      const total = subtotal - discount + shipping;

      const result = await createAdminOrder({
        fullName: formData.fullName,
        email: formData.email || undefined,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        area: formData.area || undefined,
        district: formData.district || undefined,
        items: [{
          name: formData.itemName,
          quantity: itemQuantity,
          price: itemPrice,
        }],
        subtotal,
        discount,
        shipping,
        total,
        paymentMethod: formData.paymentMethod,
        status: formData.status as OrderStatus,
      });

      if (result.ok) {
        toast(`Order ${result.orderNumber} created successfully!`, "success");
        setShowAddOrder(false);
        router.refresh();
        setFormData({
          fullName: "",
          email: "",
          phone: "",
          address: "",
          city: "",
          area: "",
          district: "",
          itemName: "",
          itemQuantity: "1",
          itemPrice: "",
          subtotal: "",
          discount: "0",
          shipping: "0",
          paymentMethod: "cash_on_delivery",
          status: "pending",
        });
      } else {
        toast(result.error || "Failed to create order", "error");
      }
    } catch (e) {
      toast("Error creating order", "error");
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalRevenue = dateOrders.filter((o) => o.status === "delivered").reduce((s, o) => s + o.total, 0);
  const activeOrders = dateOrders.filter((o) => !["delivered", "cancelled", "returned"].includes(o.status)).length;
  const deliveredOrders = dateOrders.filter((o) => o.status === "delivered").length;

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#238fda] px-6 py-7 text-white shadow-[0_16px_38px_rgba(35,143,218,0.22)] sm:px-8">
        <div className="absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/10" />
        <div className="absolute bottom-0 right-28 h-20 w-20 rounded-t-full bg-[#f9c55b]/25" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/75">Order desk</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight">Orders</h1>
            <p className="mt-1 text-sm text-white/85">Review customer orders, update fulfillment, and keep follow-up notes together.</p>
          </div>
        <button
          onClick={() => setShowAddOrder(true)}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#f06a9f] px-4 text-sm font-bold text-white shadow-lg shadow-[#155d98]/20 transition hover:-translate-y-0.5 hover:bg-[#e8548b]"
        >
          <Plus className="w-4 h-4" /> Add Order
        </button>
        </div>
      </section>

      <section aria-label="Order date filters" className="overflow-hidden rounded-3xl border border-[#d8edf9] bg-white shadow-[0_8px_22px_rgba(46,128,179,.06)]">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e4f5ff] text-[#248fd6]"><CalendarRange className="h-5 w-5" /></span>
            <div>
              <h2 className="text-sm font-bold text-[#234963]">Order history</h2>
              <p className="mt-0.5 text-xs text-[#7895aa]">Choose a period to view and export your orders.</p>
            </div>
          </div>
          <button type="button" disabled={exporting || filtered.length === 0} onClick={() => void downloadOrders()} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#f8cfdf] bg-[#fff0f5] px-4 text-xs font-bold text-[#d95789] transition hover:border-[#f06a9f] hover:bg-[#fce2ed] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#f06a9f]/15 disabled:cursor-not-allowed disabled:opacity-50">
            {exporting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exporting ? "Preparing export…" : "Export Excel"}
          </button>
        </div>
        <div className="px-5 pb-5">
          <div role="group" aria-label="Order date range" className="flex flex-wrap gap-1.5 rounded-2xl border border-[#e1eff8] bg-[#f5fbff] p-1.5">
            {[["7", "7 days"], ["15", "15 days"], ["30", "1 month"], ["90", "3 months"], ["180", "6 months"], ["365", "1 year"], ["custom", "Custom dates"]].map(([value, label]) => (
              <button key={value} type="button" aria-pressed={period === value} onClick={() => {
                setPeriod(value); setDateError("");
                if (value !== "custom") { const next = orderPresetRange(Number(value)); setRange(next); setDraft(next); }
              }} className={cn("inline-flex min-h-10 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#248fd6]/20", period === value ? "bg-[#248fd6] text-white shadow-[0_3px_10px_rgba(36,143,214,.2)]" : "text-[#54758b] hover:bg-white hover:text-[#248fd6]")}>
                {value === "custom" && <CalendarRange className="h-3.5 w-3.5" />}{label}
              </button>
            ))}
          </div>
          {period === "custom" && (
            <form className="mt-4 grid gap-3 rounded-2xl border border-[#e1eff8] bg-[#f7fcff] p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end" onSubmit={(e) => {
              e.preventDefault();
              if (!draft.from || !draft.to || draft.from > draft.to) { setDateError("The start date must be on or before the end date."); return; }
              setRange(draft); setDateError("");
            }}>
              <label className="min-w-0 text-xs font-bold text-[#54758b]">Start date
                <input required type="date" value={draft.from} max={dhakaDate()} onChange={(e) => setDraft({ ...draft, from: e.target.value })} className="mt-1.5 block h-11 w-full min-w-0 rounded-xl border border-[#c9e3f3] bg-white px-3 text-sm font-medium text-[#234963] outline-none transition [color-scheme:light] focus:border-[#248fd6] focus:ring-4 focus:ring-[#248fd6]/10" />
              </label>
              <label className="min-w-0 text-xs font-bold text-[#54758b]">End date
                <input required type="date" value={draft.to} max={dhakaDate()} onChange={(e) => setDraft({ ...draft, to: e.target.value })} className="mt-1.5 block h-11 w-full min-w-0 rounded-xl border border-[#c9e3f3] bg-white px-3 text-sm font-medium text-[#234963] outline-none transition [color-scheme:light] focus:border-[#248fd6] focus:ring-4 focus:ring-[#248fd6]/10" />
              </label>
              <button className="h-11 rounded-xl bg-[#248fd6] px-5 text-xs font-bold text-white transition hover:bg-[#177abd] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#248fd6]/20" type="submit">Apply dates</button>
              <p className="text-xs text-[#7895aa] sm:col-span-3">For a single day, choose the same start and end date.</p>
            </form>
          )}
          {dateError && <p role="alert" className="mt-3 rounded-xl bg-[#fff0f5] px-3 py-2 text-xs font-semibold text-[#c84270]">{dateError}</p>}
        </div>
        <div className="flex flex-col gap-2 border-t border-[#e8f3f9] bg-[#fbfdff] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p role="status" className="flex flex-wrap items-center gap-2 text-xs text-[#54758b]">
            <span className="rounded-lg bg-[#e4f5ff] px-2 py-1 font-bold text-[#227bb6]">{filtered.length} {filtered.length === 1 ? "order" : "orders"}</span>
            <span>{new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(range.from))} – {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(range.to))}</span>
            <span className="text-[#7895aa]">· Bangladesh time</span>
          </p>
          <p className="text-[11px] text-[#7895aa]">Excel includes the current filters.</p>
        </div>
      </section>
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#d8edf9] bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#7895aa]">Orders in selected dates</p>
          <p className="mt-1 text-2xl font-black text-[#234963]">{dateOrders.length}</p>
          <p className="mt-1 text-xs text-[#5f8298]">Selected date range</p>
        </div>
        <div className="rounded-2xl border border-[#d6efd9] bg-[#f3fcf4] p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#49805b]">In progress</p>
          <p className="mt-1 text-2xl font-black text-[#34784c]">{activeOrders}</p>
          <p className="mt-1 text-xs text-[#61906f]">Needs fulfillment attention</p>
        </div>
        <div className="rounded-2xl border border-[#ffe1a1] bg-[#fff9e8] p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#956400]">Delivered revenue</p>
          <p className="mt-1 text-2xl font-black text-[#c07600]">{formatPrice(totalRevenue)}</p>
          <p className="mt-1 text-xs text-[#ac8233]">From {deliveredOrders} delivered orders</p>
        </div>
      </section>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-[#d8edf9] bg-[#f7fcff] p-3">
        <button
          onClick={() => setStatusFilter("all")}
          className={cn("rounded-xl px-3 py-2 text-xs font-bold transition", statusFilter === "all" ? "bg-[#248fd6] text-white shadow-sm" : "bg-white text-[#54758b] hover:bg-[#e4f5ff] hover:text-[#248fd6]")}
        >
          All ({dateOrders.length})
        </button>
        {ALL_STATUSES.map((s) => {
          const count = dateOrders.filter((o) => o.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn("rounded-xl px-3 py-2 text-xs font-bold capitalize transition", statusFilter === s ? "bg-[#248fd6] text-white shadow-sm" : "bg-white text-[#54758b] hover:bg-[#e4f5ff] hover:text-[#248fd6]")}
            >
              {s} ({count})
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-[#d8edf9] bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7895aa]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number or customer name..."
            className="h-11 w-full rounded-xl border border-[#c9e3f3] bg-[#f7fcff] pl-10 pr-4 text-sm text-[#234963] outline-none placeholder:text-[#91aab9] transition focus:border-[#248fd6] focus:bg-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-[#d8edf9] bg-white shadow-[0_10px_30px_rgba(35,143,218,0.08)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-[#f1faff] text-left">
              <tr>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-[#7895aa]">Order</th>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-[#7895aa]">Customer</th>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-[#7895aa]">Date</th>
                <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wide text-[#7895aa]">Total</th>
                <th className="px-4 py-3.5 text-center text-xs font-bold uppercase tracking-wide text-[#7895aa]">Status</th>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-[#7895aa]">Payment</th>
                <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wide text-[#7895aa]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7f2f8]">
              {filtered.map((order) => (
                <tr key={order.id} className="transition-colors hover:bg-[#f8fcff]">
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs font-bold text-[#234963]">{order.orderNumber}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-[#7895aa]"><span>{order.items} item(s)</span>{order.notes && <span className="inline-flex items-center gap-1 text-[#d95789]"><StickyNote className="h-3 w-3" /> Note</span>}</div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#234963]">{order.customer}</p>
                    <p className="text-xs text-[#7895aa]">{order.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#54758b]">{formatDate(order.date)}</td>
                  <td className="px-4 py-3 text-right font-black text-[#e8548b]">{formatPrice(order.total)}</td>
                  <td className="px-4 py-3 text-center">
                    <select
                      disabled={Boolean(savingStatus)}
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                      className={cn("cursor-pointer rounded-full border-0 px-2.5 py-1.5 text-xs font-bold capitalize outline-none", STATUS_STYLES[order.status])}
                    >
                      {ALL_STATUSES.map((s) => (
                        <option key={s} value={s} className="bg-white text-[#234963] capitalize">{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs font-medium capitalize text-[#54758b]">{order.paymentMethod.replaceAll("_", " ")}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openOrder(order)}
                        className="rounded-lg bg-[#e4f5ff] p-2 text-[#248fd6] transition hover:bg-[#248fd6] hover:text-white"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openOrder(order)}
                        className={cn("rounded-lg p-2 transition-colors", order.notes ? "bg-[#fff0c5] text-[#b97900]" : "bg-[#fff2f6] text-[#e8548b] hover:bg-[#f06a9f] hover:text-white")}
                        title="Order note"
                      >
                        <StickyNote className="w-4 h-4" />
                      </button>
                      {order.trackingNumber && (
                        <button onClick={() => openOrder(order)} className="rounded-lg bg-[#eef6ff] p-2 text-[#4c75b4] transition hover:bg-[#4c75b4] hover:text-white" title="Track Shipment">
                          <Truck className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[#e7f2f8] px-4 py-3 text-xs font-medium text-[#7895aa]">
          Showing {filtered.length} of {orders.length} orders
        </div>
      </div>

      {/* Order Details Modal */}
      {viewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#163d5c]/45 backdrop-blur-sm" onClick={() => setViewOrder(null)} />
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-[#d8edf9] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#d8edf9] bg-[#f1faff] p-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7895aa]">Order details</p>
                <h3 className="font-mono text-lg font-black text-[#234963]">{viewOrder.orderNumber}</h3>
                <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full capitalize", STATUS_STYLES[viewOrder.status])}>
                  {viewOrder.status}
                </span>
              </div>
              <button onClick={() => setViewOrder(null)} className="rounded-lg p-2 text-[#54758b] transition hover:bg-white hover:text-[#e8548b]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div className="space-y-3 max-h-60 overflow-y-auto">{viewOrder.lineItems?.map((item, index) => <div key={index} className="flex gap-3 rounded-xl border p-3">{item.image && <img src={item.image} alt={item.variantLabel || item.name} className="h-16 w-16 rounded-lg object-cover" />}<div><p className="font-semibold">{item.name}</p>{item.variantLabel && <p className="text-sm text-blue-700">Variant: {item.variantLabel}</p>}{item.variantSku && <p className="text-xs">SKU: {item.variantSku}</p>}<p className="text-sm">{item.quantity} × {formatPrice(item.price)}</p></div></div>)}</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#7895aa]">Customer</p>
                  <p className="font-semibold text-[#234963]">{viewOrder.customer}</p>
                  <p className="text-xs text-[#7895aa]">{viewOrder.phone}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#7895aa]">Order Date</p>
                  <p className="font-semibold text-[#234963]">{formatDate(viewOrder.date)}</p>
                </div>
                <div className="col-span-2">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#7895aa]">Delivery Address</p>
                  <p className="font-semibold text-[#234963]">{viewOrder.address}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#7895aa]">Payment</p>
                  <p className="font-semibold capitalize text-[#234963]">{viewOrder.paymentMethod.replaceAll("_", " ")}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#7895aa]">Total</p>
                  <p className="text-lg font-black text-[#e8548b]">{formatPrice(viewOrder.total)}</p>
                </div>
                {viewOrder.courier && (
                  <>
                    <div>
                      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#7895aa]">Courier</p>
                      <p className="font-semibold text-[#234963]">{viewOrder.courier}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#7895aa]">Tracking #</p>
                      <p className="font-mono text-sm font-semibold text-[#234963]">{viewOrder.trackingNumber}</p>
                    </div>
                  </>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#7895aa]">Update Status</p>
                <div className="grid grid-cols-3 gap-2">
                  {ALL_STATUSES.map((s) => (
                    <button
                      key={s}
                      disabled={Boolean(savingStatus)}
                      onClick={() => void updateStatus(viewOrder.id, s)}
                      className={cn(
                        "h-8 rounded-lg text-xs font-bold capitalize transition-colors",
                        viewOrder.status === s
                          ? "bg-[#248fd6] text-white"
                          : "bg-[#f1faff] text-[#54758b] hover:bg-[#e4f5ff] hover:text-[#248fd6]"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[#d8edf9] bg-[#f6fbff] p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#234963]"><StickyNote className="h-4 w-4 text-[#e8548b]" /> Admin note</div>
                  <span className="text-[11px] text-[#7895aa]">Visible to admins only</span>
                </div>
                <textarea
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  rows={3}
                  placeholder="Add delivery or customer follow-up notes..."
                  className="w-full resize-none rounded-xl border border-[#c9e3f3] bg-white px-3 py-2.5 text-sm text-[#234963] outline-none placeholder:text-[#9ab0be] focus:border-[#248fd6]"
                />
                <button
                  type="button"
                  disabled={isSavingNote}
                  onClick={saveOrderNote}
                  className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-[#248fd6] px-3 text-xs font-bold text-white transition hover:bg-[#177abd] disabled:opacity-60"
                >
                  <Save className="h-3.5 w-3.5" /> {isSavingNote ? "Saving..." : "Save note"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Order Modal */}
      {showAddOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#163d5c]/45 backdrop-blur-sm" onClick={() => setShowAddOrder(false)} />
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#d8edf9] bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#d8edf9] bg-[#f1faff] p-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7895aa]">Order desk</p>
                <h3 className="text-lg font-black text-[#234963]">Create Manual Order</h3>
              </div>
              <button onClick={() => setShowAddOrder(false)} className="rounded-lg p-2 text-[#54758b] transition hover:bg-white hover:text-[#e8548b]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 p-5 text-[#234963]">
              <div className="grid grid-cols-2 gap-4">
                {/* Customer Info */}
                <div className="col-span-2">
                  <label className="block text-xs text-muted font-semibold uppercase tracking-wide mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Customer name"
                    className="w-full px-3 py-2 rounded-lg border border-navy/20 dark:border-ivory/20 bg-transparent text-sm focus:outline-none focus:border-gold transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted font-semibold uppercase tracking-wide mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="customer@example.com"
                    className="w-full px-3 py-2 rounded-lg border border-navy/20 dark:border-ivory/20 bg-transparent text-sm focus:outline-none focus:border-gold transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted font-semibold uppercase tracking-wide mb-2">Phone *</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="01X XXXXXX"
                    className="w-full px-3 py-2 rounded-lg border border-navy/20 dark:border-ivory/20 bg-transparent text-sm focus:outline-none focus:border-gold transition-colors"
                  />
                </div>

                {/* Address */}
                <div className="col-span-2">
                  <label className="block text-xs text-muted font-semibold uppercase tracking-wide mb-2">Address *</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Street address"
                    className="w-full px-3 py-2 rounded-lg border border-navy/20 dark:border-ivory/20 bg-transparent text-sm focus:outline-none focus:border-gold transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted font-semibold uppercase tracking-wide mb-2">City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                    className="w-full px-3 py-2 rounded-lg border border-navy/20 dark:border-ivory/20 bg-transparent text-sm focus:outline-none focus:border-gold transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted font-semibold uppercase tracking-wide mb-2">District</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="District"
                    className="w-full px-3 py-2 rounded-lg border border-navy/20 dark:border-ivory/20 bg-transparent text-sm focus:outline-none focus:border-gold transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted font-semibold uppercase tracking-wide mb-2">Area</label>
                  <input
                    type="text"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    placeholder="Area"
                    className="w-full px-3 py-2 rounded-lg border border-navy/20 dark:border-ivory/20 bg-transparent text-sm focus:outline-none focus:border-gold transition-colors"
                  />
                </div>

                {/* Item Info */}
                <div className="col-span-2 border-t border-[#d8edf9] pt-3">
                  <h4 className="mb-3 text-sm font-bold text-[#248fd6]">Order Item</h4>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs text-muted font-semibold uppercase tracking-wide mb-2">Product Name *</label>
                  <input
                    type="text"
                    value={formData.itemName}
                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                    placeholder="Product name"
                    className="w-full px-3 py-2 rounded-lg border border-navy/20 dark:border-ivory/20 bg-transparent text-sm focus:outline-none focus:border-gold transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted font-semibold uppercase tracking-wide mb-2">Quantity *</label>
                  <input
                    type="number"
                    value={formData.itemQuantity}
                    onChange={(e) => setFormData({ ...formData, itemQuantity: e.target.value })}
                    placeholder="1"
                    min="1"
                    className="w-full px-3 py-2 rounded-lg border border-navy/20 dark:border-ivory/20 bg-transparent text-sm focus:outline-none focus:border-gold transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted font-semibold uppercase tracking-wide mb-2">Price per Item *</label>
                  <input
                    type="number"
                    value={formData.itemPrice}
                    onChange={(e) => setFormData({ ...formData, itemPrice: e.target.value })}
                    placeholder="0"
                    step="0.01"
                    className="w-full px-3 py-2 rounded-lg border border-navy/20 dark:border-ivory/20 bg-transparent text-sm focus:outline-none focus:border-gold transition-colors"
                  />
                </div>

                {/* Pricing */}
                <div className="col-span-2 border-t border-[#d8edf9] pt-3">
                  <h4 className="mb-3 text-sm font-bold text-[#248fd6]">Pricing</h4>
                </div>

                <div>
                  <label className="block text-xs text-muted font-semibold uppercase tracking-wide mb-2">Discount</label>
                  <input
                    type="number"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    placeholder="0"
                    step="0.01"
                    className="w-full px-3 py-2 rounded-lg border border-navy/20 dark:border-ivory/20 bg-transparent text-sm focus:outline-none focus:border-gold transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted font-semibold uppercase tracking-wide mb-2">Shipping</label>
                  <input
                    type="number"
                    value={formData.shipping}
                    onChange={(e) => setFormData({ ...formData, shipping: e.target.value })}
                    placeholder="0"
                    step="0.01"
                    className="w-full px-3 py-2 rounded-lg border border-navy/20 dark:border-ivory/20 bg-transparent text-sm focus:outline-none focus:border-gold transition-colors"
                  />
                </div>

                {/* Payment & Status */}
                <div>
                  <label className="block text-xs text-muted font-semibold uppercase tracking-wide mb-2">Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-navy/20 dark:border-ivory/20 bg-white dark:bg-navy text-sm focus:outline-none focus:border-gold transition-colors"
                  >
                    <option value="cash_on_delivery">Cash on Delivery</option>
                    <option value="bkash">bKash</option>
                    <option value="nagad">Nagad</option>
                    <option value="rocket">Rocket</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-muted font-semibold uppercase tracking-wide mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-navy/20 dark:border-ivory/20 bg-white dark:bg-navy text-sm focus:outline-none focus:border-gold transition-colors"
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s} className="capitalize">{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 border-t border-[#d8edf9] pt-4">
                <button
                  onClick={() => setShowAddOrder(false)}
                  className="h-10 flex-1 rounded-xl bg-[#e4f5ff] text-sm font-bold text-[#248fd6] transition-colors hover:bg-[#d3ecfa]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddOrder}
                  disabled={isSubmitting}
                  className="h-10 flex-1 rounded-xl bg-[#f06a9f] text-sm font-bold text-white transition-colors hover:bg-[#e8548b] disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
