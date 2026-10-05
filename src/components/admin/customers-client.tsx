"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Search, Eye, Star, X, Users, UserCheck, ShoppingBag, Wallet, FileSpreadsheet, ImageIcon, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { cn, formatPrice, formatDate } from "@/lib/utils";
import { createCustomersSvg } from "@/lib/customers-svg";

export interface AdminCustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  orders: number;
  totalSpent: number;
  loyaltyPoints: number;
  joinedAt: string;
  lastOrder: string;
  status: "active" | "inactive";
}

const control = "h-11 rounded-xl border border-sky-100 bg-white px-3 text-sm text-[#23557d] outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100";
const initials = (name: string) => name.trim().split(/\s+/).map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
const pageSize = 10;

export function AdminCustomersClient({ customers }: { customers: AdminCustomerRow[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [viewCustomer, setViewCustomer] = useState<AdminCustomerRow | null>(null);
  const [exportScope, setExportScope] = useState("filtered");
  const [notice, setNotice] = useState("");
  const [exporting, setExporting] = useState<"xlsx" | "svg" | null>(null);
  const filtered = customers.filter(c => {
    const query = search.trim().toLowerCase();
    return `${c.name} ${c.email} ${c.phone} ${c.city}`.toLowerCase().includes(query) && (status === "all" || status === c.status);
  }).sort((a, b) => sort === "spent" ? b.totalSpent - a.totalSpent : sort === "orders" ? b.orders - a.orders : sort === "name" ? a.name.localeCompare(b.name) : (Date.parse(b.joinedAt) || 0) - (Date.parse(a.joinedAt) || 0));
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const activeCount = customers.filter(c => c.status === "active").length;
  const totalOrders = customers.reduce((sum, c) => sum + c.orders, 0);
  const exportRows = exportScope === "all" ? customers : filtered;

  const saveDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const downloadSvg = () => {
    setExporting("svg");
    setNotice("");
    try {
      const blob = new Blob([createCustomersSvg(exportRows)], { type: "image/svg+xml;charset=utf-8" });
      saveDownload(blob, `customers-${exportScope}-${new Date().toISOString().slice(0, 10)}.svg`);
      setNotice(`SVG download started for ${exportRows.length} customers.`);
    } catch { setNotice("Could not create the export. Please try again."); }
    finally { setExporting(null); }
  };

  const downloadExcel = async () => {
    setExporting("xlsx");
    setNotice("");
    try {
      const { createCustomersWorkbook } = await import("@/lib/customers-workbook");
      const bytes = createCustomersWorkbook(exportRows);
      const blob = new Blob([new Uint8Array(bytes)], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveDownload(blob, `customers-${exportScope}-${new Date().toISOString().slice(0, 10)}.xlsx`);
      setNotice(`Excel download started for ${exportRows.length} customers.`);
    } catch { setNotice("Could not create the Excel export. Please try again."); }
    finally { setExporting(null); }
  };

  return <div className="mx-auto max-w-7xl space-y-6 text-[#23557d]">
    <header className="flex flex-wrap items-start justify-between gap-5">
      <div><p className="mb-1 text-xs font-bold uppercase tracking-[.2em] text-[#ee77a1]">Your community</p><h1 className="text-2xl font-bold sm:text-3xl">Customers</h1><p className="mt-2 text-sm text-slate-500">Get to know the people behind every order.</p></div>
      <div className="flex flex-wrap gap-2">
        <select aria-label="Export customers" className={control} value={exportScope} onChange={e => setExportScope(e.target.value)}><option value="filtered">Filtered customers ({filtered.length})</option><option value="all">All customers ({customers.length})</option></select>
        <button onClick={() => void downloadExcel()} disabled={!exportRows.length || Boolean(exporting)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#ee77a1] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#dc5e8c] disabled:cursor-not-allowed disabled:opacity-50"><FileSpreadsheet size={17} /> {exporting === "xlsx" ? "Preparing…" : "Download Excel"}</button>
        <button onClick={downloadSvg} disabled={!exportRows.length || Boolean(exporting)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#238dcc] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1b76ad] disabled:cursor-not-allowed disabled:opacity-50"><ImageIcon size={17} /> {exporting === "svg" ? "Preparing…" : "Download SVG"}</button>
      </div>
    </header>
    {notice && <p role="status" className="rounded-xl border border-sky-100 bg-white p-3 text-sm">{notice}</p>}
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[
      { label: "Total customers", value: customers.length.toLocaleString(), icon: Users, color: "bg-sky-50 text-sky-600", detail: "Your growing community" },
      { label: "Active customers", value: activeCount.toLocaleString(), icon: UserCheck, color: "bg-emerald-50 text-emerald-600", detail: `${customers.length ? Math.round(activeCount / customers.length * 100) : 0}% of all customers` },
      { label: "Lifetime spending", value: formatPrice(totalRevenue), icon: Wallet, color: "bg-pink-50 text-pink-500", detail: "Across all customers" },
      { label: "Average order value", value: formatPrice(totalOrders ? Math.round(totalRevenue / totalOrders) : 0), icon: ShoppingBag, color: "bg-violet-50 text-violet-500", detail: `${totalOrders.toLocaleString()} total orders` },
    ].map(stat => <div key={stat.label} className="min-w-0 rounded-2xl border border-sky-100 bg-white p-4 shadow-sm sm:p-5"><div className={cn("mb-4 inline-flex rounded-xl p-2.5", stat.color)}><stat.icon size={20} /></div><p className="text-xs font-medium text-slate-500">{stat.label}</p><p className="mt-1 break-words text-xl font-bold sm:text-2xl">{stat.value}</p><p className="mt-2 text-xs text-slate-400">{stat.detail}</p></div>)}</div>
    <section className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-sky-50 p-5"><div><h2 className="font-bold">Customer directory <span className="ml-2 rounded-full bg-sky-50 px-2.5 py-1 text-xs text-sky-600">{filtered.length}</span></h2><p className="mt-2 text-xs text-slate-500">Contact details, purchase history and loyalty at a glance.</p></div><span className="text-xs text-slate-400">Excel and SVG include every matching customer across all pages.</span></div>
      <div className="flex flex-wrap gap-3 p-5"><label className="relative min-w-0 basis-full sm:flex-1 sm:basis-auto"><Search size={17} className="absolute left-3.5 top-3 text-slate-400" /><input aria-label="Search customers" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search name, email, phone or city…" className={cn(control, "w-full pl-10")} /></label><div className="flex items-center gap-2"><SlidersHorizontal size={16} className="text-slate-400" /><select aria-label="Filter by status" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className={control}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div><select aria-label="Sort customers" value={sort} onChange={e => { setSort(e.target.value); setPage(1); }} className={control}><option value="newest">Newest first</option><option value="name">Name A–Z</option><option value="spent">Highest spending</option><option value="orders">Most orders</option></select></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[960px] text-left text-sm"><thead className="bg-[#f5faff] text-[11px] uppercase tracking-wider text-[#7895aa]"><tr>{["Customer", "City", "Orders", "Total spent", "Loyalty", "Last order", "Status", ""].map((heading, i) => <th key={i} scope="col" className="px-5 py-3.5 font-semibold">{heading || <span className="sr-only">View profile</span>}</th>)}</tr></thead><tbody className="divide-y divide-sky-50">{visible.map((c, index) => <tr key={c.id} className="transition hover:bg-sky-50/50"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold", index % 2 ? "bg-pink-50 text-pink-500" : "bg-sky-50 text-sky-600")}>{initials(c.name)}</span><div className="max-w-64"><p className="truncate font-semibold" title={c.name}>{c.name || "Unnamed customer"}</p><p className="mt-1 truncate text-xs text-slate-500" title={c.email}>{c.email || "No email"}</p><p className="mt-1 text-xs text-slate-400">{c.phone || "No phone"}</p></div></div></td><td className="px-5 py-4 text-xs text-slate-500">{c.city || "—"}</td><td className="px-5 py-4 font-semibold">{c.orders}</td><td className="whitespace-nowrap px-5 py-4 font-semibold">{formatPrice(c.totalSpent)}</td><td className="px-5 py-4"><span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-600"><Star size={12} /> {c.loyaltyPoints}</span></td><td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{formatDate(c.lastOrder)}</td><td className="px-5 py-4"><span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs capitalize", c.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}><span className="h-1.5 w-1.5 rounded-full bg-current" />{c.status}</span></td><td className="px-4 py-4"><button aria-label={`View ${c.name || "customer"} profile`} onClick={() => setViewCustomer(c)} className="rounded-lg p-2 text-sky-600 hover:bg-sky-100 focus-visible:outline-2 focus-visible:outline-sky-400"><Eye size={17} /></button></td></tr>)}</tbody></table></div>
      {!filtered.length && <div className="px-5 py-14 text-center"><Users size={36} className="mx-auto mb-4 text-sky-200" /><h3 className="font-semibold">{customers.length ? "No matching customers" : "Your community starts here"}</h3><p className="mt-2 text-sm text-slate-500">{customers.length ? "Try another search or clear your filters." : "Customer profiles will appear here when they join your store."}</p>{customers.length > 0 && <button onClick={() => { setSearch(""); setStatus("all"); setPage(1); }} className="mt-4 text-sm font-semibold text-sky-600">Clear filters</button>}</div>}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-sky-100 px-5 py-4"><p className="text-xs text-slate-500">Showing {filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} customers</p><div className="flex items-center gap-3"><button aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="rounded-lg border border-sky-100 p-2 hover:bg-sky-50 disabled:opacity-30"><ChevronLeft size={16} /></button><span className="text-xs text-slate-500">Page {currentPage} of {pages}</span><button aria-label="Next page" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)} className="rounded-lg border border-sky-100 p-2 hover:bg-sky-50 disabled:opacity-30"><ChevronRight size={16} /></button></div></footer>
    </section>
    <Dialog.Root open={Boolean(viewCustomer)} onOpenChange={open => { if (!open) setViewCustomer(null); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#16354c]/40 backdrop-blur-sm" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 text-[#23557d] shadow-xl"><Dialog.Title className="text-lg font-bold">Customer profile</Dialog.Title><Dialog.Description className="mt-1 text-xs text-slate-500">Contact information and lifetime activity.</Dialog.Description><Dialog.Close aria-label="Close customer profile" className="absolute right-4 top-4 rounded-lg p-2 hover:bg-sky-50"><X size={18} /></Dialog.Close>{viewCustomer && <><div className="my-6 flex items-center gap-4"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-lg font-bold text-sky-600">{initials(viewCustomer.name)}</span><div className="min-w-0"><h3 className="break-words font-bold">{viewCustomer.name || "Unnamed customer"}</h3><p className="mt-1 break-all text-sm text-slate-500">{viewCustomer.email || "No email"}</p><p className="mt-1 text-sm text-slate-500">{viewCustomer.phone || "No phone"}</p></div></div><div className="grid grid-cols-2 gap-3">{[
      { label: "City", value: viewCustomer.city || "—" }, { label: "Status", value: viewCustomer.status },
      { label: "Joined", value: formatDate(viewCustomer.joinedAt) }, { label: "Last order", value: formatDate(viewCustomer.lastOrder) },
      { label: "Orders", value: viewCustomer.orders }, { label: "Total spent", value: formatPrice(viewCustomer.totalSpent) },
      { label: "Loyalty points", value: viewCustomer.loyaltyPoints },
    ].map(item => <div key={item.label} className="rounded-xl bg-sky-50/70 p-3"><p className="text-xs text-slate-500">{item.label}</p><p className="mt-1 break-words text-sm font-semibold capitalize">{item.value}</p></div>)}</div></>}</Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>;
}
