"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Edit2, FolderOpen, ImageIcon, Layers3, Loader2, Package, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { createCategory, deleteCategory as deleteCategoryAction, updateCategory as updateCategoryAction } from "@/server/actions/categories";
import { toast } from "@/components/ui/toaster";
import { RichTextEditor, richTextToPlainText } from "@/components/ui/rich-text";
import type { Category } from "@/types";

type FormData = { name: string; slug: string; description: string; image: string };
const emptyForm: FormData = { name: "", slug: "", description: "", image: "" };
const CATEGORY_IMAGE_WIDTH = 1200;
const CATEGORY_IMAGE_HEIGHT = 900;
const cardColors = [
  "from-[#dff3ff] to-[#edf9ff] text-[#248fd6]",
  "from-[#ffe4ef] to-[#fff2f7] text-[#d94f86]",
  "from-[#fff0bd] to-[#fff8df] text-[#9a6b00]",
  "from-[#e4f6eb] to-[#f0fbf4] text-[#33815a]",
  "from-[#eee7ff] to-[#f7f3ff] text-[#7856b5]",
];
const inputClass = "h-11 w-full rounded-xl border border-[#d8e8f2] bg-[#f8fcff] px-3.5 text-sm text-[#24445b] outline-none placeholder:text-[#8a9eae] focus:border-[#238fda] focus:ring-4 focus:ring-[#238fda]/10 disabled:opacity-60";

function toSlug(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-");
}

async function imageDimensions(file: File) {
  const objectUrl = URL.createObjectURL(file);
  try {
    return await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error("ছবিটি পড়া যায়নি।"));
      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function AdminCategoriesClient({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const query = search.trim().toLowerCase();
  const filtered = categories.filter((category) =>
    `${category.name} ${category.slug} ${richTextToPlainText(category.description ?? "")}`.toLowerCase().includes(query),
  );
  const totalProducts = categories.reduce((sum, category) => sum + (category.productCount ?? 0), 0);
  const emptyCategories = categories.filter((category) => !category.productCount).length;
  const selectedForDelete = categories.find((category) => category.id === deleteId);

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (category: Category) => {
    setEditId(category.id);
    setForm({ name: category.name, slug: category.slug, description: category.description ?? "", image: category.image ?? "" });
    setShowModal(true);
  };

  const updateField = (key: keyof FormData, value: string) => {
    setForm((previous) => {
      const next = { ...previous, [key]: value };
      if (key === "name" && !editId) next.slug = toSlug(value);
      return next;
    });
  };

  const handleImageUpload = async (file?: File) => {
    if (!file || uploadingImage) return;
    if (!file.type.startsWith("image/")) return toast.error("একটি image file নির্বাচন করুন।");
    if (file.size > 10 * 1024 * 1024) return toast.error("ছবির size সর্বোচ্চ 10 MB হতে পারবে।");

    setUploadingImage(true);
    try {
      const dimensions = await imageDimensions(file);
      if (dimensions.width !== CATEGORY_IMAGE_WIDTH || dimensions.height !== CATEGORY_IMAGE_HEIGHT) {
        throw new Error(`ছবিটি ${dimensions.width}×${dimensions.height}px। Category image অবশ্যই ${CATEGORY_IMAGE_WIDTH}×${CATEGORY_IMAGE_HEIGHT}px হতে হবে।`);
      }

      const body = new FormData();
      body.set("file", file);
      body.set("purpose", "category");
      const response = await fetch("/api/admin/uploads", { method: "POST", body });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error ?? "Image upload failed.");
      updateField("image", result.url);
      toast.success("Category image upload হয়েছে।");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ছবি upload করা যায়নি।");
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving || uploadingImage) return;
    setSaving(true);
    const data = {
      name: form.name.trim(),
      slug: form.slug || toSlug(form.name),
      description: form.description,
      image: form.image.trim() || "/images/categories/default.jpg",
    };
    try {
      const result = editId ? await updateCategoryAction(editId, data) : await createCategory(data);
      if (!result.ok) throw new Error("Category save failed");
      setShowModal(false);
      toast.success(editId ? "Category updated." : "Category added.");
      router.refresh();
    } catch {
      toast.error("Could not save category. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId || deleting) return;
    setDeleting(true);
    try {
      const result = await deleteCategoryAction(deleteId);
      if (!result.ok) throw new Error("Category delete failed");
      setDeleteId(null);
      toast.success("Category deleted.");
      router.refresh();
    } catch {
      toast.error("Could not delete category. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-8 text-[#24445b]">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#238fda] px-6 py-7 text-white shadow-[0_16px_38px_rgba(35,143,218,.2)] sm:px-8">
        <div aria-hidden="true" className="absolute -right-10 -top-10 h-44 w-44 rounded-full border-[22px] border-white/10" />
        <div aria-hidden="true" className="absolute bottom-0 right-36 h-20 w-20 translate-y-1/2 rounded-full bg-[#ffe67e]/15" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#ffe67e]">Store organization</p><h1 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">ক্যাটাগরি</h1><p className="mt-2 max-w-xl text-sm leading-6 text-white/85">পণ্যগুলো সুন্দরভাবে সাজান, প্রতিটি collection-এর পরিচিতি ও ছবি নিয়ন্ত্রণ করুন।</p></div>
          <button type="button" onClick={openAdd} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#f06a9f] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_18px_rgba(116,42,83,.22)] transition hover:-translate-y-0.5 hover:bg-[#db4e87] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"><Plus className="h-4 w-4" /> নতুন ক্যাটাগরি</button>
        </div>
      </section>

      <section aria-label="Category summary" className="grid grid-cols-3 gap-3">
        <Metric icon={Layers3} label="মোট ক্যাটাগরি" value={categories.length} color="bg-[#e2f4ff] text-[#2178b3]" />
        <Metric icon={Package} label="মোট পণ্য" value={totalProducts} color="bg-[#e1f6ec] text-[#26815c]" />
        <Metric icon={FolderOpen} label="খালি ক্যাটাগরি" value={emptyCategories} color="bg-[#fff2c8] text-[#906100]" />
      </section>

      <section className="rounded-3xl border border-[#d8edf9] bg-white p-4 shadow-[0_8px_22px_rgba(46,128,179,.06)] sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative min-w-0 flex-1"><span className="sr-only">Search categories</span><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7c9bb0]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="নাম, slug বা description দিয়ে খুঁজুন" className="h-11 w-full rounded-xl border border-[#c9e3f3] bg-[#f8fcff] pl-10 pr-10 text-sm text-[#234963] outline-none placeholder:text-[#9bb0be] focus:border-[#248fd6] focus:ring-4 focus:ring-[#238fda]/10" />{search && <button type="button" aria-label="Clear search" onClick={() => setSearch("")} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-[#7895aa] hover:bg-[#e8f5fc]"><X className="h-4 w-4" /></button>}</label>
          <p className="shrink-0 text-xs font-medium text-[#7895aa]">{filtered.length} / {categories.length}টি দেখানো হচ্ছে</p>
        </div>
      </section>

      {filtered.length ? (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((category, index) => {
            const description = richTextToPlainText(category.description ?? "");
            const categoryImage = category.image && !category.image.endsWith("/default.jpg") ? category.image : "";
            return (
              <article key={category.id} className="group overflow-hidden rounded-3xl border border-[#d8edf9] bg-white shadow-[0_8px_22px_rgba(46,128,179,.06)] transition hover:-translate-y-0.5 hover:border-[#b9ddf2] hover:shadow-[0_14px_30px_rgba(46,128,179,.11)]">
                <div className={`relative h-28 overflow-hidden bg-gradient-to-br ${cardColors[index % cardColors.length]}`}>
                  {categoryImage && <div aria-hidden="true" className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-multiply" style={{ backgroundImage: `url(${categoryImage})` }} />}
                  <div aria-hidden="true" className="absolute -right-8 -top-8 h-28 w-28 rounded-full border-[16px] border-current opacity-10" />
                  <span className="absolute bottom-4 left-5 grid h-12 w-12 place-items-center rounded-2xl bg-white/90 shadow-sm"><FolderOpen className="h-6 w-6" /></span>
                  <span className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold shadow-sm">{category.productCount ?? 0} পণ্য</span>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate text-lg font-bold text-[#234963]">{category.name}</h2><p className="mt-1 truncate font-mono text-[11px] text-[#7b98ab]">/{category.slug}</p></div><div className="flex shrink-0 gap-1"><ActionButton label={`Edit ${category.name}`} onClick={() => openEdit(category)}><Edit2 className="h-4 w-4" /></ActionButton><ActionButton label={`Delete ${category.name}`} danger onClick={() => setDeleteId(category.id)}><Trash2 className="h-4 w-4" /></ActionButton></div></div>
                  <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-[#6d8799]">{description || "এই ক্যাটাগরির জন্য এখনও কোনো description যোগ করা হয়নি।"}</p>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="grid min-h-72 place-items-center rounded-3xl border border-dashed border-[#cfe5f2] bg-white px-5 text-center"><div><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#e9f6ff] text-[#248fd6]"><FolderOpen className="h-7 w-7" /></span><h2 className="mt-4 font-bold text-[#315a77]">{categories.length ? "কোনো ক্যাটাগরি পাওয়া যায়নি" : "প্রথম ক্যাটাগরি যোগ করুন"}</h2><p className="mt-2 text-sm text-[#7895aa]">{categories.length ? "অন্য নাম দিয়ে খুঁজুন।" : "পণ্য সাজাতে একটি collection তৈরি করুন।"}</p><button type="button" onClick={categories.length ? () => setSearch("") : openAdd} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#e2f4ff] px-4 text-sm font-bold text-[#238fda]">{categories.length ? <><X className="h-4 w-4" />Search clear করুন</> : <><Plus className="h-4 w-4" />ক্যাটাগরি যোগ করুন</>}</button></div></section>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[70] grid place-items-center p-4">
          <button type="button" aria-label="Close category form" disabled={saving || uploadingImage} onClick={() => setShowModal(false)} className="absolute inset-0 bg-[#163d5c]/45 backdrop-blur-sm" />
          <section role="dialog" aria-modal="true" aria-labelledby="category-dialog-title" className="relative max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white text-[#24445b] shadow-2xl [color-scheme:light]">
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e4eff6] bg-white/95 px-5 py-4 backdrop-blur sm:px-6"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#238fda]">Category details</p><h2 id="category-dialog-title" className="mt-1 text-xl font-bold">{editId ? "ক্যাটাগরি সম্পাদনা" : "নতুন ক্যাটাগরি"}</h2></div><button type="button" disabled={saving || uploadingImage} aria-label="Close" onClick={() => setShowModal(false)} className="grid h-10 w-10 place-items-center rounded-xl text-[#7895aa] transition hover:bg-[#edf7fc] hover:text-[#238fda]"><X className="h-5 w-5" /></button></header>
            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="নাম" htmlFor="category-name" required><input id="category-name" autoFocus value={form.name} onChange={(event) => updateField("name", event.target.value)} disabled={saving} required placeholder="যেমন: Educational Toys" className={inputClass} /></Field>
                <Field label="URL slug" htmlFor="category-slug" required><input id="category-slug" value={form.slug} onChange={(event) => updateField("slug", event.target.value)} disabled={saving} required placeholder="educational-toys" className={`${inputClass} font-mono text-xs`} /></Field>
              </div>
              <RichTextEditor value={form.description} onChange={(value) => updateField("description", value)} placeholder="ক্যাটাগরি সম্পর্কে বিস্তারিত লিখুন…" />
              <Field label="ক্যাটাগরি ছবি" htmlFor="category-image" hint={`শুধু ${CATEGORY_IMAGE_WIDTH}×${CATEGORY_IMAGE_HEIGHT}px image গ্রহণ করা হবে। খালি রাখলে default icon ব্যবহার হবে।`}>
                <button type="button" id="category-image" disabled={saving || uploadingImage} onClick={() => imageInputRef.current?.click()} className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl border-2 border-dashed border-[#b8dff0] bg-[#f2f9fd] text-[#52748c] transition hover:border-[#238fda] hover:bg-[#eaf7ff] disabled:cursor-wait disabled:opacity-60">
                  {form.image ? <span className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${form.image})` }} /> : <span className="absolute inset-0 grid place-items-center"><span className="flex flex-col items-center gap-2"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#238fda] shadow-sm"><ImageIcon className="h-6 w-6" /></span><span className="text-sm font-bold">Icon-এ click করে ছবি upload করুন</span><span className="text-xs text-[#7895aa]">JPG, PNG, WebP, GIF অথবা AVIF</span></span></span>}
                  {form.image && <span className="absolute inset-0 grid place-items-center bg-[#173f5c]/0 opacity-0 transition group-hover:bg-[#173f5c]/55 group-hover:opacity-100"><span className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#238fda]"><Upload className="h-4 w-4" />ছবি পরিবর্তন করুন</span></span>}
                  {uploadingImage && <span className="absolute inset-0 grid place-items-center bg-[#173f5c]/65 text-white"><span className="flex items-center gap-2 text-sm font-bold"><Loader2 className="h-5 w-5 animate-spin" />Upload হচ্ছে…</span></span>}
                </button>
                <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="hidden" onChange={(event) => void handleImageUpload(event.target.files?.[0])} />
                {form.image && <div className="mt-2 flex justify-end"><button type="button" disabled={saving || uploadingImage} onClick={() => updateField("image", "")} className="text-xs font-bold text-[#d7547a] hover:underline">ছবি সরিয়ে দিন</button></div>}
              </Field>
              <footer className="grid grid-cols-2 gap-3 border-t border-[#e7f1f7] pt-5"><button type="button" disabled={saving || uploadingImage} onClick={() => setShowModal(false)} className="h-11 rounded-xl border border-[#cfe4f1] text-sm font-bold text-[#52748c] transition hover:bg-[#f5fbff] disabled:opacity-50">বাতিল</button><button type="submit" disabled={saving || uploadingImage} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#238fda] text-sm font-bold text-white transition hover:bg-[#167fc3] disabled:cursor-wait disabled:opacity-60">{saving || uploadingImage ? <><Loader2 className="h-4 w-4 animate-spin" />{uploadingImage ? "ছবি upload হচ্ছে…" : "সেভ হচ্ছে…"}</> : <><Check className="h-4 w-4" />{editId ? "পরিবর্তন সেভ করুন" : "ক্যাটাগরি যোগ করুন"}</>}</button></footer>
            </form>
          </section>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-[80] grid place-items-center p-4">
          <button type="button" aria-label="Close delete confirmation" disabled={deleting} onClick={() => setDeleteId(null)} className="absolute inset-0 bg-[#163d5c]/45 backdrop-blur-sm" />
          <section role="alertdialog" aria-modal="true" aria-labelledby="delete-category-title" className="relative w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#ffe5ec] text-[#d7547a]"><Trash2 className="h-6 w-6" /></span><h2 id="delete-category-title" className="mt-4 text-xl font-bold text-[#234963]">ক্যাটাগরি মুছে ফেলবেন?</h2><p className="mt-2 text-sm leading-6 text-[#6b8497]"><strong>{selectedForDelete?.name}</strong> মুছে যাবে। এর পণ্যগুলো মুছে যাবে না, তবে category assignment হারাবে।</p><div className="mt-6 grid grid-cols-2 gap-3"><button type="button" disabled={deleting} onClick={() => setDeleteId(null)} className="h-11 rounded-xl border border-[#cfe4f1] text-sm font-bold text-[#52748c] hover:bg-[#f5fbff] disabled:opacity-50">বাতিল</button><button type="button" disabled={deleting} onClick={() => void handleDelete()} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#e95b87] text-sm font-bold text-white hover:bg-[#d94372] disabled:cursor-wait disabled:opacity-60">{deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}মুছে ফেলুন</button></div></section>
        </div>
      )}
    </div>
  );
}

function Metric({ icon: Icon, label, value, color }: { icon: typeof Layers3; label: string; value: number; color: string }) {
  return <article className={`rounded-2xl p-3.5 sm:p-4 ${color}`}><div className="flex items-center justify-between gap-2"><p className="text-xl font-bold sm:text-2xl">{value}</p><Icon className="h-4 w-4 shrink-0 opacity-70" /></div><p className="mt-1 text-[10px] font-semibold opacity-80 sm:text-xs">{label}</p></article>;
}

function Field({ label, htmlFor, hint, required, children }: { label: string; htmlFor: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return <div><label htmlFor={htmlFor} className="mb-2 block text-xs font-semibold text-[#527087]">{label}{required ? " *" : ""}</label>{children}{hint && <p className="mt-1.5 text-xs text-[#7892a5]">{hint}</p>}</div>;
}

function ActionButton({ label, danger, onClick, children }: { label: string; danger?: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-label={label} title={label} onClick={onClick} className={`grid h-9 w-9 place-items-center rounded-xl transition ${danger ? "text-[#d7547a] hover:bg-[#fff0f4]" : "text-[#3976a1] hover:bg-[#e9f6ff]"}`}>{children}</button>;
}
