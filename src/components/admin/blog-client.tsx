"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, FileText, X, Check, Eye, Search } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import {
  createBlogPost,
  updateBlogPost,
  deleteBlogPost as deleteBlogPostAction,
} from "@/server/actions/blog";

type Status = "published" | "draft";
export interface AdminPostRow {
  id: string; title: string; slug: string; excerpt: string;
  content: string; category: string; image: string; author: string;
  status: Status; views: number; createdAt: string; tags: string;
}
type Post = AdminPostRow;

const CATS = ["Style & Fashion", "Watch Reviews", "Lifestyle", "Gift Guides", "Brand Stories", "Accessories"];

type F = { title: string; slug: string; excerpt: string; content: string; category: string; image: string; tags: string; status: Status };
const empty: F = { title: "", slug: "", excerpt: "", content: "", category: CATS[0], image: "", tags: "", status: "draft" };

const slugify = (s: string) => s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

export function AdminBlogClient({ initial }: { initial: AdminPostRow[] }) {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>(initial);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<F>(empty);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [slugLocked, setSlugLocked] = useState(false);

  const filtered = posts.filter((p) => {
    const match = p.title.toLowerCase().includes(search.toLowerCase());
    const stat  = filter === "all" || p.status === filter;
    return match && stat;
  });

  const f = (k: keyof F, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const setTitle = (title: string) => setForm((p) => ({ ...p, title, slug: slugLocked ? p.slug : slugify(title) }));

  const openAdd  = () => { setEditId(null); setSlugLocked(false); setForm(empty); setShowModal(true); };
  const openEdit = (post: Post) => {
    setEditId(post.id); setSlugLocked(true);
    setForm({ title: post.title, slug: post.slug, excerpt: post.excerpt, content: post.content, category: post.category, image: post.image, tags: post.tags, status: post.status });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: Post = {
      id: editId ?? `b${Date.now()}`,
      title: form.title, slug: form.slug || slugify(form.title),
      excerpt: form.excerpt, content: form.content,
      category: form.category, image: form.image, tags: form.tags,
      author: "Admin", status: form.status,
      views: editId ? (posts.find((p) => p.id === editId)?.views ?? 0) : 0,
      createdAt: editId ? (posts.find((p) => p.id === editId)?.createdAt ?? new Date().toISOString()) : new Date().toISOString(),
    };
    const input = {
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt,
      body: form.content,
      coverImage: form.image,
      category: form.category,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      isPublished: form.status === "published",
    };
    if (editId) { setPosts((p) => p.map((post) => post.id === editId ? data : post)); await updateBlogPost(editId, input); }
    else { setPosts((p) => [data, ...p]); await createBlogPost(input); }
    setShowModal(false);
    router.refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-ivory">Blog</h1>
          <p className="text-muted text-sm">{posts.length} posts · {posts.filter((p) => p.status === "published").length} published</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-gold text-navy font-semibold rounded-xl hover:opacity-90 text-sm">
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-navy rounded-2xl p-4 shadow-card mb-4 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search posts..." className="w-full h-10 pl-10 pr-4 rounded-xl border border-navy/20 dark:border-ivory/20 bg-transparent text-sm focus:outline-none focus:border-gold transition-colors" />
        </div>
        {(["all", "published", "draft"] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={cn("px-4 h-10 rounded-xl text-sm font-medium capitalize transition-colors", filter === s ? "bg-navy text-ivory dark:bg-ivory dark:text-navy" : "bg-navy/5 dark:bg-ivory/5 text-muted hover:text-navy dark:hover:text-ivory")}>
            {s} ({s === "all" ? posts.length : posts.filter((p) => p.status === s).length})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-navy rounded-2xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 dark:bg-ivory/5 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wide">Title</th>
              <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wide">Category</th>
              <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wide">Date</th>
              <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wide text-center">Views</th>
              <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wide text-center">Status</th>
              <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wide text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5 dark:divide-ivory/5">
            {filtered.map((post) => (
              <tr key={post.id} className="hover:bg-gold/5 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-gold" />
                    </div>
                    <div>
                      <p className="font-medium line-clamp-1 max-w-[220px]">{post.title}</p>
                      <p className="text-xs text-muted font-mono">{post.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted">{post.category}</td>
                <td className="px-4 py-3 text-xs text-muted">{formatDate(post.createdAt)}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted">
                    <Eye className="w-3 h-3" /> {post.views.toLocaleString()}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full capitalize", post.status === "published" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400")}>
                    {post.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(post)} className="p-1.5 rounded-lg hover:bg-gold/10 text-muted hover:text-gold transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteId(post.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white dark:bg-navy rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-navy/10 dark:border-ivory/10 flex-shrink-0">
              <h3 className="font-bold text-lg">{editId ? "Edit Post" : "New Blog Post"}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-navy/10 dark:hover:bg-ivory/10"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="lbl">Title *</label>
                <input value={form.title} onChange={(e) => setTitle(e.target.value)} required placeholder="Post title..." className="inp" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="lbl">Slug</label>
                  <input value={form.slug} onChange={(e) => { setSlugLocked(true); f("slug", e.target.value); }} placeholder="auto-generated" className="inp font-mono text-xs" />
                </div>
                <div>
                  <label className="lbl">Category</label>
                  <select value={form.category} onChange={(e) => f("category", e.target.value)} className="inp bg-white dark:bg-navy">
                    {CATS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="lbl">Excerpt *</label>
                <textarea value={form.excerpt} onChange={(e) => f("excerpt", e.target.value)} required rows={2} placeholder="Short description shown on blog listing..." className="inp !h-auto py-2 resize-none" />
              </div>
              <div>
                <label className="lbl">Content</label>
                <textarea value={form.content} onChange={(e) => f("content", e.target.value)} rows={8} placeholder="Write the full article here..." className="inp !h-auto py-2 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="lbl">Featured Image URL</label>
                  <input value={form.image} onChange={(e) => f("image", e.target.value)} placeholder="/images/blog/..." className="inp" />
                </div>
                <div>
                  <label className="lbl">Tags</label>
                  <input value={form.tags} onChange={(e) => f("tags", e.target.value)} placeholder="tag1, tag2, tag3" className="inp" />
                </div>
              </div>
              <div>
                <label className="lbl">Status</label>
                <div className="flex gap-3">
                  {(["draft", "published"] as const).map((s) => (
                    <button key={s} type="button" onClick={() => f("status", s)} className={cn("flex-1 h-10 rounded-xl text-sm font-medium capitalize transition-colors", form.status === s ? "bg-navy text-ivory dark:bg-ivory dark:text-navy" : "border border-navy/20 dark:border-ivory/20 text-muted hover:bg-navy/5 transition-colors")}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 h-10 rounded-xl border border-navy/20 dark:border-ivory/20 text-sm font-medium hover:bg-navy/5 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 h-10 bg-gold text-navy font-semibold rounded-xl hover:opacity-90 text-sm flex items-center justify-center gap-2"><Check className="w-4 h-4" />{editId ? "Save" : "Create Post"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white dark:bg-navy rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
            <h3 className="font-bold text-lg mb-2">Delete Post?</h3>
            <p className="text-muted text-sm mb-5">This blog post will be permanently deleted.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 h-10 rounded-xl border border-navy/20 dark:border-ivory/20 text-sm font-medium hover:bg-navy/5 transition-colors">Cancel</button>
              <button onClick={() => { const id = deleteId; setPosts((p) => p.filter((post) => post.id !== id)); setDeleteId(null); void deleteBlogPostAction(id); router.refresh(); }} className="flex-1 h-10 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        .inp { width:100%; padding:0 0.75rem; height:2.5rem; border-radius:0.75rem; border:1px solid rgba(26,58,74,0.2); background:transparent; font-size:0.875rem; outline:none; transition:border-color 0.2s; }
        .inp:focus { border-color:#a0d5e9; }
        .lbl { display:block; font-size:0.625rem; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:#64748b; margin-bottom:0.375rem; }
      `}</style>
    </div>
  );
}
