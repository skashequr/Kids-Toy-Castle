"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Edit2, GripHorizontal, Package, Plus, RotateCcw, Search, Trash2, X } from "lucide-react";
import { deleteProduct as deleteProductAction, reorderProducts } from "@/server/actions/products";
import { toast } from "@/components/ui/toaster";
import { cn, formatPrice } from "@/lib/utils";
import type { Category, Product } from "@/types";

type SortKey = "manual" | "name" | "price" | "stock";

function SortMark({ active, direction }: { active: boolean; direction: "asc" | "desc" }) {
  return active ? direction === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" /> : null;
}

function ProductBadges({ product }: { product: Product }) {
  const badges = [
    product.isNew && ["New", "bg-[#e2f4ff] text-[#1d75ad]"],
    product.isFeatured && ["Featured", "bg-[#f0e5ff] text-[#7a48ab]"],
    product.isBestSeller && ["Best seller", "bg-[#fff2c8] text-[#956400]"],
    product.isOnSale && ["Sale", "bg-[#ffe3ec] text-[#c84270]"],
  ].filter(Boolean) as [string, string][];
  return <div className="flex flex-wrap gap-1">{badges.length ? badges.map(([label, classes]) => <span key={label} className={`rounded-full px-2 py-1 text-[10px] font-bold ${classes}`}>{label}</span>) : <span className="text-xs text-[#9ab0c0]">—</span>}</div>;
}

export function AdminProductsClient({ products, categories }: { products: Product[]; categories: Category[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all");
  const [sortKey, setSortKey] = useState<SortKey>("manual");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [orderedProducts, setOrderedProducts] = useState(products);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const canReorder = sortKey === "manual" && !search && categoryId === "all" && stockFilter === "all" && !isSavingOrder;
  const outOfStock = orderedProducts.filter((product) => product.stock === 0).length;
  const lowStock = orderedProducts.filter((product) => product.stock > 0 && product.stock < 10).length;
  const query = search.trim().toLowerCase();
  const filteredProducts = orderedProducts
    .filter((product) => (product.name.toLowerCase().includes(query) || product.sku.toLowerCase().includes(query)) && (categoryId === "all" || product.category.id === categoryId) && (stockFilter === "all" || (stockFilter === "out" ? product.stock === 0 : product.stock > 0 && product.stock < 10)))
    .sort((a, b) => {
      if (sortKey === "manual") return 0;
      const result = sortKey === "name" ? a.name.localeCompare(b.name) : sortKey === "price" ? a.price - b.price : a.stock - b.stock;
      return sortDirection === "asc" ? result : -result;
    });

  const resetView = () => { setSearch(""); setCategoryId("all"); setStockFilter("all"); setSortKey("manual"); setSortDirection("asc"); };
  const toggleSort = (key: Exclude<SortKey, "manual">) => { if (sortKey === key) setSortDirection((value) => value === "asc" ? "desc" : "asc"); else { setSortKey(key); setSortDirection("asc"); } };

  const onDrop = async (targetId: string) => {
    if (!canReorder || !draggedId || draggedId === targetId) { setDraggedId(null); return; }
    const from = orderedProducts.findIndex((product) => product.id === draggedId);
    const to = orderedProducts.findIndex((product) => product.id === targetId);
    if (from < 0 || to < 0) { setDraggedId(null); return; }
    const nextOrder = [...orderedProducts];
    const [moved] = nextOrder.splice(from, 1);
    nextOrder.splice(to, 0, moved);
    const previousOrder = orderedProducts;
    setOrderedProducts(nextOrder);
    setDraggedId(null);
    setIsSavingOrder(true);
    try {
      const response = await reorderProducts(nextOrder.map((product) => product.id));
      if (!response.ok) { setOrderedProducts(previousOrder); toast.error(response.error ?? "পণ্যের ক্রম সেভ করা যায়নি"); }
      else { toast.success("পণ্যের ক্রম সেভ হয়েছে"); router.refresh(); }
    } catch { setOrderedProducts(previousOrder); toast.error("পণ্যের ক্রম সেভ করা যায়নি"); }
    finally { setIsSavingOrder(false); }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#238fda] px-6 py-7 text-white shadow-[0_16px_38px_rgba(35,143,218,.2)] sm:px-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full border-[20px] border-white/10" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#ffe67e]">Store management</p><h1 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">পণ্যসমূহ</h1><p className="mt-2 text-sm text-white/85">আপনার খেলনা, স্টক ও প্রদর্শনের ক্রম সহজে নিয়ন্ত্রণ করুন।</p></div><button type="button" onClick={() => router.push("/admin/products/new")} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#f06a9f] px-5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(116,42,83,.22)] transition hover:-translate-y-0.5 hover:bg-[#db4e87]"><Plus className="h-4 w-4" /> নতুন পণ্য যোগ করুন</button></div>
      </section>

      <section className="grid grid-cols-3 gap-3"><Metric label="মোট পণ্য" value={orderedProducts.length} color="bg-[#e2f4ff] text-[#2178b3]" /><Metric label="স্টক কম" value={lowStock} color="bg-[#fff2c8] text-[#906100]" /><Metric label="স্টক শেষ" value={outOfStock} color="bg-[#ffe3ec] text-[#c84270]" /></section>

      <section className="rounded-3xl border border-[#d8edf9] bg-white p-4 shadow-[0_8px_22px_rgba(46,128,179,.06)] sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row"><label className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7c9bb0]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="নাম বা SKU দিয়ে খুঁজুন" className="h-11 w-full rounded-xl border border-[#c9e3f3] bg-[#f8fcff] pl-10 pr-3 text-sm text-[#234963] outline-none placeholder:text-[#9bb0be] focus:border-[#248fd6]" /></label><select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="h-11 rounded-xl border border-[#c9e3f3] bg-white px-3 text-sm text-[#46677f] outline-none focus:border-[#248fd6]"><option value="all">সব ক্যাটাগরি</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><select value={stockFilter} onChange={(event) => setStockFilter(event.target.value as typeof stockFilter)} className="h-11 rounded-xl border border-[#c9e3f3] bg-white px-3 text-sm text-[#46677f] outline-none focus:border-[#248fd6]"><option value="all">সব স্টক</option><option value="low">স্টক কম (১০-এর নিচে)</option><option value="out">স্টক শেষ</option></select></div>
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#eff9ff] p-3 text-xs leading-5 text-[#3973a0]"><GripHorizontal className="mt-0.5 h-4 w-4 shrink-0" /><p className="flex-1">{canReorder ? <>পণ্যের ক্রম বদলাতে সারিটি ধরে টেনে আনুন। এই ক্রমটিই গ্রাহকের পণ্য তালিকায় দেখা যাবে।</> : <>ক্রম বদলাতে সব filter ও sorting বন্ধ করুন।</>}</p>{!canReorder && <button type="button" onClick={resetView} className="inline-flex shrink-0 items-center gap-1 font-bold text-[#2178b3] hover:underline"><RotateCcw className="h-3.5 w-3.5" /> রিসেট</button>}</div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-[#d8edf9] bg-white shadow-[0_8px_22px_rgba(46,128,179,.06)]">
        <div className="hidden overflow-x-auto lg:block"><table className="w-full min-w-[880px] text-sm"><thead className="bg-[#f1faff] text-left text-[11px] font-bold uppercase tracking-wide text-[#7694a9]"><tr><th className="w-10 px-4 py-4" /><SortHead label="পণ্য" active={sortKey === "name"} direction={sortDirection} onClick={() => toggleSort("name")} /><th className="px-4 py-4">ক্যাটাগরি</th><th className="px-4 py-4">SKU</th><SortHead label="মূল্য" align="right" active={sortKey === "price"} direction={sortDirection} onClick={() => toggleSort("price")} /><SortHead label="স্টক" align="center" active={sortKey === "stock"} direction={sortDirection} onClick={() => toggleSort("stock")} /><th className="px-4 py-4">ট্যাগ</th><th className="px-4 py-4 text-right">অ্যাকশন</th></tr></thead><tbody className="divide-y divide-[#e8f3f9]">{filteredProducts.map((product) => <DesktopRow key={product.id} product={product} canReorder={canReorder} dragged={draggedId === product.id} saving={isSavingOrder} onDragStart={() => setDraggedId(product.id)} onDrop={() => onDrop(product.id)} onEdit={() => router.push(`/admin/products/${product.id}/edit`)} onDelete={() => setDeleteId(product.id)} />)}</tbody></table></div>
        <div className="space-y-3 p-4 lg:hidden">{filteredProducts.map((product) => <MobileProduct key={product.id} product={product} onEdit={() => router.push(`/admin/products/${product.id}/edit`)} onDelete={() => setDeleteId(product.id)} />)}</div>
        {filteredProducts.length === 0 && <div className="grid min-h-64 place-items-center px-5 text-center"><div><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e9f6ff] text-[#248fd6]"><Package className="h-6 w-6" /></span><p className="mt-4 font-bold text-[#315a77]">কোনো পণ্য পাওয়া যায়নি</p><button type="button" onClick={resetView} className="mt-2 text-sm font-bold text-[#248fd6] hover:underline">ফিল্টার রিসেট করুন</button></div></div>}
        <footer className="flex items-center justify-between border-t border-[#e8f3f9] px-5 py-3 text-xs text-[#7895aa]"><span>{filteredProducts.length} / {orderedProducts.length}টি পণ্য দেখানো হচ্ছে</span>{(search || categoryId !== "all" || stockFilter !== "all" || sortKey !== "manual") && <button type="button" onClick={resetView} className="inline-flex items-center gap-1 font-bold text-[#248fd6]"><X className="h-3.5 w-3.5" /> ফিল্টার মুছুন</button>}</footer>
      </section>

      {deleteId && <DeleteDialog onCancel={() => setDeleteId(null)} onConfirm={async () => { const response = await deleteProductAction(deleteId); setDeleteId(null); if (response.ok) { toast.success("পণ্যটি মুছে ফেলা হয়েছে"); router.refresh(); } else toast.error("পণ্যটি মুছতে সমস্যা হয়েছে"); }} />}
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: number; color: string }) { return <article className={`rounded-2xl p-4 ${color}`}><p className="text-xl font-bold">{value}</p><p className="mt-1 text-xs font-semibold opacity-80">{label}</p></article>; }
function SortHead({ label, active, direction, align = "left", onClick }: { label: string; active: boolean; direction: "asc" | "desc"; align?: "left" | "right" | "center"; onClick: () => void }) { const position = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"; const contentPosition = align === "right" ? "justify-end" : align === "center" ? "justify-center" : ""; return <th className={`cursor-pointer px-4 py-4 ${position}`} onClick={onClick}><span className={`flex items-center gap-1 ${contentPosition}`}>{label}<SortMark active={active} direction={direction} /></span></th>; }
function ProductThumb({ product }: { product: Product }) {
  return <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#e8f6ff] text-xl">{product.images[0]?.url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={product.images[0].url} alt="" className="h-full w-full object-cover" />
  ) : "🧸"}</div>;
}
function Stock({ value }: { value: number }) { const classes = value === 0 ? "bg-[#ffe3ec] text-[#c84270]" : value < 10 ? "bg-[#fff2c8] text-[#956400]" : "bg-[#e8f8e8] text-[#34784c]"; return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${classes}`}>{value === 0 ? "স্টক শেষ" : `${value}টি`}</span>; }
function DesktopRow({ product, canReorder, dragged, saving, onDragStart, onDrop, onEdit, onDelete }: { product: Product; canReorder: boolean; dragged: boolean; saving: boolean; onDragStart: () => void; onDrop: () => void; onEdit: () => void; onDelete: () => void }) { return <tr draggable={canReorder} onDragStart={onDragStart} onDragOver={(event) => event.preventDefault()} onDrop={onDrop} className={cn("transition", canReorder && "cursor-grab", dragged ? "bg-[#dff3ff] opacity-60" : "hover:bg-[#f8fcff]", saving && "pointer-events-none opacity-60")}><td className="px-4 py-3 text-[#94adbd]"><GripHorizontal className="h-4 w-4" /></td><td className="px-4 py-3"><div className="flex items-center gap-3"><ProductThumb product={product} /><div className="min-w-0"><p className="max-w-48 truncate font-bold text-[#234963]">{product.name}</p><p className="mt-0.5 text-xs text-[#7c99ac]">{product.brand || "No brand"}</p></div></div></td><td className="px-4 py-3 text-xs font-medium text-[#52748c]">{product.category.name}</td><td className="px-4 py-3 font-mono text-xs text-[#7895aa]">{product.sku}</td><td className="px-4 py-3 text-right font-bold text-[#e8548b]">{formatPrice(product.price)}</td><td className="px-4 py-3 text-center"><Stock value={product.stock} /></td><td className="px-4 py-3"><ProductBadges product={product} /></td><td className="px-4 py-3"><div className="flex justify-end gap-1"><ActionButton label="Edit" onClick={onEdit}><Edit2 className="h-4 w-4" /></ActionButton><ActionButton label="Delete" danger onClick={onDelete}><Trash2 className="h-4 w-4" /></ActionButton></div></td></tr>; }
function MobileProduct({ product, onEdit, onDelete }: { product: Product; onEdit: () => void; onDelete: () => void }) { return <article className="rounded-2xl border border-[#e2f0f8] p-3"><div className="flex gap-3"><ProductThumb product={product} /><div className="min-w-0 flex-1"><p className="truncate font-bold text-[#234963]">{product.name}</p><p className="mt-1 text-xs text-[#7895aa]">{product.category.name} · {product.sku}</p><div className="mt-2 flex items-center justify-between"><span className="font-bold text-[#e8548b]">{formatPrice(product.price)}</span><Stock value={product.stock} /></div></div></div><div className="mt-3 flex items-center justify-between"><ProductBadges product={product} /><div className="flex gap-1"><ActionButton label="Edit" onClick={onEdit}><Edit2 className="h-4 w-4" /></ActionButton><ActionButton label="Delete" danger onClick={onDelete}><Trash2 className="h-4 w-4" /></ActionButton></div></div></article>; }
function ActionButton({ label, danger, children, onClick }: { label: string; danger?: boolean; children: React.ReactNode; onClick: () => void }) { return <button type="button" aria-label={label} title={label} onClick={onClick} className={cn("grid h-9 w-9 place-items-center rounded-lg transition", danger ? "text-[#d7547a] hover:bg-[#fff0f4]" : "text-[#3976a1] hover:bg-[#e9f6ff]")}>{children}</button>; }
function DeleteDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) { return <div className="fixed inset-0 z-[70] grid place-items-center p-4"><button type="button" aria-label="Close dialog" onClick={onCancel} className="absolute inset-0 bg-[#163d5c]/45 backdrop-blur-sm" /><div className="relative w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#ffe5ec] text-[#d7547a]"><Trash2 className="h-6 w-6" /></span><h2 className="mt-4 text-xl font-bold text-[#234963]">পণ্যটি মুছে ফেলবেন?</h2><p className="mt-2 text-sm leading-6 text-[#6b8497]">এই কাজটি আর ফিরিয়ে আনা যাবে না।</p><div className="mt-6 grid grid-cols-2 gap-3"><button type="button" onClick={onCancel} className="h-11 rounded-xl border border-[#cfe4f1] text-sm font-bold text-[#52748c] hover:bg-[#f5fbff]">বাতিল</button><button type="button" onClick={onConfirm} className="h-11 rounded-xl bg-[#e95b87] text-sm font-bold text-white hover:bg-[#d94372]">মুছে ফেলুন</button></div></div></div>; }
