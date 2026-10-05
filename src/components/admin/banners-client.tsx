"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Edit2, ImageIcon, Loader2, Plus, Sparkles, Trash2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";
import { createBanner, deleteBanner as deleteBannerAction, toggleBanner, updateBanner } from "@/server/actions/banners";

type Position = "hero" | "homepage-mid" | "category" | "sidebar" | "popup";
export interface AdminBannerRow {
  id: string; title: string; subtitle: string; image: string;
  link: string; position: Position; active: boolean; order: number;
}
type FormState = Omit<AdminBannerRow, "id" | "order"> & { order: string };

const BANNER_WIDTH = 2014;
const BANNER_HEIGHT = 781;
const BANNER_RATIO = BANNER_WIDTH / BANNER_HEIGHT;
const RATIO_TOLERANCE = 0.005;
const POSITIONS: { value: Position; label: string }[] = [
  { value: "hero", label: "Homepage hero" },
  { value: "homepage-mid", label: "Homepage middle" },
  { value: "category", label: "Category" },
  { value: "sidebar", label: "Sidebar" },
  { value: "popup", label: "Popup" },
];
const EMPTY_FORM: FormState = {
  title: "", subtitle: "", image: "", link: "/new-arrivals",
  position: "hero", active: true, order: "1",
};

async function getImageDimensions(file: File) {
  const objectUrl = URL.createObjectURL(file);
  try {
    return await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error("This image could not be read."));
      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function AdminBannersClient({ initial }: { initial: AdminBannerRow[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [banners, setBanners] = useState(initial);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));
  const closeModal = () => { if (!uploading && !saving) setShowModal(false); };
  const openAdd = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM, order: String(banners.length + 1) });
    setShowModal(true);
  };
  const openEdit = (banner: AdminBannerRow) => {
    setEditId(banner.id);
    setForm({ title: banner.title, subtitle: banner.subtitle, image: banner.image, link: banner.link, position: banner.position, active: banner.active, order: String(banner.order) });
    setShowModal(true);
  };

  const uploadImage = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file.");
    if (file.size > 10 * 1024 * 1024) return toast.error("Banner images must be no larger than 10 MB.");
    setUploading(true);
    try {
      const { width, height } = await getImageDimensions(file);
      const difference = Math.abs(width / height - BANNER_RATIO) / BANNER_RATIO;
      if (difference > RATIO_TOLERANCE) throw new Error(`Wrong ratio (${width}×${height}). Use the fixed ${BANNER_WIDTH}:${BANNER_HEIGHT} banner ratio.`);
      const body = new FormData();
      body.set("file", file);
      body.set("purpose", "banner");
      const response = await fetch("/api/admin/uploads", { method: "POST", body });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error ?? "Image upload failed.");
      setField("image", result.url);
      toast.success("Banner image uploaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.image) return toast.error("Upload a banner image first.");
    setSaving(true);
    const input = { title: form.title, subtitle: form.subtitle, image: form.image, link: form.link, position: form.position, isActive: form.active, displayOrder: Number(form.order) };
    try {
      if (editId) await updateBanner(editId, input);
      else await createBanner(input);
      setShowModal(false);
      toast.success(editId ? "Banner updated." : "Banner added.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Banner could not be saved.");
    } finally { setSaving(false); }
  };

  const toggleActive = async (id: string, next: boolean) => {
    setBanners((current) => current.map((banner) => banner.id === id ? { ...banner, active: next } : banner));
    try { await toggleBanner(id, next); }
    catch (error) {
      setBanners((current) => current.map((banner) => banner.id === id ? { ...banner, active: !next } : banner));
      toast.error(error instanceof Error ? error.message : "Banner status could not be changed.");
    }
  };

  const deleteBanner = async () => {
    if (!deleteId) return;
    const id = deleteId;
    try {
      await deleteBannerAction(id);
      setBanners((current) => current.filter((banner) => banner.id !== id));
      setDeleteId(null);
      toast.success("Banner deleted.");
      router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Banner could not be deleted."); }
  };

  const positionColors: Record<Position, string> = {
    hero: "bg-[#ffe4ef] text-[#a72e62]", "homepage-mid": "bg-[#dff3ff] text-[#176799]",
    category: "bg-[#e4f6eb] text-[#2c773d]", sidebar: "bg-[#fff0bd] text-[#875a00]", popup: "bg-[#eee7ff] text-[#66459e]",
  };

  return (
    <div className="rounded-[2rem] bg-[#f6fbff] p-4 text-[#234963] sm:p-6">
      <div className="mb-6 overflow-hidden rounded-[1.75rem] bg-[#248fd6] p-5 text-white shadow-[0_16px_36px_rgba(36,143,214,.2)] sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff1a8] text-[#2187d5] shadow-sm"><ImageIcon className="h-6 w-6" /></span>
            <div><p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.18em] text-[#fff1a8]"><Sparkles className="h-3.5 w-3.5" /> Storefront design</p><h1 className="mt-1 font-serif text-2xl font-bold sm:text-3xl">Website banners</h1><p className="mt-1 text-sm text-white/75">{banners.length} banners · {banners.filter((banner) => banner.active).length} active</p></div>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 rounded-xl bg-[#ff6da8] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_18px_rgba(139,40,91,.2)] transition hover:-translate-y-0.5 hover:bg-[#ef5394]"><Plus className="h-4 w-4" /> Add banner</button>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#f3dda1] bg-[#fff7d9] px-4 py-3 text-sm text-[#79580b]">
        <span className="font-semibold">Every banner keeps the same storefront shape.</span><span className="rounded-full bg-white px-3 py-1 text-xs font-bold shadow-sm">Fixed ratio · {BANNER_WIDTH}:{BANNER_HEIGHT}</span>
      </div>

      {banners.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-[#b8e1ff] bg-white p-12 text-center shadow-[0_8px_24px_rgba(46,128,179,.06)]">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#e4f5ff] text-[#248fd6]"><ImageIcon className="h-8 w-8" /></span><p className="mt-4 text-lg font-bold text-[#175a9f]">No banners yet</p><p className="mt-1 text-sm text-[#6b8497]">Upload the first banner to make the homepage dynamic.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {banners.map((banner) => (
            <div key={banner.id} className="group flex flex-wrap items-center gap-4 rounded-3xl border border-[#d8edf9] bg-white p-4 shadow-[0_8px_24px_rgba(46,128,179,.07)] transition hover:-translate-y-0.5 hover:border-[#b8e1ff] hover:shadow-[0_14px_30px_rgba(46,128,179,.12)] sm:p-5">
              <div className="aspect-[2014/781] w-36 flex-shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-[#eaf7ff] shadow-md sm:w-48">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={banner.image} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1"><div className="mb-1 flex flex-wrap items-center gap-2"><p className="font-bold text-[#234963]">{banner.title}</p><span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold", positionColors[banner.position])}>{POSITIONS.find((item) => item.value === banner.position)?.label ?? banner.position}</span><span className="rounded-full bg-[#f1f7fb] px-2.5 py-1 text-[10px] font-bold text-[#718da1]">Order {banner.order}</span></div><p className="line-clamp-1 text-sm text-[#6b8497]">{banner.subtitle}</p><p className="mt-1 truncate font-mono text-xs font-semibold text-[#e8548b]">{banner.link}</p></div>
              <div className="flex items-center gap-3">
                <button aria-label={banner.active ? "Deactivate banner" : "Activate banner"} onClick={() => void toggleActive(banner.id, !banner.active)} className={cn("relative h-6 w-11 rounded-full transition-colors", banner.active ? "bg-[#65b96b]" : "bg-[#dce9f0]")}><span className={cn("absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", banner.active && "translate-x-5")} /></button>
                <button aria-label="Edit banner" onClick={() => openEdit(banner)} className="rounded-xl bg-[#e4f5ff] p-2.5 text-[#248fd6] transition hover:bg-[#ccecff]"><Edit2 className="h-4 w-4" /></button>
                <button aria-label="Delete banner" onClick={() => setDeleteId(banner.id)} className="rounded-xl bg-[#fff0f3] p-2.5 text-[#e8548b] transition hover:bg-[#ffe0e8]"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
          <button aria-label="Close" className="absolute inset-0 bg-[#173f5c]/65 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative my-auto w-full max-w-xl overflow-hidden rounded-[1.75rem] border-4 border-white bg-[#fffdf8] text-[#234963] shadow-[0_24px_70px_rgba(23,90,159,.25)]">
            <div className="flex items-center justify-between bg-[#248fd6] p-5 text-white"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#fff1a8]">Storefront banner</p><h3 className="mt-1 font-serif text-xl font-bold">{editId ? "Edit banner" : "Add a new banner"}</h3><p className="mt-1 text-xs text-white/70">Required image ratio: {BANNER_WIDTH}:{BANNER_HEIGHT}</p></div><button onClick={closeModal} className="rounded-xl bg-white/15 p-2.5 transition hover:bg-white/25"><X className="h-4 w-4" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <div>
                <label className="lbl">Banner image *</label>
                <button type="button" onClick={() => fileInputRef.current?.click()} onDragEnter={() => setIsDragging(true)} onDragLeave={() => setIsDragging(false)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); setIsDragging(false); void uploadImage(event.dataTransfer.files[0]); }} className={cn("relative block aspect-[2014/781] w-full overflow-hidden rounded-2xl border-2 border-dashed transition-colors", isDragging ? "border-[#ff6da8] bg-[#ffe4ef]" : "border-[#b8e1ff] bg-[#eaf7ff] hover:border-[#248fd6]")}>
                  {form.image ? <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.image} alt="Banner preview" className="h-full w-full object-cover" />
                  </> : <span className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-[#56708d]"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#248fd6] shadow-sm"><Upload className="h-5 w-5" /></span><span className="text-sm font-bold text-[#234963]">Click or drop an image here</span><span className="text-xs">{BANNER_WIDTH}×{BANNER_HEIGHT}px recommended · max 10 MB</span></span>}
                  {uploading && <span className="absolute inset-0 flex items-center justify-center gap-2 bg-[#175a9f]/75 text-sm font-semibold text-white"><Loader2 className="h-5 w-5 animate-spin" /> Uploading...</span>}
                </button>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="hidden" onChange={(event) => void uploadImage(event.target.files?.[0])} />
                {form.image && <div className="mt-2 flex justify-end"><button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs font-bold text-[#e8548b] hover:underline">Replace image</button></div>}
              </div>
              <div><label className="lbl">Title *</label><input value={form.title} onChange={(event) => setField("title", event.target.value)} required placeholder="New collection" className="inp" /></div>
              <div><label className="lbl">Subtitle</label><input value={form.subtitle} onChange={(event) => setField("subtitle", event.target.value)} placeholder="Short tagline" className="inp" /></div>
              <div><label className="lbl">Link URL *</label><input value={form.link} onChange={(event) => setField("link", event.target.value)} required placeholder="/new-arrivals" className="inp" /></div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label className="lbl">Position *</label><select value={form.position} onChange={(event) => setField("position", event.target.value as Position)} className="inp bg-white">{POSITIONS.map((position) => <option key={position.value} value={position.value}>{position.label}</option>)}</select></div><div><label className="lbl">Display order</label><input type="number" value={form.order} onChange={(event) => setField("order", event.target.value)} min={1} required className="inp" /></div></div>
              <label className="flex items-center gap-3 rounded-xl bg-[#f1f9fd] px-3 py-2.5"><button type="button" onClick={() => setField("active", !form.active)} className={cn("relative h-6 w-11 rounded-full transition-colors", form.active ? "bg-[#65b96b]" : "bg-[#dce9f0]")}><span className={cn("absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", form.active && "translate-x-5")} /></button><span className="text-sm font-semibold text-[#45657c]">{form.active ? "Active on website" : "Hidden from website"}</span></label>
              <div className="flex gap-3 pt-2"><button type="button" onClick={closeModal} disabled={uploading || saving} className="h-11 flex-1 rounded-xl border border-[#c9e3f2] bg-white text-sm font-bold text-[#56708d] transition hover:bg-[#f4faff] disabled:opacity-50">Cancel</button><button type="submit" disabled={uploading || saving || !form.image} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#ff6da8] text-sm font-bold text-white shadow-[0_7px_16px_rgba(255,109,168,.22)] transition hover:bg-[#ef5394] disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{saving ? "Saving..." : editId ? "Save banner" : "Add banner"}</button></div>
            </form>
          </div>
        </div>
      )}

      {deleteId && <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><button aria-label="Close" className="absolute inset-0 bg-[#173f5c]/65 backdrop-blur-sm" onClick={() => setDeleteId(null)} /><div className="relative w-full max-w-sm rounded-3xl border-4 border-white bg-[#fffdf8] p-6 text-center text-[#234963] shadow-[0_24px_70px_rgba(23,90,159,.25)]"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#fff0f3] text-[#e8548b]"><Trash2 className="h-6 w-6" /></span><h3 className="mb-2 mt-4 font-serif text-xl font-bold text-[#175a9f]">Delete banner?</h3><p className="mb-5 text-sm text-[#6b8497]">This banner will be removed from the website.</p><div className="flex gap-3"><button onClick={() => setDeleteId(null)} className="h-11 flex-1 rounded-xl border border-[#c9e3f2] bg-white text-sm font-bold text-[#56708d]">Cancel</button><button onClick={() => void deleteBanner()} className="h-11 flex-1 rounded-xl bg-[#e8548b] text-sm font-bold text-white hover:bg-[#d9437b]">Delete</button></div></div></div>}
      <style jsx>{`.inp{width:100%;height:2.75rem;padding:0 .8rem;border-radius:.75rem;border:1px solid #c9e3f2;background-color:#fff;font-size:.875rem;color:#234963;outline:none;transition:border-color .2s,box-shadow .2s}.inp:focus{border-color:#248fd6;box-shadow:0 0 0 3px rgba(36,143,214,.1)}.lbl{display:block;font-size:.625rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#718da1;margin-bottom:.4rem}`}</style>
    </div>
  );
}
