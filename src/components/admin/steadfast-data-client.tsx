"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CreditCard, RefreshCw, RotateCcw, Search, ShieldCheck } from "lucide-react";
import {
  loadSteadfastPaymentDetails,
  lookupSteadfastStatus,
  refreshSteadfastOverview,
  requestSteadfastReturn,
  runCourierFraudCheck,
  type SteadfastOverview,
} from "@/server/actions/steadfast";
import type { FraudCheckResult } from "@/server/services/steadfast";
import { toast } from "@/components/ui/toaster";

type BookedOrder = { id: string; orderNumber: string; customer: string };
type Tab = "returns" | "payments" | "stations" | "tools";

const money = (value: number | string | undefined) =>
  new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 2 })
    .format(Number(value) || 0);

const date = (value?: string | null) => {
  const parsed = value ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime())
    ? new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" }).format(parsed)
    : "—";
};

export function SteadfastDataClient({
  initialData,
  initialError,
  bookedOrders,
}: {
  initialData: SteadfastOverview | null;
  initialError: string;
  bookedOrders: BookedOrder[];
}) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(initialError);
  const [tab, setTab] = useState<Tab>("returns");
  const [loading, setLoading] = useState(false);
  const [stationSearch, setStationSearch] = useState("");
  const [lookupKind, setLookupKind] = useState<"invoice" | "tracking" | "consignment">("invoice");
  const [lookupValue, setLookupValue] = useState("");
  const [lookupResult, setLookupResult] = useState("");
  const [fraudPhone, setFraudPhone] = useState("");
  const [fraudResult, setFraudResult] = useState<FraudCheckResult | null>(null);
  const [returnOrderId, setReturnOrderId] = useState(bookedOrders[0]?.id ?? "");
  const [returnReason, setReturnReason] = useState("");
  const [paymentDetails, setPaymentDetails] = useState<Record<string, unknown> | null>(null);
  const [previousData, setPreviousData] = useState(initialData);
  const [previousError, setPreviousError] = useState(initialError);
  const busy = useRef(false);

  if (previousData !== initialData || previousError !== initialError) {
    setPreviousData(initialData);
    setPreviousError(initialError);
    setData(initialData);
    setError(initialError);
  }

  const perform = async (operation: () => Promise<void>) => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    try { await operation(); }
    catch { toast.error("Could not connect. Please retry."); }
    finally { busy.current = false; setLoading(false); }
  };

  const refreshData = async (notify = true) => {
    const result = await refreshSteadfastOverview();
    if (result.ok) {
      setData(result.data);
      setError(result.data.errors.join(" · "));
      if (notify && !result.data.errors.length) toast.success("All Steadfast data refreshed.");
    } else {
      setError(result.error);
      if (notify) toast.error(result.error);
    }
  };
  const refresh = (notify = true) => perform(() => refreshData(notify));

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!busy.current && document.visibilityState === "visible" &&
        !document.activeElement?.matches("input, textarea, select")) router.refresh();
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [router]);

  const stations = useMemo(() => {
    const query = stationSearch.trim().toLowerCase();
    return (data?.districts ?? []).flatMap((district) =>
      (district.policestations ?? [])
        .filter((station) => !query || `${district.name} ${station.name} ${station.post_code ?? ""}`.toLowerCase().includes(query))
        .map((station) => ({ ...station, district: district.name }))
    );
  }, [data?.districts, stationSearch]);

  const runLookup = () => perform(async () => {
    setLookupResult("");
    const result = await lookupSteadfastStatus(lookupKind, lookupValue);
    if (result.ok) setLookupResult(result.deliveryStatus);
    else toast.error(result.error);
  });

  const runFraudCheck = () => perform(async () => {
    setFraudResult(null);
    const result = await runCourierFraudCheck(fraudPhone);
    if (result.ok) setFraudResult(result.result);
    else toast.error(result.error);
  });

  const createReturn = () => perform(async () => {
    if (!returnOrderId) return toast.error("Select a Steadfast order.");
    const result = await requestSteadfastReturn(returnOrderId, returnReason);
    if (result.ok) {
      toast.success(`Return request #${result.request.id} created.`);
      setReturnReason("");
      await refreshData(false);
      router.refresh();
    } else toast.error(result.error);
  });

  const loadPayment = (id: number) => perform(async () => {
    setPaymentDetails(null);
    const result = await loadSteadfastPaymentDetails(id);
    if (result.ok) setPaymentDetails(result.payment);
    else toast.error(result.error);
  });

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: "returns", label: `Returns (${data?.returns.length ?? 0})` },
    { key: "payments", label: `Payments (${data?.payments.length ?? 0})` },
    { key: "stations", label: `Police stations (${stations.length})` },
    { key: "tools", label: "Lookup & fraud check" },
  ];

  return (
    <section className="mx-auto mt-6 max-w-7xl overflow-hidden rounded-3xl border border-[#d8edf9] bg-white shadow-[0_8px_22px_rgba(46,128,179,.06)]">
      <div className="flex flex-col gap-4 border-b border-[#e3f1fa] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#e8548b]">Live courier data</p>
          <h2 className="mt-1 font-serif text-2xl font-bold text-[#23557d]">Steadfast operations</h2>
          <p className="mt-1 text-xs text-[#7895aa]">Auto-refreshes every 60 seconds · Last update: {date(data?.fetchedAt)}</p>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
        <button type="button" onClick={() => refresh()} disabled={loading} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#238fda] px-4 text-sm font-semibold text-white disabled:opacity-60">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh all data
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-[#e3f1fa] px-5 py-3">
        {tabs.map((item) => <button key={item.key} type="button" onClick={() => setTab(item.key)} className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold ${tab === item.key ? "bg-[#dff3ff] text-[#1d76af]" : "text-[#66869d] hover:bg-[#f5fbff]"}`}>{item.label}</button>)}
      </div>

      <div className="p-5">
        {tab === "returns" && <div className="space-y-5">
          <div className="grid gap-3 rounded-2xl bg-[#f7fcff] p-4 md:grid-cols-[1fr_1fr_auto]">
            <select value={returnOrderId} onChange={(event) => setReturnOrderId(event.target.value)} className="h-11 rounded-xl border border-[#c9e3f3] bg-white px-3 text-sm">
              <option value="">Select a booked order</option>
              {bookedOrders.map((order) => <option key={order.id} value={order.id}>{order.orderNumber} — {order.customer}</option>)}
            </select>
            <input value={returnReason} onChange={(event) => setReturnReason(event.target.value)} placeholder="Return reason (optional)" className="h-11 rounded-xl border border-[#c9e3f3] px-3 text-sm" />
            <button type="button" onClick={createReturn} disabled={loading || !returnOrderId} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white disabled:opacity-60"><RotateCcw className="h-4 w-4" /> Create return</button>
          </div>
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-[#f1faff] text-left text-xs uppercase text-[#7694a9]"><tr><th className="p-3">Request</th><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Reason</th><th className="p-3">Status</th><th className="p-3">Created</th></tr></thead><tbody className="divide-y divide-[#e7f2f8]">{(data?.returns ?? []).map((item) => <tr key={item.id}><td className="p-3 font-mono">#{item.id}</td><td className="p-3"><p className="font-semibold">{item.consignment?.invoice ?? item.consignment_id}</p><p className="text-xs text-[#7895aa]">{item.consignment?.tracking_code}</p></td><td className="p-3">{item.consignment?.recipient_name ?? "—"}</td><td className="p-3">{item.reason || "—"}</td><td className="p-3 capitalize">{item.status}</td><td className="p-3">{date(item.created_at)}</td></tr>)}{!data?.returns.length && <tr><td colSpan={6} className="p-10 text-center text-[#7895aa]">No return requests.</td></tr>}</tbody></table></div>
        </div>}

        {tab === "payments" && <div className="space-y-4">
          <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-sm"><thead className="bg-[#f1faff] text-left text-xs uppercase text-[#7694a9]"><tr><th className="p-3">Payment</th><th className="p-3">Amount</th><th className="p-3">Charges</th><th className="p-3">Total</th><th className="p-3">Method</th><th className="p-3">Status</th><th className="p-3">Date</th><th className="p-3"></th></tr></thead><tbody className="divide-y divide-[#e7f2f8]">{(data?.payments ?? []).map((item) => <tr key={item.payment_id}><td className="p-3 font-mono">#{item.payment_id}</td><td className="p-3">{money(item.amount)}</td><td className="p-3">{money(item.charges)}</td><td className="p-3 font-semibold">{money(item.total)}</td><td className="p-3">{item.method || "—"}</td><td className="p-3">{item.status_label || "—"}</td><td className="p-3">{date(item.created_at)}</td><td className="p-3"><button type="button" onClick={() => loadPayment(item.payment_id)} className="rounded-lg bg-[#e7f5fd] px-3 py-1.5 text-xs font-semibold text-[#2879aa]">Details</button></td></tr>)}{!data?.payments.length && <tr><td colSpan={8} className="p-10 text-center text-[#7895aa]">No payments available.</td></tr>}</tbody></table></div>
          {paymentDetails && <div className="rounded-2xl bg-[#102f4e] p-4 text-xs text-white"><div className="mb-3 flex items-center gap-2 font-bold"><CreditCard className="h-4 w-4" /> Payment details</div><pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words text-white/80">{JSON.stringify(paymentDetails, null, 2)}</pre></div>}
        </div>}

        {tab === "stations" && <div className="space-y-4">
          <div className="relative max-w-xl"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7895aa]" /><input value={stationSearch} onChange={(event) => setStationSearch(event.target.value)} placeholder="Search district, police station or postcode" className="h-11 w-full rounded-xl border border-[#c9e3f3] pl-10 pr-3 text-sm" /></div>
          <div className="grid max-h-[560px] gap-3 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">{stations.map((station) => <div key={`${station.district}-${station.id}`} className="rounded-2xl border border-[#dcecf5] p-4"><div className="flex items-start gap-3"><Building2 className="mt-0.5 h-5 w-5 text-[#238fda]" /><div><p className="font-semibold text-[#23557d]">{station.name}</p><p className="text-xs text-[#7895aa]">{station.district}{station.post_code ? ` · ${station.post_code}` : ""}</p>{station.address && <p className="mt-2 text-xs text-[#54758e]">{station.address}</p>}</div></div></div>)}</div>
        </div>}

        {tab === "tools" && <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#dcecf5] p-5"><h3 className="font-serif text-lg font-bold text-[#23557d]">Status lookup</h3><p className="mt-1 text-xs text-[#7895aa]">Lookup by invoice, tracking code or consignment ID.</p><div className="mt-4 grid gap-3 sm:grid-cols-[150px_1fr_auto]"><select value={lookupKind} onChange={(event) => setLookupKind(event.target.value as typeof lookupKind)} className="h-11 rounded-xl border border-[#c9e3f3] px-3 text-sm"><option value="invoice">Invoice</option><option value="tracking">Tracking code</option><option value="consignment">Consignment ID</option></select><input value={lookupValue} onChange={(event) => setLookupValue(event.target.value)} className="h-11 rounded-xl border border-[#c9e3f3] px-3 text-sm" placeholder="Enter value" /><button type="button" onClick={runLookup} disabled={loading} className="h-11 rounded-xl bg-[#238fda] px-4 text-sm font-semibold text-white">Check</button></div>{lookupResult && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold capitalize text-emerald-700">Status: {lookupResult.replaceAll("_", " ")}</p>}</div>
          <div className="rounded-2xl border border-[#dcecf5] p-5"><h3 className="flex items-center gap-2 font-serif text-lg font-bold text-[#23557d]"><ShieldCheck className="h-5 w-5" /> Courier fraud check</h3><p className="mt-1 text-xs text-[#7895aa]">Cross-courier delivery history by customer phone.</p><div className="mt-4 flex gap-3"><input value={fraudPhone} onChange={(event) => setFraudPhone(event.target.value)} className="h-11 min-w-0 flex-1 rounded-xl border border-[#c9e3f3] px-3 text-sm" placeholder="01XXXXXXXXX" /><button type="button" onClick={runFraudCheck} disabled={loading} className="h-11 rounded-xl bg-[#173f67] px-4 text-sm font-semibold text-white">Check</button></div>{fraudResult && <div className="mt-4 space-y-3"><div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-[#f1faff] p-3"><b>{fraudResult.total_orders}</b><span className="block text-[10px] text-[#7895aa]">Orders</span></div><div className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><b>{fraudResult.total_delivered}</b><span className="block text-[10px]">Delivered</span></div><div className="rounded-xl bg-red-50 p-3 text-red-600"><b>{fraudResult.total_cancelled}</b><span className="block text-[10px]">Cancelled</span></div></div><p className="text-sm font-semibold text-[#23557d]">Delivery rate: {fraudResult.delivery_rate}</p>{fraudResult.couriers.map((courier) => <div key={courier.courier_name} className="flex justify-between border-t border-[#e3f1fa] pt-2 text-xs"><span>{courier.courier_name}</span><span>{courier.delivery_rate}</span></div>)}</div>}</div>
        </div>}
      </div>
    </section>
  );
}
