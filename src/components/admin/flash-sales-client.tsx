"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, Zap, X, Check, Clock } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  createFlashSale,
  updateFlashSale,
  deleteFlashSale as deleteFlashSaleAction,
} from "@/server/actions/flashSales";

export interface AdminFlashRow {
  id: string;
  productId: string;
  productName: string;
  originalPrice: number;
  salePrice: number;
  stock: number;
  sold: number;
  endTime: string;
  active: boolean;
}
type FlashItem = AdminFlashRow;

export interface FlashProductOption {
  id: string;
  name: string;
  price: number;
}

type F = { productId: string; salePrice: string; stock: string; endTime: string; active: boolean };
const empty: F = { productId: "", salePrice: "", stock: "", endTime: "", active: true };

export function AdminFlashSalesClient({
  initial,
  products,
}: {
  initial: AdminFlashRow[];
  products: FlashProductOption[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<FlashItem[]>(initial);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<F>(empty);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const f = (k: keyof F, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));
  const selectedProduct = products.find((p) => p.id === form.productId);
  const originalPrice = selectedProduct?.price ?? 0;

  const openAdd = () => { setEditId(null); setForm({ ...empty, productId: products[0]?.id ?? "" }); setShowModal(true); };
  const openEdit = (item: FlashItem) => {
    setEditId(item.id);
    setForm({ productId: item.productId, salePrice: String(item.salePrice), stock: String(item.stock), endTime: item.endTime.slice(0, 16), active: item.active });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: FlashItem = {
      id: editId ?? `f${Date.now()}`,
      productId: form.productId,
      productName: selectedProduct?.name ?? "",
      originalPrice,
      salePrice: Number(form.salePrice),
      stock: Number(form.stock),
      sold: editId ? (items.find((i) => i.id === editId)?.sold ?? 0) : 0,
      endTime: form.endTime,
      active: form.active,
    };
    const input = {
      productId: form.productId,
      flashPrice: Number(form.salePrice),
      flashStock: Number(form.stock),
      saleEndsAt: form.endTime,
      isActive: form.active,
    };
    if (editId) { setItems((p) => p.map((i) => i.id === editId ? data : i)); await updateFlashSale(editId, input); }
    else { setItems((p) => [data, ...p]); await createFlashSale(input); }
    setShowModal(false);
    router.refresh();
  };

  const isRunning = (item: FlashItem) => item.active && new Date(item.endTime).getTime() >= Date.now();
  const liveDeals = items.filter(isRunning);
  const totalSold = items.reduce((total, item) => total + item.sold, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#238fda] px-6 py-7 text-white shadow-[0_16px_38px_rgba(35,143,218,0.22)] sm:px-8">
        <div className="absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/10" />
        <div className="absolute bottom-0 right-28 h-20 w-20 rounded-t-full bg-[#f9c55b]/25" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/75">Campaign center</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight">Flash Sales</h1>
            <p className="mt-1 text-sm text-white/85">Create limited-time offers and track every fast-moving toy deal.</p>
          </div>
        <button onClick={openAdd} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#f06a9f] px-4 text-sm font-bold text-white shadow-lg shadow-[#155d98]/20 transition hover:-translate-y-0.5 hover:bg-[#e8548b]">
          <Plus className="w-4 h-4" /> Add Flash Deal
        </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#d8edf9] bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#7895aa]">All flash deals</p>
          <p className="mt-1 text-2xl font-black text-[#234963]">{items.length}</p>
          <p className="mt-1 text-xs text-[#5f8298]">Scheduled and active campaigns</p>
        </div>
        <div className="rounded-2xl border border-[#ffd6e3] bg-[#fff5f8] p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#c84270]">Live now</p>
          <p className="mt-1 text-2xl font-black text-[#d95789]">{liveDeals.length}</p>
          <p className="mt-1 text-xs text-[#b56b86]">Deals currently visible to shoppers</p>
        </div>
        <div className="rounded-2xl border border-[#d6efd9] bg-[#f3fcf4] p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#49805b]">Units sold</p>
          <p className="mt-1 text-2xl font-black text-[#34784c]">{totalSold}</p>
          <p className="mt-1 text-xs text-[#61906f]">Across all flash-sale offers</p>
        </div>
      </section>

      <div className="space-y-4">
        {items.length === 0 && (
          <div className="rounded-3xl border border-dashed border-[#c9e3f3] bg-[#f7fcff] py-14 text-center">
            <Zap className="mx-auto h-8 w-8 text-[#f06a9f]" />
            <p className="mt-3 text-sm font-bold text-[#234963]">No flash deals yet</p>
            <p className="mt-1 text-xs text-[#7895aa]">Create a limited-time offer to get started.</p>
          </div>
        )}
        {items.map((item) => {
          const running = isRunning(item);
          const disc = item.originalPrice > 0 ? Math.round((1 - item.salePrice / item.originalPrice) * 100) : 0;
          const stockPct = item.stock > 0 ? Math.min(100, Math.round((item.sold / item.stock) * 100)) : 100;
          return (
            <div key={item.id} className={cn("rounded-3xl border bg-white p-5 shadow-[0_10px_30px_rgba(35,143,218,0.08)]", running ? "border-[#f5c45e]" : item.active ? "border-[#c9e3f3]" : "border-[#e3e9ed]")}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", running ? "bg-[#fff2c8]" : "bg-[#e4f5ff]")}>
                    <Zap className={cn("h-5 w-5", running ? "text-[#c07600]" : "text-[#248fd6]")} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-[#234963]">{item.productName}</p>
                      {running && <span className="animate-pulse rounded-full bg-[#ffe3ec] px-2 py-0.5 text-xs font-bold text-[#c84270]">LIVE</span>}
                      {!item.active && <span className="rounded-full bg-[#eef2f5] px-2 py-0.5 text-xs font-bold text-[#6d7f8c]">Inactive</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="font-black text-[#e8548b]">{formatPrice(item.salePrice)}</span>
                      <span className="text-sm text-[#7895aa] line-through">{formatPrice(item.originalPrice)}</span>
                      <span className="rounded-full bg-[#fff2c8] px-1.5 py-0.5 text-xs font-bold text-[#956400]">-{disc}%</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-[#7895aa]">
                      <Clock className="w-3 h-3" />
                      Ends {formatDate(item.endTime)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-[#234963]">{item.sold}/{item.stock} sold</p>
                    <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-[#dceef7]">
                      <div className="h-full rounded-full bg-[#f06a9f]" style={{ width: `${stockPct}%` }} />
                    </div>
                  </div>
                  <button onClick={() => openEdit(item)} className="rounded-lg bg-[#e4f5ff] p-2 text-[#248fd6] transition hover:bg-[#248fd6] hover:text-white"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => setDeleteId(item.id)} className="rounded-lg bg-[#fff2f6] p-2 text-[#e8548b] transition hover:bg-[#f06a9f] hover:text-white"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#163d5c]/45 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md rounded-3xl border border-[#d8edf9] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#d8edf9] bg-[#f1faff] p-5">
              <div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7895aa]">Campaign center</p><h3 className="text-lg font-black text-[#234963]">{editId ? "Edit Flash Deal" : "Add Flash Deal"}</h3></div>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-2 text-[#54758b] transition hover:bg-white hover:text-[#e8548b]"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="lbl">Product *</label>
                <select value={form.productId} onChange={(e) => f("productId", e.target.value)} required className="inp bg-white dark:bg-navy">
                  <option value="" disabled>Select a product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({formatPrice(p.price)})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="lbl">Original Price (৳)</label>
                  <input type="number" value={originalPrice} readOnly className="inp opacity-70" />
                </div>
                <div>
                  <label className="lbl">Sale Price (৳) *</label>
                  <input type="number" value={form.salePrice} onChange={(e) => f("salePrice", e.target.value)} required min={0} className="inp" />
                </div>
                <div>
                  <label className="lbl">Stock Limit *</label>
                  <input type="number" value={form.stock} onChange={(e) => f("stock", e.target.value)} required min={1} className="inp" />
                </div>
                <div>
                  <label className="lbl">Active</label>
                  <div className="flex h-10 items-center gap-2">
                    <button type="button" onClick={() => f("active", !form.active)} className={cn("relative h-5 w-10 rounded-full transition-colors", form.active ? "bg-[#248fd6]" : "bg-[#c9dbe5]")}>
                      <div className={cn("absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform", form.active && "translate-x-5")} />
                    </button>
                    <span className="text-sm">{form.active ? "Yes" : "No"}</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="lbl">End Time *</label>
                  <input type="datetime-local" value={form.endTime} onChange={(e) => f("endTime", e.target.value)} required className="inp" />
                </div>
              </div>
              {originalPrice > 0 && form.salePrice && (
                <div className="rounded-xl bg-[#fff9e8] p-3 text-center">
                  <span className="font-bold text-[#c07600]">{Math.round((1 - Number(form.salePrice) / originalPrice) * 100)}% discount</span>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="h-10 flex-1 rounded-xl bg-[#e4f5ff] text-sm font-bold text-[#248fd6] transition hover:bg-[#d3ecfa]">Cancel</button>
                <button type="submit" className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#f06a9f] text-sm font-bold text-white transition hover:bg-[#e8548b]"><Check className="h-4 w-4" />{editId ? "Save" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#163d5c]/45 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative w-full max-w-sm rounded-3xl border border-[#ffd6e3] bg-white p-6 text-center shadow-2xl">
            <Trash2 className="mx-auto mb-3 h-10 w-10 text-[#e8548b]" />
            <h3 className="mb-2 text-lg font-black text-[#234963]">Remove Flash Deal?</h3>
            <p className="mb-5 text-sm text-[#7895aa]">This flash deal will be removed from the sale page.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="h-10 flex-1 rounded-xl bg-[#e4f5ff] text-sm font-bold text-[#248fd6] transition hover:bg-[#d3ecfa]">Cancel</button>
              <button onClick={() => { const id = deleteId; setItems((p) => p.filter((i) => i.id !== id)); setDeleteId(null); void deleteFlashSaleAction(id); router.refresh(); }} className="h-10 flex-1 rounded-xl bg-[#f06a9f] text-sm font-bold text-white transition hover:bg-[#e8548b]">Remove</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .inp { width:100%; height:2.5rem; padding:0 0.75rem; border-radius:0.75rem; border:1px solid #c9e3f3; background:#f7fcff; color:#234963; font-size:0.875rem; outline:none; transition:border-color 0.2s, background 0.2s; }
        .inp:focus { border-color:#248fd6; background:#fff; }
        .lbl { display:block; font-size:0.625rem; font-weight:700; text-transform:uppercase; letter-spacing:0.07em; color:#7895aa; margin-bottom:0.375rem; }
      `}</style>
    </div>
  );
}
