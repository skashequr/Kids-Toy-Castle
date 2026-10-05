"use client";

import { cloneElement, isValidElement, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Plus, Trash2, ImageIcon,
  Tag, Settings2, Package, DollarSign, Star, Info
} from "lucide-react";
import { createProduct, updateProduct } from "@/server/actions/products";
import { toast } from "@/components/ui/toaster";
import { RichTextEditor, richTextToPlainText } from "@/components/ui/rich-text";
import { cn } from "@/lib/utils";
import type { Product, Category } from "@/types";

/* ─── types ─── */
type Variant   = { image: string; name: string; price: string; id: string; color: string; colorHex: string; size: string; stock: string; sku: string };
type ImgEntry  = { id: string; url: string; alt: string; isPrimary: boolean };
type SpecEntry = { id: string; key: string; value: string };

interface FormData {
  name: string; slug: string; description: string;
  brand: string; weight: string; material: string; dimensions: string;
  categoryId: string;
  price: string; comparePrice: string; stock: string; sku: string;
  isNew: boolean; isFeatured: boolean; isBestSeller: boolean; isOnSale: boolean;
  images: ImgEntry[];
  highlights: string[];
  specs: SpecEntry[];
  variants: Variant[];
  tags: string;
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();

/* ─── helpers ─── */
const inputCls = "w-full min-w-0 h-11 px-3.5 rounded-xl border border-[#d8e8f2] bg-[#f8fcff] text-sm text-[#24445b] placeholder:text-[#8a9eae] focus:outline-none focus:border-[#238fda] focus:ring-4 focus:ring-[#238fda]/10 transition-colors";

function Field({ label, hint, children, col2 }: { label: string; hint?: string; children: React.ReactNode; col2?: boolean }) {
  const id = useId();
  const isControl = isValidElement<{ id?: string }>(children) && ["input", "select", "textarea"].includes(String(children.type));
  return (
    <div className={col2 ? "min-w-0 sm:col-span-2" : "min-w-0"}>
      <label htmlFor={isControl ? id : undefined} className="block text-xs font-semibold text-[#527087] mb-2">{label}</label>
      {isControl ? cloneElement(children, { id }) : children}
      {hint && <p className="text-xs text-muted mt-1">{hint}</p>}
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-3xl border border-[#d8edf9] bg-white p-5 shadow-[0_8px_22px_rgba(46,128,179,.06)] sm:p-6">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-navy/5 dark:border-ivory/5">
        <span className="text-[#238fda]">{icon}</span>
        <h2 className="font-bold text-base text-[#24445b]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

/* ─── Toggle ─── */
function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className="relative flex-shrink-0">
      <div className={cn("w-10 h-5 rounded-full transition-colors", checked ? "bg-[#238fda]" : "bg-navy/20 dark:bg-ivory/20")} />
      <div className={cn("absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform", checked && "translate-x-5")} />
    </button>
  );
}

/* ═══ MAIN COMPONENT ═══ */
export function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [slugLocked, setSlugLocked] = useState(!!product);
  const [activeTab, setActiveTab] = useState<"basic" | "media" | "variants" | "specs">("basic");

  const init: FormData = {
    name:        product?.name ?? "",
    slug:        product?.slug ?? "",
    description: product?.description ?? "",
    brand:       product?.brand ?? "",
    weight:      product?.weight ?? "",
    material:    product?.material ?? "",
    dimensions:  product?.dimensions ?? "",
    categoryId:  product?.category.id ?? (categories[0]?.id ?? "1"),
    price:       product ? String(product.price) : "",
    comparePrice: product?.comparePrice ? String(product.comparePrice) : "",
    stock:       product ? String(product.stock) : "",
    sku:         product?.sku ?? "",
    isNew:       product?.isNew ?? false,
    isFeatured:  product?.isFeatured ?? false,
    isBestSeller: product?.isBestSeller ?? false,
    isOnSale:    product?.isOnSale ?? false,
    images: product?.images.length
      ? product.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt, isPrimary: !!i.isPrimary }))
      : [{ id: "img-0", url: "", alt: "", isPrimary: true }],
    highlights: product?.highlights?.length ? product.highlights : [""],
    specs: product?.specifications
      ? Object.entries(product.specifications).map(([k, v], i) => ({ id: `s${i}`, key: k, value: v }))
      : [{ id: "s0", key: "", value: "" }],
    variants: product?.variants?.length
      ? product.variants.map((v) => ({
          image: v.image ?? "", name: v.name ?? "", price: v.price === undefined ? "" : String(v.price),
          id: v.id, color: v.color ?? "", colorHex: v.colorHex ?? "#a0d5e9",
          size: v.size ?? "", stock: String(v.stock), sku: v.sku,
        }))
      : [],
    tags: product?.tags?.join(", ") ?? "",
  };

  const [form, setForm] = useState<FormData>(init);
  const [draggingImageId, setDraggingImageId] = useState<string | null>(null);
  const [isDropActive, setIsDropActive] = useState(false);
  const [uploadingImageCount, setUploadingImageCount] = useState(0);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const f = <K extends keyof FormData>(k: K, v: FormData[K]) => setForm((p) => ({ ...p, [k]: v }));

  /* name → auto slug */
  const setName = (name: string) =>
    setForm((p) => ({ ...p, name, slug: slugLocked ? p.slug : slugify(name) }));

  /* images */
  const addImg = () => setForm((p) => ({ ...p, images: [...p.images, { id: `img-${Date.now()}`, url: "", alt: "", isPrimary: false }] }));
  const delImg = (id: string) => setForm((p) => ({ ...p, images: p.images.filter((i) => i.id !== id) }));
  const updImg = (id: string, field: keyof ImgEntry, val: string | boolean) =>
    setForm((p) => ({ ...p, images: p.images.map((i) => i.id === id ? { ...i, [field]: val } : i) }));
  const setPrimary = (id: string) =>
    setForm((p) => ({ ...p, images: p.images.map((i) => ({ ...i, isPrimary: i.id === id })) }));

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploadingImageCount((count) => count + 1);
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/admin/uploads", { method: "POST", body });
      const result = await response.json() as { url?: string; error?: string };
      if (!response.ok || !result.url) {
        throw new Error(result.error ?? "Image upload failed.");
      }
      return result.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image upload failed.");
      return null;
    } finally {
      setUploadingImageCount((count) => count - 1);
    }
  };

  const handleFileUpload = async (id: string, file?: File) => {
    if (!file) return;
    const url = await uploadImage(file);
    if (!url) return;
    setForm((p) => ({
      ...p,
      images: p.images.map((i) =>
        i.id === id
          ? { ...i, url, alt: i.alt || file.name }
          : i
      ),
    }));
  };

  const addFiles = async (files: FileList | File[]) => {
    const uploadedImages = await Promise.all(Array.from(files).map(async (file) => {
      const url = await uploadImage(file);
      return url ? {
        id: `img-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        url,
        alt: file.name,
        isPrimary: false,
      } : null;
    }));
    const newImages = uploadedImages.filter((image): image is ImgEntry => image !== null);
    if (newImages.length === 0) return;

    setForm((p) => {
      const filledImages = p.images.filter((img) => img.url);
      const emptyImages = p.images.filter((img) => !img.url);
      const result = [...filledImages, ...newImages, ...emptyImages];
      if (!result.some((img) => img.isPrimary)) {
        if (result.length > 0) result[0].isPrimary = true;
      }
      return { ...p, images: result };
    });
  };

  const handleDropFiles = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDropActive(false);
    if (e.dataTransfer.files?.length) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleDragStart = (id: string, e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.effectAllowed = "move";
    setDraggingImageId(id);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const moveImage = (fromId: string, toId: string) => {
    setForm((p) => {
      const images = [...p.images];
      const fromIndex = images.findIndex((img) => img.id === fromId);
      const toIndex = images.findIndex((img) => img.id === toId);
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return p;
      const [moved] = images.splice(fromIndex, 1);
      images.splice(toIndex, 0, moved);
      return { ...p, images };
    });
  };

  const handleDropImage = (id: string, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (draggingImageId && draggingImageId !== id) {
      moveImage(draggingImageId, id);
    }
    setDraggingImageId(null);
  };

  const handleDragEnd = () => setDraggingImageId(null);

  /* highlights */
  const addHL  = () => setForm((p) => ({ ...p, highlights: [...p.highlights, ""] }));
  const delHL  = (i: number) => setForm((p) => ({ ...p, highlights: p.highlights.filter((_, j) => j !== i) }));
  const updHL  = (i: number, v: string) => setForm((p) => ({ ...p, highlights: p.highlights.map((h, j) => j === i ? v : h) }));

  /* specs */
  const addSpec = () => setForm((p) => ({ ...p, specs: [...p.specs, { id: `s${Date.now()}`, key: "", value: "" }] }));
  const delSpec = (id: string) => setForm((p) => ({ ...p, specs: p.specs.filter((s) => s.id !== id) }));
  const updSpec = (id: string, f2: "key" | "value", v: string) =>
    setForm((p) => ({ ...p, specs: p.specs.map((s) => s.id === id ? { ...s, [f2]: v } : s) }));

  /* variants */
  const addVar  = () => setForm((p) => ({ ...p, variants: [...p.variants, { image: "", name: "", price: "", id: `v${Date.now()}`, color: "", colorHex: "#a0d5e9", size: "", stock: "0", sku: "" }] }));
  const delVar  = (id: string) => setForm((p) => ({ ...p, variants: p.variants.filter((v) => v.id !== id) }));
  const updVar  = (id: string, field: keyof Variant, val: string) =>
    setForm((p) => ({ ...p, variants: p.variants.map((v) => v.id === id ? { ...v, [field]: val } : v) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadingImageCount > 0) { toast.error("Please wait for image uploads to finish."); return; }
    if (!richTextToPlainText(form.description)) {
      setActiveTab("basic");
      toast.error("Product description is required.");
      return;
    }
    setLoading(true);
    const specs: Record<string, string> = {};
    form.specs.filter((s) => s.key).forEach((s) => { specs[s.key] = s.value; });

    const data = {
      name:        form.name,
      slug:        form.slug,
      description: form.description,
      brand:       form.brand,
      weight:      form.weight,
      material:    form.material,
      dimensions:  form.dimensions,
      categoryId:  form.categoryId,
      price:        Number(form.price),
      comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
      stock:        Number(form.stock),
      sku:          form.sku || `LXN-${Date.now()}`,
      isNew:        form.isNew,
      isFeatured:   form.isFeatured,
      isBestSeller: form.isBestSeller,
      isOnSale:     form.isOnSale,
      images: form.images
        .filter((i) => i.url)
        .map((i) => ({ url: i.url, alt: i.alt || form.name, isPrimary: i.isPrimary })),
      highlights:    form.highlights.filter(Boolean),
      specifications: Object.keys(specs).length ? specs : undefined,
      variants: form.variants.map((v) => ({
        _id: /^[a-f0-9]{24}$/i.test(v.id) ? v.id : undefined,
        image: v.image || undefined,
        name: v.name || undefined,
        price: v.price === "" ? undefined : Number(v.price),
        color:    v.color   || undefined,
        colorHex: v.colorHex || undefined,
        size:     v.size    || undefined,
        stock:    Number(v.stock),
        sku:      v.sku     || `LXN-V-${v.id}`,
      })),
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };

    const res = product
      ? await updateProduct(product.id, data)
      : await createProduct(data);

    setLoading(false);
    if (res.ok) {
      toast.success(product ? "Product updated." : "Product published.");
      router.push("/admin/products");
      router.refresh();
    } else {
      toast.error("Could not save product.");
    }
  };

  const TABS = [
    { id: "basic",    label: "Basic Info" },
    { id: "media",    label: "Images & Media" },
    { id: "variants", label: "Variants" },
    { id: "specs",    label: "Specifications" },
  ] as const;

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-7xl space-y-6 pb-8 text-[#24445b]">
      {/* Header */}
      <div className="flex flex-col gap-5 rounded-[2rem] bg-[#238fda] p-5 text-white shadow-[0_16px_38px_rgba(35,143,218,.2)] sm:p-7 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/products"
            aria-label="Back to products" className="shrink-0 rounded-xl bg-white/15 p-2.5 text-white transition hover:bg-white/25"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {product ? "Edit Product" : "Add New Product"}
            </h1>
            <p className="mt-1 text-sm text-white/80">
              {product ? `Editing: ${product.name}` : "Fill in the details to publish a new product"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/products"
            className="h-11 px-5 rounded-xl border border-white/30 text-sm font-semibold hover:bg-white/10 transition-colors flex items-center justify-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || uploadingImageCount > 0}
            className="h-11 px-5 bg-[#f06a9f] text-white font-semibold rounded-xl hover:bg-[#db4e87] transition-colors text-sm disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading && <span className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin" />}
            {product ? "Save Changes" : "Publish Product"}
          </button>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* ── Left column ── */}
        <div className="min-w-0 space-y-5">

          {/* Tabs */}
          <div className="grid grid-cols-2 gap-1 rounded-2xl border border-[#d8edf9] bg-white p-1.5 sm:grid-cols-4">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={activeTab === tab.id}
                className={cn(
                  "min-h-11 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors",
                  activeTab === tab.id
                    ? "bg-[#e2f4ff] text-[#187bbd]"
                    : "text-[#6c8598] hover:bg-[#f2f9fd] hover:text-[#238fda]"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Basic Info Tab */}
          {activeTab === "basic" && (
            <Card title="Basic Information" icon={<Info className="w-4 h-4" />}>
              <div className="space-y-4">
                <Field label="Product Name *">
                  <input
                    value={form.name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Wooden Rainbow Building Blocks"
                    className={inputCls}
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="URL Slug">
                    <input
                      value={form.slug}
                      onChange={(e) => { setSlugLocked(true); f("slug", e.target.value); }}
                      placeholder="auto-generated"
                      className={cn(inputCls, "font-mono text-xs")}
                    />
                  </Field>
                  <Field label="Brand">
                    <input
                      value={form.brand}
                      onChange={(e) => f("brand", e.target.value)}
                      placeholder="Luxen"
                      className={inputCls}
                    />
                  </Field>
                </div>

                <RichTextEditor
                  label="Product description"
                  value={form.description}
                  onChange={(value) => f("description", value)}
                  required
                  placeholder="পণ্যের বিস্তারিত, বৈশিষ্ট্য ও ব্যবহার লিখুন…"
                />

                <Field label="Product Highlights">
                  <div className="space-y-2">
                    {form.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-[#238fda] text-sm font-bold">✓</span>
                        <input
                          value={h}
                          onChange={(e) => updHL(i, e.target.value)}
                          placeholder={`Feature ${i + 1} (e.g. Child-safe materials)`}
                          className={cn(inputCls, "flex-1")}
                        />
                        {form.highlights.length > 1 && (
                          <button type="button" onClick={() => delHL(i)} className="p-1.5 text-red-400 hover:text-red-600 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={addHL} className="flex items-center gap-2 text-sm text-[#238fda] hover:opacity-80 transition-opacity">
                      <Plus className="w-4 h-4" /> Add Highlight
                    </button>
                  </div>
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Weight">
                    <input value={form.weight} onChange={(e) => f("weight", e.target.value)} placeholder="150g" className={inputCls} />
                  </Field>
                  <Field label="Material">
                    <input value={form.material} onChange={(e) => f("material", e.target.value)} placeholder="Wood, silicone, or plastic" className={inputCls} />
                  </Field>
                  <Field label="Dimensions">
                    <input value={form.dimensions} onChange={(e) => f("dimensions", e.target.value)} placeholder="20 × 15 × 10 cm" className={inputCls} />
                  </Field>
                </div>

                <Field label="Tags (comma separated)">
                  <input
                    value={form.tags}
                    onChange={(e) => f("tags", e.target.value)}
                    placeholder="educational, wooden, building blocks"
                    className={inputCls}
                  />
                </Field>
              </div>
            </Card>
          )}

          {/* Images Tab */}
          {activeTab === "media" && (
            <Card title="Product Images" icon={<ImageIcon className="w-4 h-4" />}>
              <p className="text-xs text-muted mb-4">
                Add image URLs, upload files, or drag and drop multiple images. Drag images within the list to reorder them.
              </p>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDropActive(true); }}
                onDragLeave={() => setIsDropActive(false)}
                onDrop={handleDropFiles}
                className={cn(
                  "rounded-2xl border p-4 mb-4 transition-all",
                  isDropActive
                    ? "border-gold bg-gold/10"
                    : "border-dashed border-navy/20 dark:border-ivory/20 bg-transparent"
                )}
              >
                <div className="flex flex-col items-center justify-center gap-2 text-center py-12">
                  <ImageIcon className="w-8 h-8 text-muted" />
                  <p className="text-sm font-medium text-navy dark:text-ivory">Drop images here to upload</p>
                  <p className="text-xs text-muted">or</p>
                  <button
                    type="button"
                    onClick={() => uploadInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-navy/20 dark:border-ivory/20 bg-white dark:bg-navy text-sm text-navy dark:text-ivory hover:bg-navy/5 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Select Files
                  </button>
                  <input
                    ref={uploadInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.length) void addFiles(e.target.files);
                    }}
                  />
                </div>
              </div>

              <button type="button" onClick={addImg} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#238fda]"><Plus className="h-4 w-4" /> Add image URL</button>
              <div className="space-y-3">
                {form.images.map((img, idx) => (
                  <div
                    key={img.id}
                    draggable
                    onDragStart={(e) => handleDragStart(img.id, e)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropImage(img.id, e)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "border border-navy/10 dark:border-ivory/10 rounded-xl p-3 transition",
                      draggingImageId === img.id ? "ring-2 ring-gold" : ""
                    )}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-16 h-16 rounded-lg bg-navy/5 dark:bg-ivory/5 flex items-center justify-center flex-shrink-0 overflow-hidden border border-navy/10 dark:border-ivory/10">
                        {img.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={img.url}
                            alt={img.alt}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }}
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-muted/30" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-muted mb-1">
                          Image {idx + 1} {img.isPrimary && <span className="text-[#238fda]">(Primary)</span>}
                        </p>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium">
                            <input
                              type="radio"
                              name="primary-img"
                              checked={img.isPrimary}
                              onChange={() => setPrimary(img.id)}
                              className="accent-gold w-3.5 h-3.5"
                            />
                            Set as Primary
                          </label>
                          {form.images.length > 1 && (
                            <button type="button" onClick={() => delImg(img.id)} className="text-red-400 hover:text-red-600 transition-colors ml-auto text-xs flex items-center gap-1">
                              <Trash2 className="w-3 h-3" /> Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                        <input
                          value={img.url}
                          onChange={(e) => updImg(img.id, "url", e.target.value)}
                          placeholder="Image URL — https://... or /images/products/name.jpg"
                          className={cn(inputCls, "text-xs")}
                        />
                        <label htmlFor={`product-image-${img.id}`} className="inline-flex h-11 px-4 items-center justify-center rounded-xl border border-navy/20 dark:border-ivory/20 bg-white text-xs font-medium text-navy hover:bg-navy/5 transition-colors cursor-pointer">
                          Upload file
                        </label>
                      </div>
                      <input
                        id={`product-image-${img.id}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleFileUpload(img.id, file);
                        }}
                      />
                      <input
                        value={img.alt}
                        onChange={(e) => updImg(img.id, "alt", e.target.value)}
                        placeholder="Alt text (for accessibility & SEO)"
                        className={cn(inputCls, "!h-9 text-xs")}
                      />
                      <p className="text-xs text-muted">
                        Upload via the file picker, paste a URL, or drag new images here. Reorder images by dragging them.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Variants Tab */}
          {activeTab === "variants" && (
            <Card title="Variant Images, Colors & Sizes" icon={<Tag className="w-4 h-4" />}>
              <p className="text-xs text-muted mb-4">
                Add variants if this product comes in multiple colors or sizes. Each variant has its own stock count.
              </p>
              {form.variants.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-navy/10 dark:border-ivory/10 rounded-xl">
                  <Tag className="w-8 h-8 text-muted/30 mx-auto mb-2" />
                  <p className="text-sm text-muted mb-3">No variants yet</p>
                  <button type="button" onClick={addVar} className="px-4 py-2 bg-gold/10 text-[#238fda] rounded-xl text-sm font-medium hover:bg-gold/20 transition-colors">
                    + Add First Variant
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="hidden 2xl:grid grid-cols-[1fr_60px_1fr_70px_1fr_32px] gap-2 text-[10px] font-bold text-muted uppercase tracking-wider px-1">
                    <span>Color Name</span><span>Hex</span><span>Size</span><span>Stock</span><span>SKU</span><span></span>
                  </div>
                  {form.variants.map((v) => (
                    <div key={v.id} className="grid grid-cols-2 sm:grid-cols-3 2xl:grid-cols-[1fr_60px_1fr_70px_1fr_32px] gap-3 items-center p-3 bg-navy/3 dark:bg-ivory/3 rounded-xl">
                      <div className="col-span-full grid gap-3 sm:grid-cols-3">
                        <Field label="Variant name"><input value={v.name} onChange={(e) => updVar(v.id, "name", e.target.value)} placeholder="Red car / Dinosaur" className={inputCls} /></Field>
                        <Field label="Variant price (optional)"><input type="number" min="0" step="0.01" value={v.price} onChange={(e) => updVar(v.id, "price", e.target.value)} placeholder="Use product price" className={inputCls} /></Field>
                        <Field label="Variant image"><input type="file" accept="image/*" disabled={uploadingImageCount > 0} onChange={async (e) => { const file = e.target.files?.[0]; if (file) { const url = await uploadImage(file); if (url) updVar(v.id, "image", url); } }} /></Field>
                        <Field label="Image URL"><input value={v.image} onChange={(e) => updVar(v.id, "image", e.target.value)} placeholder="https://..." className={inputCls} /></Field>
                        {v.image && <div><img src={v.image} alt={v.name || v.color || "Variant"} className="h-24 w-24 rounded-xl object-cover" /><button type="button" onClick={() => updVar(v.id, "image", "")} className="text-xs text-red-600">Remove image</button></div>}
                      </div>
                      <input
                        aria-label="Color name" value={v.color}
                        onChange={(e) => updVar(v.id, "color", e.target.value)}
                        placeholder="Gold"
                        className={cn(inputCls, "!h-9 text-xs")}
                      />
                      <input
                        type="color"
                        value={v.colorHex}
                        onChange={(e) => updVar(v.id, "colorHex", e.target.value)}
                        className="w-full h-9 rounded-lg border border-navy/20 dark:border-ivory/20 cursor-pointer p-0.5"
                        title="Pick color"
                      />
                      <input
                        aria-label="Size" value={v.size}
                        onChange={(e) => updVar(v.id, "size", e.target.value)}
                        placeholder="S / M / XL / 42mm"
                        className={cn(inputCls, "!h-9 text-xs")}
                      />
                      <input
                        type="number"
                        aria-label="Stock" value={v.stock}
                        onChange={(e) => updVar(v.id, "stock", e.target.value)}
                        min={0}
                        placeholder="0"
                        className={cn(inputCls, "!h-9 text-xs")}
                      />
                      <input
                        aria-label="SKU" value={v.sku}
                        onChange={(e) => updVar(v.id, "sku", e.target.value)}
                        placeholder="LXN-001-GLD"
                        className={cn(inputCls, "!h-9 text-xs font-mono")}
                      />
                      <button type="button" aria-label="Remove variant" onClick={() => delVar(v.id)} className="p-1.5 text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addVar} className="flex items-center gap-2 text-sm text-[#238fda] hover:opacity-80 transition-opacity mt-2">
                    <Plus className="w-4 h-4" /> Add Variant
                  </button>
                </div>
              )}
            </Card>
          )}

          {/* Specs Tab */}
          {activeTab === "specs" && (
            <Card title="Technical Specifications" icon={<Settings2 className="w-4 h-4" />}>
              <p className="text-xs text-muted mb-4">
                Add technical specs shown in a table on the product page. e.g. Age range → 3 years and up
              </p>
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_1fr_32px] gap-2 text-[10px] font-bold text-muted uppercase tracking-wider px-1">
                  <span>Specification Name</span><span>Value</span><span></span>
                </div>
                {form.specs.map((spec) => (
                  <div key={spec.id} className="grid grid-cols-[1fr_1fr_32px] gap-2 items-center">
                    <input
                      value={spec.key}
                      onChange={(e) => updSpec(spec.id, "key", e.target.value)}
                      placeholder="e.g. Age range"
                      className={inputCls}
                    />
                    <input
                      value={spec.value}
                      onChange={(e) => updSpec(spec.id, "value", e.target.value)}
                      placeholder="e.g. 3 years and up"
                      className={inputCls}
                    />
                    {form.specs.length > 1 && (
                      <button type="button" onClick={() => delSpec(spec.id)} className="p-1.5 text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addSpec} className="flex items-center gap-2 text-sm text-[#238fda] hover:opacity-80 transition-opacity mt-2">
                  <Plus className="w-4 h-4" /> Add Specification
                </button>
              </div>
            </Card>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div className="min-w-0 space-y-5">

          {/* Pricing */}
          <Card title="Pricing" icon={<DollarSign className="w-4 h-4" />}>
            <div className="space-y-3">
              <Field label="Sale Price (৳) *" hint="This is the price customers pay">
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => f("price", e.target.value)}
                  required
                  min={0}
                  placeholder="12500"
                  className={inputCls}
                />
              </Field>
              <Field label="Compare Price (৳)" hint="Shows crossed-out to show discount">
                <input
                  type="number"
                  value={form.comparePrice}
                  onChange={(e) => f("comparePrice", e.target.value)}
                  min={0}
                  placeholder="15000"
                  className={inputCls}
                />
              </Field>
              {form.price && form.comparePrice && Number(form.comparePrice) > Number(form.price) && (
                <div className="text-center bg-green-50 dark:bg-green-900/20 rounded-xl p-2">
                  <span className="text-green-600 dark:text-green-400 text-sm font-bold">
                    {Math.round((1 - Number(form.price) / Number(form.comparePrice)) * 100)}% discount
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Inventory */}
          <Card title="Inventory" icon={<Package className="w-4 h-4" />}>
            <div className="space-y-3">
              <Field label="SKU" hint="Leave empty to auto-generate">
                <input
                  value={form.sku}
                  onChange={(e) => f("sku", e.target.value)}
                  placeholder="LXN-WAT-00001"
                  className={cn(inputCls, "font-mono text-xs")}
                />
              </Field>
              <Field label="Total Stock *">
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => f("stock", e.target.value)}
                  required
                  min={0}
                  placeholder="50"
                  className={inputCls}
                />
              </Field>
            </div>
          </Card>

          {/* Category */}
          <Card title="Organization" icon={<Tag className="w-4 h-4" />}>
            <Field label="Category *">
              <select
                value={form.categoryId}
                onChange={(e) => f("categoryId", e.target.value)}
                className={cn(inputCls, "bg-white dark:bg-navy")}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
          </Card>

          {/* Status flags */}
          <Card title="Product Status" icon={<Star className="w-4 h-4" />}>
            <div className="space-y-3">
              {([
                { key: "isNew",       label: "New Arrival",  desc: "Shows 'New' badge on card" },
                { key: "isFeatured",  label: "Featured",     desc: "Appears in Featured section" },
                { key: "isBestSeller",label: "Best Seller",  desc: "Shows 'Best Seller' badge" },
                { key: "isOnSale",    label: "On Sale",      desc: "Shows 'Sale' badge on card" },
              ] as const).map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-navy/5 dark:hover:bg-ivory/5 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted">{desc}</p>
                  </div>
                  <Toggle label={label} checked={form[key] as boolean} onChange={(v) => f(key, v)} />
                </div>
              ))}
            </div>
          </Card>

          {/* Publish */}
          <button
            type="submit"
            disabled={loading || uploadingImageCount > 0}
            className="w-full h-12 bg-[#238fda] text-white font-bold rounded-2xl hover:opacity-90 transition-opacity text-base disabled:opacity-70 flex items-center justify-center gap-2 shadow-card"
          >
            {loading && <span className="w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin" />}
            {uploadingImageCount > 0 ? "Uploading image..." : product ? "Save Changes" : "Publish Product"}
          </button>
        </div>
      </div>
    </form>
  );
}
