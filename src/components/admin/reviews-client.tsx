"use client";

import { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Star, Check, X, Search, Eye, MessageSquare, Clock3, CheckCircle2, ChevronLeft, ChevronRight, RotateCcw, Package, Loader2 } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { updateReviewStatus } from "@/server/actions/reviews";
import { toast } from "@/components/ui/toaster";

type Status = "pending" | "approved" | "rejected";
export interface AdminReviewRow {
  id: string; productName: string; customerName: string; customerEmail: string;
  rating: number; comment: string; date: string; status: Status;
}
const statuses: Record<Status, { label: string; style: string }> = {
  pending: { label: "অপেক্ষমাণ", style: "bg-[#fff2c8] text-[#906100]" },
  approved: { label: "অনুমোদিত", style: "bg-[#e1f6ec] text-[#26815c]" },
  rejected: { label: "বাতিল", style: "bg-[#ffe3ec] text-[#bd3b68]" },
};
const control = "h-11 rounded-xl border border-[#d8e8f2] bg-[#f8fcff] px-3 text-sm text-[#24445b] outline-none focus:border-[#238fda] focus:ring-4 focus:ring-[#238fda]/10";
const button = "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#238fda] disabled:cursor-wait disabled:opacity-50";
const pageSize = 8;
function Stars({ rating }: { rating: number }) {
  return <span className="inline-flex gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>{[1, 2, 3, 4, 5].map(star => <Star aria-hidden="true" key={star} className={cn("h-4 w-4", star <= rating ? "fill-[#f5bc46] text-[#f5bc46]" : "text-[#d6e3eb]")} />)}</span>;
}
function Badge({ status }: { status: Status }) {
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", statuses[status].style)}><span className="h-1.5 w-1.5 rounded-full bg-current" />{statuses[status].label}</span>;
}

export function AdminReviewsClient({ initial }: { initial: AdminReviewRow[] }) {
  const [reviews, setReviews] = useState(initial);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Status | "all">("all");
  const [rating, setRating] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [viewId, setViewId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string[]>([]);
  const inFlight = useRef(new Set<string>());
  const detailTrigger = useRef<HTMLButtonElement | null>(null);
  const viewReview = reviews.find(review => review.id === viewId);
  const counts = {
    all: reviews.length,
    pending: reviews.filter(review => review.status === "pending").length,
    approved: reviews.filter(review => review.status === "approved").length,
    rejected: reviews.filter(review => review.status === "rejected").length,
  };
  const approved = reviews.filter(review => review.status === "approved");
  const average = approved.length ? (approved.reduce((sum, review) => sum + review.rating, 0) / approved.length).toFixed(1) : "—";
  const query = search.trim().toLowerCase();
  const filtered = reviews.filter(review =>
    `${review.customerName} ${review.customerEmail} ${review.productName} ${review.comment}`.toLowerCase().includes(query)
    && (filter === "all" || review.status === filter)
    && (rating === "all" || review.rating === Number(rating))
  ).sort((a, b) => sort === "highest" ? b.rating - a.rating : sort === "lowest" ? a.rating - b.rating : (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0));
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const reset = () => { setSearch(""); setFilter("all"); setRating("all"); setSort("newest"); setPage(1); };
  const updateStatus = async (id: string, status: Status) => {
    if (inFlight.current.has(id)) return;
    inFlight.current.add(id);
    setSaving(previous => [...previous, id]);
    try {
      const result = await updateReviewStatus(id, status);
      if (!result.ok) throw new Error("Review update failed");
      setReviews(previous => previous.map(review => review.id === id ? { ...review, status } : review));
      toast.success(status === "approved" ? "রিভিউ অনুমোদন করা হয়েছে" : "রিভিউ বাতিল করা হয়েছে");
    } catch {
      toast.error("রিভিউ আপডেট করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      inFlight.current.delete(id);
      setSaving(previous => previous.filter(value => value !== id));
    }
  };
  const actions = (review: AdminReviewRow) => <>
    {saving.includes(review.id) && <Loader2 aria-label="Saving review" className="h-4 w-4 animate-spin text-[#238fda]" />}
    {review.status !== "approved" && <button type="button" disabled={saving.includes(review.id)} onClick={() => void updateStatus(review.id, "approved")} className={cn(button, "bg-[#e1f6ec] text-[#26815c] hover:bg-[#c9eddd]")}><Check className="h-3.5 w-3.5" />অনুমোদন</button>}
    {review.status !== "rejected" && <button type="button" disabled={saving.includes(review.id)} onClick={() => void updateStatus(review.id, "rejected")} className={cn(button, "bg-[#fff0f5] text-[#bd3b68] hover:bg-[#ffe3ec]")}><X className="h-3.5 w-3.5" />বাতিল</button>}
  </>;

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-8 text-[#24445b]">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#238fda] px-6 py-7 text-white shadow-[0_16px_38px_rgba(35,143,218,.2)] sm:px-8">
        <div aria-hidden="true" className="absolute -right-10 -top-10 h-44 w-44 rounded-full border-[22px] border-white/10" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#ffe67e]">Customer feedback</p><h1 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">কাস্টমার রিভিউ</h1><p className="mt-2 text-sm leading-relaxed text-white/85">ক্রেতাদের অভিজ্ঞতা জানুন, রিভিউ দেখুন ও অনুমোদন করুন।</p></div>
          <button type="button" onClick={() => { setFilter("pending"); setSearch(""); setRating("all"); setPage(1); }} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#f06a9f] px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#db4e87] focus-visible:outline-2 focus-visible:outline-offset-4"><Clock3 className="h-4 w-4" />অপেক্ষমাণ রিভিউ ({counts.pending})</button>
        </div>
      </section>

      <section aria-label="Review summary" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "মোট রিভিউ", value: counts.all, note: "সব ক্রেতার মতামত", Icon: MessageSquare, color: "bg-[#e2f4ff] text-[#2178b3]" },
          { label: "অপেক্ষমাণ", value: counts.pending, note: "অনুমোদনের অপেক্ষায়", Icon: Clock3, color: "bg-[#fff2c8] text-[#906100]" },
          { label: "অনুমোদিত", value: counts.approved, note: "প্রকাশিত রিভিউ", Icon: CheckCircle2, color: "bg-[#e1f6ec] text-[#26815c]" },
          { label: "গড় রেটিং", value: average, note: "অনুমোদিত রিভিউ থেকে", Icon: Star, color: "bg-[#ffe3ec] text-[#bd3b68]" },
        ].map(({ label, value, note, Icon, color }) => <article key={label} className={cn("rounded-2xl p-4 sm:p-5", color)}><div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold sm:text-sm">{label}</p><Icon className="h-4 w-4 shrink-0 opacity-75" /></div><p className="mt-3 text-3xl font-bold">{value}</p><p className="mt-1 text-[11px] opacity-80">{note}</p></article>)}
      </section>

      <section className="overflow-hidden rounded-3xl border border-[#d8edf9] bg-white shadow-[0_8px_22px_rgba(46,128,179,.06)]">
        <div className="space-y-4 border-b border-[#e7f1f7] p-4 sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-[#87a0b3]" /><input aria-label="Search reviews" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="ক্রেতা, পণ্য বা রিভিউ খুঁজুন…" className={cn(control, "w-full pl-10")} /></div>
            <div className="grid grid-cols-2 gap-3"><select aria-label="Filter by rating" value={rating} onChange={event => { setRating(event.target.value); setPage(1); }} className={cn(control, "min-w-0")}><option value="all">সব রেটিং</option>{[5, 4, 3, 2, 1].map(value => <option key={value} value={value}>{value} স্টার</option>)}</select><select aria-label="Sort reviews" value={sort} onChange={event => { setSort(event.target.value); setPage(1); }} className={cn(control, "min-w-0")}><option value="newest">নতুন আগে</option><option value="highest">বেশি রেটিং আগে</option><option value="lowest">কম রেটিং আগে</option></select></div>
          </div>
          <div className="flex flex-wrap items-center gap-2">{(["all", "pending", "approved", "rejected"] as const).map(status => <button key={status} type="button" aria-pressed={filter === status} onClick={() => { setFilter(status); setPage(1); }} className={cn(button, filter === status ? "bg-[#238fda] text-white" : "bg-[#f2f8fc] text-[#688499] hover:bg-[#e2f4ff]")}>{status === "all" ? "সব রিভিউ" : statuses[status].label}<span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[10px]">{counts[status]}</span></button>)}{(query || filter !== "all" || rating !== "all" || sort !== "newest") && <button type="button" onClick={reset} className={cn(button, "text-[#238fda]")}><RotateCcw className="h-3.5 w-3.5" />রিসেট</button>}</div>
        </div>

        <div className="space-y-3 p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-sm font-bold">রিভিউ তালিকা</h2><p aria-live="polite" className="text-xs text-[#7892a5]">{filtered.length}টি রিভিউ</p></div>
          {visible.map(review => <article key={review.id} className="rounded-2xl border border-[#e0edf5] p-4 transition-colors hover:border-[#b6d9ef] sm:p-5">
            <div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e2f4ff] text-sm font-bold text-[#238fda]">{review.customerName.trim().slice(0, 1).toUpperCase() || "?"}</div><div className="min-w-0 flex-1"><h3 className="break-words text-sm font-bold">{review.customerName || "ক্রেতা"}</h3><p className="mt-1 text-xs text-[#7892a5]">{formatDate(review.date)}</p></div><Badge status={review.status} /></div>
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2"><Stars rating={review.rating} /><span className="text-xs font-semibold text-[#7892a5]">{review.rating}/5</span></div>
            <p className="mt-3 line-clamp-3 break-words text-sm leading-7 text-[#526f84]">{review.comment || "কোনো মন্তব্য নেই।"}</p>
            <div className="mt-4 flex flex-col gap-3 border-t border-[#edf4f8] pt-3 lg:flex-row lg:items-center lg:justify-between"><p className="flex min-w-0 items-start gap-2 text-xs font-medium text-[#688499]"><Package className="h-4 w-4 shrink-0 text-[#8caec4]" /><span className="break-words">{review.productName || "পণ্য"}</span></p><div className="flex shrink-0 flex-wrap items-center gap-2"><button type="button" onClick={event => { detailTrigger.current = event.currentTarget; setViewId(review.id); }} className={cn(button, "bg-[#edf7ff] text-[#238fda] hover:bg-[#dcefff]")}><Eye className="h-3.5 w-3.5" />বিস্তারিত</button>{actions(review)}</div></div>
          </article>)}
          {!visible.length && <div className="rounded-2xl border border-dashed border-[#d8e8f2] bg-[#f8fcff] px-5 py-14 text-center"><MessageSquare className="mx-auto mb-4 h-10 w-10 text-[#9cc8e5]" /><h3 className="font-bold">{reviews.length ? "কোনো রিভিউ পাওয়া যায়নি" : "এখনও কোনো রিভিউ নেই"}</h3><p className="mt-2 text-sm text-[#7892a5]">{reviews.length ? "অন্য শব্দ বা ফিল্টার দিয়ে আবার খুঁজুন।" : "ক্রেতারা রিভিউ দিলে এখানে দেখা যাবে।"}</p>{reviews.length > 0 && <button type="button" onClick={reset} className={cn(button, "mt-4 bg-[#e2f4ff] text-[#238fda]")}>সব রিভিউ দেখুন</button>}</div>}
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e7f1f7] px-4 py-4 sm:px-6"><p className="text-xs text-[#7892a5]">{filtered.length ? `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filtered.length)} / ${filtered.length}টি রিভিউ` : "০টি রিভিউ"}</p><div className="flex items-center gap-3"><button type="button" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className={cn(button, "bg-[#f2f8fc] disabled:cursor-default disabled:opacity-35")}><ChevronLeft className="h-4 w-4" /></button><span className="text-xs text-[#688499]">{currentPage} / {pages}</span><button type="button" aria-label="Next page" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)} className={cn(button, "bg-[#f2f8fc] disabled:cursor-default disabled:opacity-35")}><ChevronRight className="h-4 w-4" /></button></div></footer>
      </section>

      <Dialog.Root open={!!viewReview} onOpenChange={open => { if (!open) setViewId(null); }}>
        <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#173b58]/45 backdrop-blur-sm" /><Dialog.Content onCloseAutoFocus={event => { event.preventDefault(); detailTrigger.current?.focus(); }} className="fixed left-1/2 top-1/2 z-50 max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-white p-6 text-[#24445b] shadow-2xl focus:outline-none sm:p-8">
          <Dialog.Title className="pr-8 text-xl font-bold">রিভিউ বিস্তারিত</Dialog.Title><Dialog.Description className="mt-1 text-sm text-[#7892a5]">ক্রেতার সম্পূর্ণ মতামত ও অনুমোদনের অবস্থা।</Dialog.Description><Dialog.Close aria-label="Close review details" className="absolute right-4 top-4 rounded-xl p-2 text-[#7892a5] hover:bg-[#edf7ff]"><X className="h-5 w-5" /></Dialog.Close>
          {viewReview && <div className="mt-6 space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><Stars rating={viewReview.rating} /><Badge status={viewReview.status} /></div><div><p className="break-words font-bold">{viewReview.customerName || "ক্রেতা"}</p>{viewReview.customerEmail && <p className="mt-1 break-words text-sm text-[#7892a5]">{viewReview.customerEmail}</p>}<p className="mt-1 text-xs text-[#7892a5]">{formatDate(viewReview.date)}</p></div><p className="flex items-start gap-2 break-words text-sm"><Package className="h-4 w-4 shrink-0 text-[#238fda]" />{viewReview.productName}</p><div className="whitespace-pre-wrap break-words rounded-2xl bg-[#f2f9fd] p-5 text-sm leading-7 text-[#526f84]">{viewReview.comment || "কোনো মন্তব্য নেই।"}</div><div className="flex flex-wrap items-center gap-2 border-t border-[#e7f1f7] pt-4">{actions(viewReview)}</div></div>}
        </Dialog.Content></Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
