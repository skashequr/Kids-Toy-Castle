"use client";

import { useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { runCourierFraudCheck } from "@/server/actions/steadfast";
import type { FraudCheckResult } from "@/server/services/steadfast";

export function CourierFraudCheck() {
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<FraudCheckResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const busy = useRef(false);

  async function check() {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await runCourierFraudCheck(phone);
      if (response.ok) setResult(response.result);
      else setError(response.error);
    } catch {
      setError("Could not connect to the courier fraud checker. Please retry.");
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }

  return <section className="min-w-0 rounded-2xl border border-[#dcecf5] p-5">
    <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-[#23557d]"><ShieldCheck className="h-5 w-5" /> Courier fraud check</h3>
    <p className="mt-1 text-xs text-[#7895aa]">Cross-courier report supplied by Elite Mart, separate from the Steadfast booking API.</p>
    <form onSubmit={(event) => { event.preventDefault(); void check(); }} className="mt-4 flex gap-3">
      <label className="sr-only" htmlFor="courier-fraud-phone">Customer mobile number</label>
      <input id="courier-fraud-phone" type="tel" inputMode="tel" autoComplete="tel" required disabled={loading}
        value={phone} onChange={(event) => { setPhone(event.target.value); setResult(null); setError(""); }}
        aria-describedby="courier-fraud-help" aria-invalid={Boolean(error)}
        className="h-11 min-w-0 flex-1 rounded-xl border border-[#c9e3f3] px-3 text-sm" placeholder="01XXXXXXXXX" />
      <button type="submit" disabled={loading || !phone.trim()} className="h-11 rounded-xl bg-[#173f67] px-4 text-sm font-semibold text-white disabled:opacity-50">{loading ? "Checking…" : "Check"}</button>
    </form>
    <p id="courier-fraud-help" className="mt-2 text-xs text-[#7895aa]">বাংলা/English নম্বর বা +880 দেওয়া যাবে। Lookup করলে নম্বরটি Elite Mart-এ পাঠানো হবে।</p>
    {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div aria-live="polite" aria-busy={loading}>
      {result && <div className="mt-4 space-y-3">
        <p className="text-xs text-[#54758e]">Report for {result.phone}</p>
        {result.steadfast_configured === false && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">The provider reports Steadfast is not configured. Steadfast figures may be incomplete; zero does not confirm there is no delivery history.</p>}
        <div className="grid grid-cols-3 gap-2 text-center">
          {[["Orders", result.total_orders], ["Delivered", result.total_delivered], ["Cancelled", result.total_cancelled]].map(([label, count]) => <div key={label} className="rounded-xl bg-[#f1faff] p-3"><b>{count}</b><span className="block text-[10px] text-[#7895aa]">{label}</span></div>)}
        </div>
        <p className="text-sm font-semibold text-[#23557d]">Reported delivery rate: {result.delivery_rate}</p>
        <div className="overflow-x-auto"><table className="w-full text-left text-xs">
          <thead><tr className="text-[#7895aa]"><th className="py-2 pr-3">Courier</th><th className="px-2 py-2">Orders</th><th className="px-2 py-2">Delivered</th><th className="px-2 py-2">Cancelled</th><th className="py-2 pl-2">Rate / rating</th></tr></thead>
          <tbody>{result.couriers.map((courier, index) => <tr key={`${courier.courier_name}-${index}`} className="border-t border-[#e3f1fa] align-top">
            <td className="py-3 pr-3 font-semibold">{courier.courier_name}{courier.source && <span className="mt-1 block break-all font-normal text-[#7895aa]">Source: {courier.source}</span>}</td>
            <td className="p-2">{courier.data_type === "rating" ? "—" : courier.orders}</td>
            <td className="p-2">{courier.data_type === "rating" ? "—" : courier.delivered}</td>
            <td className="p-2">{courier.data_type === "rating" ? "—" : courier.cancelled}</td>
            <td className="py-3 pl-2">{courier.delivery_rate}{courier.customer_rating && <span className="mt-1 block">{courier.customer_rating.replaceAll("_", " ")}</span>}{courier.data_type === "rating" && <span className="mt-1 block text-amber-700">Rating only, not delivery counts</span>}</td>
          </tr>)}</tbody>
        </table></div>
        <p className="text-xs text-[#7895aa]">Provider figures can include ratings or aggregate estimates. Delivery history alone does not prove fraud.</p>
      </div>}
    </div>
    <a href="https://elitemart.com.bd/fraud-check" target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-xs font-semibold text-[#2879aa] underline">Open provider website ↗</a>
  </section>;
}
