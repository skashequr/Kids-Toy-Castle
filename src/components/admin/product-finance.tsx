"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { financeSummary, unitCost, type FinanceData } from "@/lib/finance";
import { dhakaDate } from "@/lib/order-date-range";
import { formatPrice } from "@/lib/utils";
import { saveProductCost } from "@/server/actions/finance";
import { toast } from "@/components/ui/toaster";

const field = "mt-1 w-full rounded-xl border border-sky-100 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#238fda]";
const money = (n: number) => formatPrice(n / 100);

export function ProductFinance({ data, from, to }: { data: FinanceData; from: string; to: string }) {
  const router = useRouter();
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [search, setSearch] = useState("");
  const product = data.products.find((p) => p.id === productId);
  const current = unitCost(data.costs, productId, variantId, dhakaDate());
  const summary = financeSummary(data, from, to);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const amount = String(values.get("cost"));
    if (!/^\d+(\.\d{1,2})?$/.test(amount)) { toast.error("Enter a buying price with up to two decimal places."); return; }
    lock.current = true; setBusy(true);
    try {
      const result = await saveProductCost({ productId, variantId, effectiveFrom: String(values.get("date")), unitCostCents: Math.round(Number(amount) * 100) });
      if (!result.ok) { toast.error(result.error || "Could not save buying price."); return; }
      toast.success("Buying price saved. Profit calculations updated."); router.refresh(); form.reset();
    } catch { toast.error("Could not confirm the save. Retry the same price and date."); }
    finally { lock.current = false; setBusy(false); }
  }

  return <div className="space-y-6">
    <section className="rounded-2xl border border-sky-100 bg-white p-5">
      <h2 className="text-lg font-bold">Product buying prices</h2>
      <p className="mt-1 text-sm text-slate-500">Set the cost per unit. Sold quantity × buying price is calculated automatically. Variant prices override the product default.</p>
      <form onSubmit={save} className="mt-4"><fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm">Product<select required className={field} value={productId} onChange={(e) => { setProductId(e.target.value); setVariantId(""); }}><option value="">Select product</option>{data.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <label className="text-sm">Variant<select className={field} value={variantId} onChange={(e) => setVariantId(e.target.value)}><option value="">Product default</option>{product?.variants.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select></label>
        <label className="text-sm">Buying price per unit (BDT)<input name="cost" required inputMode="decimal" placeholder={current === null ? "Not set" : String(current / 100)} className={field} /></label>
        <label className="text-sm">Effective from<input name="date" type="date" defaultValue={dhakaDate()} max={dhakaDate()} required className={field} /></label>
        <div className="sm:col-span-2 lg:col-span-4"><p className="mb-3 text-xs text-slate-500">{product && <>Current buying price: {current === null ? "Not set" : money(current)} · Listed product selling price: {money(product.priceCents)}. </>}Costs apply by delivery date until the next rate. Backdating or replacing a rate recalculates affected reports; it does not record a stock purchase or cash payment.</p><button disabled={busy || !productId} className="rounded-xl bg-[#238fda] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Save buying price"}</button></div>
      </fieldset></form>
      <details className="mt-4 text-sm"><summary className="cursor-pointer font-medium text-[#238fda]">View buying-price schedule</summary><div className="mt-3 max-h-64 overflow-auto"><table className="w-full text-left"><thead><tr>{["Product / variant", "Effective from", "Buying price / unit"].map((h) => <th key={h} className="p-2">{h}</th>)}</tr></thead><tbody>{data.costs.map((c) => { const p = data.products.find((p) => p.id === c.productId); return <tr key={`${c.productId}:${c.variantId}:${c.effectiveFrom}`} className="border-t border-sky-50"><td className="p-2">{p?.name || "Archived product"} / {c.variantId ? p?.variants.find((v) => v.id === c.variantId)?.name || "Archived variant" : "Default"}</td><td className="p-2">{c.effectiveFrom}</td><td className="p-2">{money(c.unitCostCents)}</td></tr>; })}</tbody></table>{!data.costs.length && <p className="p-3 text-slate-500">No buying prices recorded.</p>}</div></details>
    </section>
    <section className="overflow-hidden rounded-2xl border border-sky-100 bg-white">
      <div className="p-5"><h2 className="text-lg font-bold">Product profitability</h2><p className="mt-1 text-sm text-slate-500">Net product sales after discounts, excluding customer shipping. Profit subtracts buying costs, linked marketing and other linked expenses. Shared costs are deducted only in the business totals.</p><input aria-label="Search product profitability" placeholder="Search product…" value={search} onChange={(e) => setSearch(e.target.value)} className={`${field} max-w-sm`} /></div>
      <div className="overflow-x-auto"><table className="w-full whitespace-nowrap text-left text-sm"><thead className="bg-sky-50 text-slate-500"><tr>{["Product", "Units sold", "Avg. buying / unit", "Sales", "Buying cost", "Marketing", "Other costs", "Product profit", "Profit margin"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead><tbody>{summary.productRows.filter((r) => r.name.toLowerCase().includes(search.toLowerCase())).map((r) => <tr key={r.id} className="border-t border-sky-50"><td className="max-w-64 whitespace-normal px-4 py-4 font-medium">{r.name}{r.missingUnits > 0 && <p className="text-xs text-rose-600">Buying price missing: {r.missingUnits} units</p>}</td><td className="px-4 py-4">{r.quantity}</td><td className="px-4 py-4">{r.missingUnits || !r.quantity ? "—" : money(Math.round(r.purchaseCost / r.quantity))}</td><td className="px-4 py-4">{money(r.revenue)}</td><td className="px-4 py-4">{r.missingUnits ? "Incomplete" : money(r.purchaseCost)}</td><td className="px-4 py-4">{money(r.marketing)}</td><td className="px-4 py-4">{money(r.otherCosts)}</td><td className={`px-4 py-4 font-semibold ${r.profit < 0 ? "text-rose-600" : "text-[#238fda]"}`}>{r.missingUnits ? "Incomplete" : money(r.profit)}</td><td className="px-4 py-4">{r.missingUnits || r.margin === null ? "—" : `${r.margin.toFixed(2)}%`}</td></tr>)}{!summary.productRows.length && <tr><td colSpan={9} className="p-8 text-center text-slate-500">No delivered sales or product-linked expenses in this period.</td></tr>}</tbody></table></div>
      <p className="p-5 text-xs text-slate-500">Profit margin = product profit ÷ net product sales × 100. This is margin on sales, not markup on buying cost. Unlinked manual-order items need a product link before their cost can be calculated.</p>
    </section>
  </div>;
}
