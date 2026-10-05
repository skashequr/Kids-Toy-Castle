"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import { FINANCE_CATEGORIES, financeSummary, type FinanceData } from "@/lib/finance";
import { dhakaDate, orderPresetRange, type OrderDateRange } from "@/lib/order-date-range";
import { formatPrice } from "@/lib/utils";
import { addFinanceEntry, voidFinanceEntry } from "@/server/actions/finance";
import { toast } from "@/components/ui/toaster";
import { ProductFinance } from "./product-finance";

const field = "w-full rounded-xl border border-sky-100 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#238fda] focus:ring-2 focus:ring-sky-100 disabled:opacity-50";
const button = "rounded-xl bg-[#238fda] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#187bbf] disabled:opacity-50";
const money = (cents: number) => formatPrice(cents / 100);

export function AdminFinanceClient({ data, initialRange }: { data: FinanceData; initialRange: OrderDateRange }) {
  const router = useRouter();
  const [range, setRange] = useState(initialRange);
  const [draftRange, setDraftRange] = useState(initialRange);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState<string>("Marketing");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const request = useRef<string | null>(null);
  const [correction, setCorrection] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const summary = financeSummary(data, range.from, range.to);
  const ledger = data.entries.filter((e) => e.date >= range.from && e.date <= range.to);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const amount = String(values.get("amount"));
    if (!/^\d+(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) { toast.error("Enter a positive amount with up to two decimal places."); return; }
    lock.current = true; setBusy(true);
    request.current ??= crypto.randomUUID();
    try {
      const result = await addFinanceEntry({ requestId: request.current, date: String(values.get("date")), type, category, amountCents: Math.round(Number(amount) * 100), description: String(values.get("description")), reference: String(values.get("reference")), productId: String(values.get("productId") || "") });
      if (!result.ok) { toast.error(result.error || "Could not save entry."); request.current = null; return; }
      request.current = null; form.reset(); toast.success("Entry recorded."); router.refresh();
    } catch { toast.error("Could not confirm the save. Retry the same entry to avoid duplicates."); }
    finally { lock.current = false; setBusy(false); }
  }

  async function voidEntry() {
    if (!correction || lock.current) return;
    lock.current = true; setBusy(true);
    try {
      const result = await voidFinanceEntry(correction, reason);
      if (!result.ok) { toast.error(result.error || "Could not void entry."); return; }
      setCorrection(null); setReason(""); toast.success("Entry voided. You can now record a corrected entry."); router.refresh();
    } catch { toast.error("Could not confirm the correction. Refresh before retrying."); }
    finally { lock.current = false; setBusy(false); }
  }

  return <div className="space-y-6 text-slate-800">
    <header className="rounded-2xl bg-[#238fda] p-6 text-white">
      <div className="flex items-center gap-3"><Wallet size={28} /><h1 className="text-2xl font-bold">Business Finance</h1></div>
      <p className="mt-2 text-sm text-sky-50">Track delivered sales, business expenses and recorded profit in one place.</p>
    </header>
    <section className="space-y-4 rounded-2xl border border-sky-100 bg-white p-5">
      <div className="flex flex-wrap gap-2">{[[7,"7 days"],[15,"15 days"],[30,"1 month"],[90,"3 months"],[180,"6 months"],[365,"1 year"]].map(([days,label]) => <button key={days} type="button" onClick={() => { const next = orderPresetRange(Number(days)); setRange(next); setDraftRange(next); }} className="rounded-full bg-sky-50 px-4 py-2 text-sm font-medium text-[#238fda] hover:bg-sky-100">{label}</button>)}</div>
      <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); if (!draftRange.from || !draftRange.to || draftRange.from > draftRange.to) { toast.error("Choose a valid date range."); return; } setRange(draftRange); }}>
        <label className="text-xs font-medium">From<input required type="date" className={field} value={draftRange.from} onChange={(e) => setDraftRange({ ...draftRange, from: e.target.value })} /></label>
        <label className="text-xs font-medium">To<input required type="date" className={field} value={draftRange.to} onChange={(e) => setDraftRange({ ...draftRange, to: e.target.value })} /></label>
        <button className={button}>Apply dates</button><p className="pb-2 text-xs text-slate-500">{range.from} — {range.to} · Bangladesh time</p>
      </form>
    </section>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[
      ["Delivered sales", summary.revenue], ["Other income", summary.otherIncome], ["Cost of goods sold", summary.costOfGoods], ["Marketing spend", summary.marketing], ["Other operating expenses", summary.operatingExpenses - summary.marketing], ["Gross profit", summary.grossProfit], ["Recorded net profit / loss", summary.netProfit],
    ].map(([label, amount], i) => <div key={label} className={`rounded-2xl border p-5 ${i === 5 ? "border-pink-100 bg-pink-50" : "border-sky-100 bg-white"}`}><p className="text-sm text-slate-500">{label}</p><p className={`mt-2 text-2xl font-bold ${Number(amount) < 0 ? "text-rose-600" : "text-[#238fda]"}`}>{summary.missingUnits > 0 && ["Cost of goods sold", "Gross profit", "Recorded net profit / loss"].includes(String(label)) ? "Incomplete" : money(Number(amount))}</p></div>)}</div>
    <div className="rounded-2xl border border-pink-100 bg-pink-50 p-5"><p className="text-sm text-slate-500">Business net profit margin</p><p className="mt-2 text-3xl font-bold text-[#238fda]">{summary.missingUnits || summary.netMargin === null ? "—" : `${summary.netMargin.toFixed(2)}%`}</p><p className="mt-1 text-xs text-slate-500">Net profit ÷ delivered sales × 100 · Includes shared expenses and other income.</p></div>
    <ProductFinance data={data} from={range.from} to={range.to} />
    <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm leading-6 text-slate-600">
      <p>Net profit = delivered sales + other income − cost of goods sold − operating expenses. Sales include customer shipping charges after discounts; this is not a cash-receipts report. Record actual courier costs separately.</p>
      <p>Only currently delivered orders count. Returned or cancelled orders are excluded, so status corrections can change earlier reports. Older orders without a delivery timestamp use their order date.</p>
      {summary.missingUnits > 0 && <p className="mt-2 font-semibold text-rose-700">Buying prices are missing for {summary.missingUnits} sold units. Set the relevant dated prices before profit can be calculated.</p>}
      {summary.manualCost > 0 && <p className="mt-2 font-semibold text-rose-700">Legacy manual product costs: {money(summary.manualCost)} are added to automatic buying costs. Void any overlapping manual entries to prevent double counting.</p>}
    </div>
    <section className="rounded-2xl border border-sky-100 bg-white p-5">
      <h2 className="text-lg font-bold">Record income or expense</h2>
      <p className="mt-1 text-sm text-slate-500">Sales and product buying costs are automatic. Record marketing and other actual expenses here; select a product to include them in its profitability. Leave shared business costs unassigned.</p>
      <form onSubmit={submit} className="mt-5">
        <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 disabled:opacity-60">
          <label className="space-y-1 text-sm">Entry type<select className={field} value={type} onChange={(e) => { const next = e.target.value as "income" | "expense"; setType(next); setCategory(next === "expense" ? "Marketing" : "Other income"); }}><option value="expense">Expense</option><option value="income">Other income</option></select></label>
          <label className="space-y-1 text-sm">Category<select className={field} value={category} onChange={(e) => setCategory(e.target.value)}>{FINANCE_CATEGORIES[type].filter((c) => c !== "Cost of goods sold").map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="space-y-1 text-sm">Date<input className={field} name="date" type="date" required defaultValue={initialRange.to} max={dhakaDate()} /></label>
          <label className="space-y-1 text-sm">Amount (BDT)<input className={field} name="amount" inputMode="decimal" placeholder="0.00" required /></label>
          <label className="space-y-1 text-sm">Assign to product<select name="productId" className={field} disabled={type !== "expense"}><option value="">Shared / unassigned</option>{data.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <label className="space-y-1 text-sm">Reference (optional)<input className={field} name="reference" maxLength={120} placeholder="Order or invoice number" /></label>
          <label className="space-y-1 text-sm">Description<input className={field} name="description" required maxLength={500} placeholder="What was this payment for?" /></label>
          <div><button disabled={busy} className={button}>{busy ? "Saving…" : "Save entry"}</button></div>
        </fieldset>
      </form>
    </section>
    <section className="overflow-hidden rounded-2xl border border-sky-100 bg-white">
      <div className="p-5"><h2 className="text-lg font-bold">Income & expense ledger</h2><p className="text-sm text-slate-500">Corrections keep the original record: void the entry with a reason, then add a replacement.</p></div>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-sky-50 text-slate-500"><tr>{["Date", "Details", "Recorded by", "Amount", "Action"].map((h) => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}</tr></thead><tbody>{ledger.map((entry) => <tr key={entry.id} className={`border-t border-sky-50 ${entry.voided ? "bg-slate-50 text-slate-400" : ""}`}>
        <td className="whitespace-nowrap px-5 py-4">{entry.date}</td><td className="min-w-56 px-5 py-4"><p className="font-medium">{entry.category}</p><p>{entry.description}</p>{entry.productId && <p className="text-xs text-[#238fda]">{data.products.find((p) => p.id === entry.productId)?.name || "Archived product"}</p>}<p className="text-xs text-slate-500">{entry.reference}</p>{entry.voided && <p className="mt-1 text-xs">Voided: {entry.voidReason}</p>}</td><td className="px-5 py-4 text-xs">{entry.createdBy}</td><td className="whitespace-nowrap px-5 py-4"><span className="flex items-center gap-1">{entry.type === "income" ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}{entry.type === "expense" ? "−" : "+"}{money(entry.amountCents)}</span></td><td className="px-5 py-4">{entry.voided ? "Voided" : <button disabled={busy} onClick={() => { setCorrection(entry.id); setReason(""); }} className="text-sm font-medium text-[#238fda]">Correct</button>}</td>
      </tr>)}{!ledger.length && <tr><td colSpan={5} className="p-8 text-center text-slate-500">No manual entries for this period.</td></tr>}</tbody></table></div>
    </section>
    {correction && <section className="rounded-2xl border border-pink-200 bg-pink-50 p-5"><h2 className="font-bold">Void incorrect entry</h2><p className="mt-1 text-sm">This removes the entry from totals but preserves its history.</p><label className="mt-3 block text-sm">Correction reason<input autoFocus value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} className={field} /></label><div className="mt-3 flex gap-3"><button disabled={busy || !reason.trim()} onClick={voidEntry} className={button}>Confirm void</button><button disabled={busy} onClick={() => setCorrection(null)} className="px-3 text-sm">Cancel</button></div></section>}
    <section className="overflow-hidden rounded-2xl border border-sky-100 bg-white"><div className="p-5"><h2 className="text-lg font-bold">Delivered sales · {summary.sales.length} orders</h2></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-sky-50"><tr>{["Order", "Recognition date", "Payment status", "Sales amount"].map((h) => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}</tr></thead><tbody>{summary.sales.map((sale) => <tr key={sale.id} className="border-t border-sky-50"><td className="px-5 py-3">{sale.orderNumber}</td><td className="px-5 py-3">{sale.date}{sale.estimatedDate && <span className="ml-2 text-xs text-slate-500">Order date fallback</span>}</td><td className="px-5 py-3 capitalize">{sale.paymentStatus}</td><td className="px-5 py-3">{money(sale.amountCents)}</td></tr>)}{!summary.sales.length && <tr><td colSpan={4} className="p-8 text-center text-slate-500">No delivered sales for this period.</td></tr>}</tbody></table></div></section>
  </div>;
}
