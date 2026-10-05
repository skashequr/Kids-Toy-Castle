"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ExternalLink, MapPin, MessageSquare, RefreshCw, Search, Send, StickyNote, Truck, Wallet, WifiOff } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import { updateOrderDelivery } from "@/server/actions/orders";
import { refreshSteadfastBalance, sendOrderToSteadfast, syncSteadfastOrderStatus, syncSteadfastDeliveryOrders } from "@/server/actions/steadfast";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types";
import { STEADFAST_STATUSES } from "@/lib/steadfast-status";

export interface DeliveryOrderRow {
  id: string;
  orderNumber: string;
  customer: string;
  phone: string;
  address: string;
  items: number;
  total: number;
  status: OrderStatus;
  date: string;
  courier: string;
  trackingNumber: string;
  courierStatus: string;
  courierTrackingMessage: string;
  courierTrackingHistory?: Array<{ message: string; status?: string; updatedAt: string }>;
  courierUpdatedAt?: string;
  courierStatusUpdatedAt?: string;
  courierDeliveryCharge?: number;
  courierCodAmount?: number;
  courierConsignmentId?: number;
  estimatedDelivery?: string;
  notes: string;
}

const ORDER_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  processing: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  shipped: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  returned: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const ALL_STATUSES: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered", "returned", "cancelled"];

function courierBadge(status: string) {
  if (status === "delivered") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status.includes("cancel") || status === "returned") return "bg-rose-50 text-rose-700 ring-rose-200";
  if (status.includes("hold") || status.includes("approval") || status === "unknown") return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-sky-50 text-sky-700 ring-sky-200";
}

function updateTime(value?: string) {
  if (!value || Number.isNaN(Date.parse(value))) return "এখনও update আসেনি";
  return new Date(value).toLocaleString("en-GB", { timeZone: "Asia/Dhaka", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function deliveryDraft(order: DeliveryOrderRow) {
  return {
    courier: order.courier,
    trackingNumber: order.trackingNumber,
    estimatedDelivery: order.estimatedDelivery?.slice(0, 10) ?? "",
    status: order.status,
    notes: order.notes,
  };
}

export function AdminDeliveryClient({
  initialOrders,
  initialSteadfastBalance,
  initialSteadfastError,
}: {
  initialOrders: DeliveryOrderRow[];
  initialSteadfastBalance: number | null;
  initialSteadfastError: string;
}) {
  const router = useRouter();
  const [orders, setOrders] = useState<DeliveryOrderRow[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [drafts, setDrafts] = useState<Record<string, { courier: string; trackingNumber: string; estimatedDelivery: string; status: OrderStatus; notes: string }>>(
    Object.fromEntries(initialOrders.map((order) => [
      order.id,
      {
        courier: order.courier || "",
        trackingNumber: order.trackingNumber || "",
        estimatedDelivery: order.estimatedDelivery ? order.estimatedDelivery.slice(0, 10) : "",
        status: order.status,
        notes: order.notes ?? "",
      },
    ]))
  );
  const [savingIds, setSavingIds] = useState<string[]>([]);
  const [steadfastIds, setSteadfastIds] = useState<string[]>([]);
  const [steadfastBalance, setSteadfastBalance] = useState<number | null>(initialSteadfastBalance);
  const [steadfastError, setSteadfastError] = useState(initialSteadfastError);
  const [refreshingBalance, setRefreshingBalance] = useState(false);
  const [previousOrders, setPreviousOrders] = useState(initialOrders);
  const [previousBalance, setPreviousBalance] = useState(initialSteadfastBalance);
  const [previousError, setPreviousError] = useState(initialSteadfastError);
  const [liveSyncError, setLiveSyncError] = useState("");
  const bookedIds = initialOrders.filter((order) => order.courier.toLowerCase() === "steadfast" && order.trackingNumber).map((order) => order.id).join(",");

  useEffect(() => {
    if (!bookedIds) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const refresh = async () => {
      try {
        if (document.visibilityState !== "hidden") {
          const ids = bookedIds.split(",");
          const errors: string[] = [];
          for (let offset = 0; active && offset < ids.length; offset += 50) {
            const result = await syncSteadfastDeliveryOrders(ids.slice(offset, offset + 50));
            if (!active) return;
            if (!result.ok) { errors.push(result.error); break; }
            errors.push(...result.errors);
            const updates = new Map(result.updates.map((update) => [update.id, update]));
            setOrders((current) => current.map((order) => {
              const update = updates.get(order.id);
              return update ? { ...order, ...update, courierStatus: update.deliveryStatus, status: update.orderStatus as OrderStatus } : order;
            }));
          }
          if (active) { setLiveSyncError(errors[0] ?? ""); router.refresh(); }
        }
      } catch {
        if (active) setLiveSyncError("Auto-sync failed. Last received courier information is still shown.");
      } finally {
        if (active) timer = setTimeout(refresh, 60_000);
      }
    };
    void refresh();
    return () => { active = false; clearTimeout(timer); };
  }, [bookedIds, router]);

  // Merge refreshed server rows while preserving fields the admin is editing.
  if (previousOrders !== initialOrders) {
    setPreviousOrders(initialOrders);
    setOrders(initialOrders);
    setDrafts((current) => Object.fromEntries(initialOrders.map((order) => {
      const old = previousOrders.find((item) => item.id === order.id);
      const fresh = deliveryDraft(order);
      if (!old || !current[order.id]) return [order.id, fresh];
      const baseline = deliveryDraft(old);
      const merged = { ...fresh };
      for (const field of Object.keys(fresh) as Array<keyof typeof fresh>) {
        if (current[order.id][field] !== baseline[field]) {
          Object.assign(merged, { [field]: current[order.id][field] });
        }
      }
      return [order.id, merged];
    })));
  }
  if (previousBalance !== initialSteadfastBalance || previousError !== initialSteadfastError) {
    setPreviousBalance(initialSteadfastBalance);
    setPreviousError(initialSteadfastError);
    setSteadfastBalance(initialSteadfastBalance);
    setSteadfastError(initialSteadfastError);
  }

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(query) ||
        order.customer.toLowerCase().includes(query) ||
        order.address.toLowerCase().includes(query) ||
        order.phone.toLowerCase().includes(query) ||
        order.courier.toLowerCase().includes(query) ||
        order.trackingNumber.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || (statusFilter.startsWith("api:") ? order.courier.toLowerCase() === "steadfast" && order.courierStatus === statusFilter.slice(4) : order.status === statusFilter);
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const isSaving = (id: string) => savingIds.includes(id);
  const isSteadfastBusy = (id: string) => steadfastIds.includes(id);

  const loadSteadfastBalance = async () => {
    if (refreshingBalance) return;
    setRefreshingBalance(true);
    try {
    const result = await refreshSteadfastBalance();
    if (result.ok) {
      setSteadfastBalance(result.balance);
      setSteadfastError("");
      toast.success("Steadfast balance refreshed.");
    } else {
      setSteadfastError(result.error);
      toast.error(result.error);
    }
    } catch { toast.error("Could not refresh balance. Please retry."); }
    finally { setRefreshingBalance(false); }
  };

  const bookWithSteadfast = async (order: DeliveryOrderRow) => {
    if (isSteadfastBusy(order.id)) return;
    setSteadfastIds((prev) => [...prev, order.id]);
    try {
    const result = await sendOrderToSteadfast(order.id);
    if (result.ok) {
      setOrders((prev) => prev.map((item) => item.id === order.id ? {
        ...item,
        courier: "Steadfast",
        trackingNumber: result.trackingCode,
        courierStatus: result.deliveryStatus,
        status: item.status === "pending" ? "processing" : item.status,
      } : item));
      setDrafts((prev) => ({
        ...prev,
        [order.id]: {
          ...prev[order.id],
          courier: "Steadfast",
          trackingNumber: result.trackingCode,
          status: prev[order.id].status === "pending" ? "processing" : prev[order.id].status,
        },
      }));
      toast.success(`Booked with Steadfast. Tracking: ${result.trackingCode}`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
    } catch { toast.error("Could not book with Steadfast. Please retry."); }
    finally { setSteadfastIds((prev) => prev.filter((id) => id !== order.id)); }
  };

  const syncSteadfastStatus = async (order: DeliveryOrderRow) => {
    if (isSteadfastBusy(order.id)) return;
    setSteadfastIds((prev) => [...prev, order.id]);
    try {
    const result = await syncSteadfastOrderStatus(order.id);
    if (result.ok) {
      setOrders((prev) => prev.map((item) => item.id === order.id ? {
        ...item,
        courierStatus: result.deliveryStatus,
        status: result.orderStatus as OrderStatus,
        courierTrackingMessage: result.courierTrackingMessage,
        courierUpdatedAt: result.courierUpdatedAt,
        courierStatusUpdatedAt: result.courierStatusUpdatedAt,
        courierDeliveryCharge: result.courierDeliveryCharge,
      } : item));
      setDrafts((prev) => ({
        ...prev,
        [order.id]: { ...prev[order.id], status: result.orderStatus as OrderStatus },
      }));
      toast.success(`Steadfast status: ${result.deliveryStatus.replaceAll("_", " ")}`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
    } catch { toast.error("Could not sync Steadfast status. Please retry."); }
    finally { setSteadfastIds((prev) => prev.filter((id) => id !== order.id)); }
  };

  const setDraft = (id: string, field: keyof typeof drafts[string], value: string | OrderStatus) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const saveDelivery = async (id: string, nextStatus?: OrderStatus) => {
    const draft = nextStatus ? { ...drafts[id], status: nextStatus } : drafts[id];
    if (!draft || isSaving(id) || isSteadfastBusy(id)) return;
    const storedOrder = orders.find((order) => order.id === id);
    const apiManaged = storedOrder?.courier.toLowerCase() === "steadfast" && Boolean(storedOrder.trackingNumber);
    if (!apiManaged && draft.status === "cancelled" && storedOrder?.status !== "cancelled" && !window.confirm("শুধু দোকানের order বাতিল হবে। এটি Steadfast বা অন্য courier booking বাতিল করবে না। চালিয়ে যাবেন?")) return;

    const payload = {
      courier: draft.courier.trim(),
      trackingNumber: draft.trackingNumber.trim(),
      estimatedDelivery: draft.estimatedDelivery ? `${draft.estimatedDelivery}T00:00:00.000Z` : "",
      ...(apiManaged ? {} : { status: draft.status }),
      notes: draft.notes,
    };

    setSavingIds((prev) => [...prev, id]);
    try {
    const result = await updateOrderDelivery(id, payload);

    if (result.ok) {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === id
            ? {
                ...order,
                courier: draft.courier,
                trackingNumber: draft.trackingNumber,
                estimatedDelivery: draft.estimatedDelivery,
                status: apiManaged ? order.status : draft.status,
                notes: draft.notes,
              }
            : order
        )
      );
      setDrafts((previous) => ({ ...previous, [id]: draft }));
      toast.success("Delivery details updated.");
      router.refresh();
    } else {
      toast.error(result.error || "Could not update delivery details.");
    }
    } catch { toast.error("Could not save delivery details. Please retry."); }
    finally { setSavingIds((prev) => prev.filter((item) => item !== id)); }
  };

  const quickStatus = async (id: string, status: OrderStatus) => {
    await saveDelivery(id, status);
  };

  const inputStyle = "h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 disabled:text-slate-500";
  const actionStyle = "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-4 text-slate-700">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-sky-600">Order fulfilment</p><h1 className="mt-1 font-serif text-3xl font-bold text-slate-900">Delivery management</h1><p className="mt-2 text-sm text-slate-500">অর্ডার, courier status ও rider updates এক জায়গায়।</p></div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Auto sync · 60 sec</span>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total orders", count: orders.length },
          { label: "Steadfast bookings", count: orders.filter((order) => order.courier.toLowerCase() === "steadfast" && order.trackingNumber).length },
          { label: "Delivered", count: orders.filter((order) => order.courier.toLowerCase() === "steadfast" && order.trackingNumber ? order.courierStatus === "delivered" : order.status === "delivered").length },
          { label: "On hold", count: orders.filter((order) => order.courierStatus === "hold").length },
        ].map((item) => <div key={item.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-4"><p className="text-xs text-slate-500">{item.label}</p><p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{item.count}</p></div>)}
      </div>

      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3"><span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", steadfastBalance !== null ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>{steadfastBalance !== null ? <Wallet className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}</span><div className="min-w-0"><p className="flex items-center gap-2 text-sm font-bold text-slate-900">Steadfast Courier {steadfastBalance !== null && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}</p>{steadfastBalance !== null ? <p className="mt-0.5 text-xs text-slate-500">Available balance <b className="ml-1 text-emerald-700">{formatPrice(steadfastBalance)}</b></p> : <p className="mt-0.5 break-words text-xs text-rose-600">{steadfastError || "Steadfast is not connected."}</p>}</div></div>
        <button type="button" onClick={loadSteadfastBalance} disabled={refreshingBalance} className={cn(actionStyle, "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50")}><RefreshCw className={cn("h-4 w-4", refreshingBalance && "animate-spin")} />{refreshingBalance ? "Refreshing..." : "Refresh balance"}</button>
      </section>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
        <strong>Cancellation:</strong> এখানে local order বাতিল করলে courier booking বাতিল হয় না। Steadfast booking cancel করতে merchant portal / support ব্যবহার করুন।
      </div>
      {liveSyncError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{liveSyncError} শেষ পাওয়া তথ্য দেখানো হচ্ছে।</p>}

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center">
        <label className="relative flex-1"><span className="sr-only">Search delivery orders</span><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Order, customer, phone or tracking…" className={cn(inputStyle, "pl-9")} /></label>
        <select aria-label="Filter delivery status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={cn(inputStyle, "sm:w-56")}><option value="all">All statuses</option><optgroup label="Steadfast API">{STEADFAST_STATUSES.map((status) => <option key={status} value={`api:${status}`}>{status.replaceAll("_", " ")}</option>)}</optgroup><optgroup label="Store order status">{ALL_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</optgroup></select>
        <span className="whitespace-nowrap px-2 text-xs text-slate-400">{filteredOrders.length} results</span>
      </div>

      <div className="space-y-4">
        {filteredOrders.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center"><Truck className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-600">No delivery orders match your search.</p><p className="mt-1 text-xs text-slate-400">Search বা status filter পরিবর্তন করুন।</p></div>}
        {filteredOrders.map((order) => {
          const draft = drafts[order.id];
          const apiManaged = order.courier.toLowerCase() === "steadfast" && Boolean(order.trackingNumber);
          const saving = isSaving(order.id);
          const busy = isSteadfastBusy(order.id);
          const shownStatus = apiManaged ? order.courierStatus : order.status;
          return (
            <article key={order.id} aria-label={`Delivery order ${order.orderNumber}`} className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="min-w-0"><h2 className="break-all font-mono text-sm font-bold text-slate-900">{order.orderNumber}</h2><p className="mt-1 text-xs text-slate-400">{formatDate(order.date)} · {order.items} item(s) · <b className="text-slate-700">{formatPrice(order.total)}</b></p></div>
                <div className="min-w-0 sm:text-right"><span data-courier-status className={cn("inline-flex rounded-full px-3 py-1.5 text-xs font-bold capitalize ring-1 ring-inset", courierBadge(shownStatus))}>{shownStatus ? shownStatus.replaceAll("_", " ") : "Awaiting API status"}</span><p className="mt-1.5 text-[10px] text-slate-400">{apiManaged ? `Steadfast API / webhook · ${updateTime(order.courierStatusUpdatedAt)}` : "Store order status"}</p></div>
              </div>

              <div className="grid min-w-0 gap-5 px-4 py-5 sm:px-5 lg:grid-cols-3">
                <section className="min-w-0"><h3 className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400"><MapPin className="h-3.5 w-3.5" /> Customer & address</h3><p className="text-sm font-semibold text-slate-800">{order.customer}</p><p className="mt-1 text-xs text-slate-500">{order.phone}</p><p className="mt-2 break-words text-xs leading-5 text-slate-500">{order.address || "Address unavailable"}</p></section>
                <section className="min-w-0"><h3 className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400"><Truck className="h-3.5 w-3.5" /> Shipment</h3><p className="text-sm font-semibold text-slate-800">{order.courier || "Not booked yet"}</p><p className="mt-1 break-all font-mono text-xs text-slate-500">{order.trackingNumber || "No tracking code"}</p><dl className="mt-3 space-y-1.5 text-xs">{order.courierConsignmentId && <div className="flex flex-wrap justify-between gap-2"><dt className="text-slate-400">Consignment</dt><dd>{order.courierConsignmentId}</dd></div>}{order.courierDeliveryCharge !== undefined && <div className="flex flex-wrap justify-between gap-2"><dt className="text-slate-400">API delivery charge</dt><dd>{formatPrice(order.courierDeliveryCharge)}</dd></div>}{order.courierCodAmount !== undefined && <div className="flex flex-wrap justify-between gap-2"><dt className="text-slate-400">API COD amount</dt><dd>{formatPrice(order.courierCodAmount)}</dd></div>}{order.estimatedDelivery && <div className="flex flex-wrap justify-between gap-2"><dt className="text-slate-400">Estimated delivery</dt><dd>{formatDate(order.estimatedDelivery)}</dd></div>}</dl></section>
                <section data-courier-note className="min-w-0"><h3 className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400"><MessageSquare className="h-3.5 w-3.5" /> Courier note · API</h3><div className="rounded-xl bg-slate-50 p-3"><p className="whitespace-pre-wrap break-words text-xs leading-5 text-slate-600">{order.courierTrackingMessage || (apiManaged ? "Courier এখনও কোনো note পাঠায়নি।" : "Courier booking-এর পর updates দেখাবে।")}</p>{order.courierUpdatedAt && <p className="mt-2 text-[10px] text-slate-400">{updateTime(order.courierUpdatedAt)}</p>}</div>{!!order.courierTrackingHistory?.length && <details className="mt-3 text-xs"><summary className="cursor-pointer font-semibold text-sky-600">Update history ({order.courierTrackingHistory.length})</summary><ol className="mt-2 max-h-64 space-y-3 overflow-y-auto">{[...order.courierTrackingHistory].reverse().map((event, index) => <li key={`${event.updatedAt}-${index}`} className="border-l-2 border-sky-100 pl-3"><p className="whitespace-pre-wrap break-words leading-5 text-slate-600">{event.message || event.status?.replaceAll("_", " ") || "Tracking update"}</p><time className="text-[10px] text-slate-400">{updateTime(event.updatedAt)}</time></li>)}</ol></details>}</section>
              </div>

              <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-5">
                <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-[11px] text-slate-400">{apiManaged ? "Courier status read-only · admin note আলাদা" : "Book this order or update local delivery details"}</p><div className="flex flex-wrap gap-2">{apiManaged ? <><button type="button" onClick={() => syncSteadfastStatus(order)} disabled={saving || busy} className={cn(actionStyle, "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100")}><RefreshCw className={cn("h-3.5 w-3.5", busy && "animate-spin")} />{busy ? "Syncing..." : "Sync status"}</button><a href="https://portal.steadfast.com.bd/" target="_blank" rel="noopener noreferrer" className={cn(actionStyle, "bg-slate-800 text-white hover:bg-slate-900")}>Steadfast portal <ExternalLink className="h-3.5 w-3.5" /></a></> : <button type="button" onClick={() => bookWithSteadfast(order)} disabled={saving || busy || steadfastBalance === null || ["delivered", "returned", "cancelled"].includes(order.status)} className={cn(actionStyle, "bg-sky-600 text-white hover:bg-sky-700")}><Send className="h-3.5 w-3.5" />{busy ? "Booking..." : "Send to Steadfast"}</button>}</div></div>
                <details className="mt-3 border-t border-slate-200/70 pt-3">
                  <summary className="cursor-pointer text-xs font-semibold text-slate-600">Edit delivery details & admin note</summary>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="min-w-0 text-xs text-slate-500">Courier<input aria-label="Courier" value={draft.courier} onChange={(event) => setDraft(order.id, "courier", event.target.value)} disabled={saving || busy || apiManaged} placeholder="Courier name" className={cn(inputStyle, "mt-1.5")} /></label>
                    <label className="min-w-0 text-xs text-slate-500">Tracking code<input aria-label="Tracking code" value={draft.trackingNumber} onChange={(event) => setDraft(order.id, "trackingNumber", event.target.value)} disabled={saving || busy || apiManaged} placeholder="Tracking code" className={cn(inputStyle, "mt-1.5")} /></label>
                    <label className="min-w-0 text-xs text-slate-500">Estimated delivery<input aria-label="Estimated delivery" type="date" value={draft.estimatedDelivery} onChange={(event) => setDraft(order.id, "estimatedDelivery", event.target.value)} disabled={saving} className={cn(inputStyle, "mt-1.5")} /></label>
                    {!apiManaged && <label className="min-w-0 text-xs text-slate-500">Local order status<select aria-label="Local order status" value={draft.status} onChange={(event) => setDraft(order.id, "status", event.target.value as OrderStatus)} disabled={saving} className={cn(inputStyle, "mt-1.5", ORDER_COLORS[draft.status])}>{ALL_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>}
                    <label className="min-w-0 text-xs text-slate-500 sm:col-span-2 lg:col-span-4"><span className="flex items-center gap-1.5"><StickyNote className="h-3.5 w-3.5" />Internal note · only for your team</span><textarea aria-label="Internal note" value={draft.notes} onChange={(event) => setDraft(order.id, "notes", event.target.value)} disabled={saving} rows={2} placeholder="Admin note…" className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs leading-5 outline-none focus:border-sky-400" /></label>
                  </div>
                  <div className="mt-3 flex flex-wrap justify-between gap-3">{!apiManaged ? <div className="flex flex-wrap gap-2"><button type="button" onClick={() => quickStatus(order.id, "shipped")} disabled={saving} className={cn(actionStyle, "bg-indigo-50 text-indigo-700 hover:bg-indigo-100")}>Mark shipped</button><button type="button" onClick={() => quickStatus(order.id, "delivered")} disabled={saving} className={cn(actionStyle, "bg-emerald-50 text-emerald-700 hover:bg-emerald-100")}>Mark delivered</button><button type="button" onClick={() => quickStatus(order.id, "cancelled")} disabled={saving} className={cn(actionStyle, "bg-rose-50 text-rose-700 hover:bg-rose-100")}>Cancel locally</button></div> : <p className="self-center text-[11px] text-slate-400">Courier booking cancel এখানে করা হয় না।</p>}<button type="button" onClick={() => saveDelivery(order.id)} disabled={saving || busy} className={cn(actionStyle, "bg-sky-600 text-white hover:bg-sky-700")}>{saving ? "Saving..." : "Save changes"}</button></div>
                </details>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
