"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, Tag, X, Check, Copy } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  createCoupon,
  updateCoupon,
  deleteCoupon as deleteCouponAction,
  toggleCoupon,
} from "@/server/actions/coupons";

type CouponType = "percentage" | "fixed";
export interface AdminCouponRow {
  id: string; code: string; type: CouponType; value: number;
  minOrder: number; maxUses: number; used: number;
  validFrom: string; validUntil: string; active: boolean;
  description: string;
}
type Coupon = AdminCouponRow;

type F = { code: string; type: CouponType; value: string; minOrder: string; maxUses: string; validFrom: string; validUntil: string; active: boolean; description: string };
const empty: F = { code: "", type: "percentage", value: "", minOrder: "0", maxUses: "100", validFrom: new Date().toISOString().slice(0,10), validUntil: "2026-12-31", active: true, description: "" };

export function AdminCouponsClient({ initial }: { initial: AdminCouponRow[] }) {
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>(initial);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<F>(empty);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const openAdd = () => { setEditId(null); setForm(empty); setShowModal(true); };
  const openEdit = (c: Coupon) => {
    setEditId(c.id);
    setForm({ code: c.code, type: c.type, value: String(c.value), minOrder: String(c.minOrder), maxUses: String(c.maxUses), validFrom: c.validFrom.slice(0, 10), validUntil: c.validUntil.slice(0, 10), active: c.active, description: c.description });
    setShowModal(true);
  };
  const f = (k: keyof F, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = {
      code: form.code.toUpperCase(),
      type: form.type,
      value: Number(form.value),
      minPurchase: Number(form.minOrder),
      usageLimit: Number(form.maxUses),
      description: form.description,
      expiresAt: form.validUntil,
      isActive: form.active,
    };
    const local: Coupon = {
      id: editId ?? `c${Date.now()}`,
      code: input.code, type: form.type, value: input.value,
      minOrder: input.minPurchase, maxUses: input.usageLimit,
      used: editId ? (coupons.find((c) => c.id === editId)?.used ?? 0) : 0,
      validFrom: form.validFrom, validUntil: form.validUntil,
      active: form.active, description: form.description,
    };
    if (editId) { setCoupons((p) => p.map((c) => c.id === editId ? local : c)); await updateCoupon(editId, input); }
    else { setCoupons((p) => [local, ...p]); await createCoupon(input); }
    setShowModal(false);
    router.refresh();
  };

  const toggleActive = (id: string, next: boolean) => {
    setCoupons((p) => p.map((c) => c.id === id ? { ...c, active: next } : c));
    void toggleCoupon(id, next);
  };
  const copyCode = (code: string) => { navigator.clipboard.writeText(code).catch(() => {}); setCopied(code); setTimeout(() => setCopied(null), 2000); };

  const isExpired = (validUntil: string) => new Date(validUntil) < new Date();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-ivory">Coupons</h1>
          <p className="text-muted text-sm">{coupons.length} coupons · {coupons.filter((c) => c.active).length} active</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-gold text-navy font-semibold rounded-xl hover:opacity-90 transition-opacity text-sm">
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      <div className="grid gap-4">
        {coupons.map((c) => {
          const expired = isExpired(c.validUntil);
          const pct = Math.min(100, Math.round((c.used / c.maxUses) * 100));
          return (
            <div key={c.id} className="bg-white dark:bg-navy rounded-2xl shadow-card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Tag className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-lg tracking-wider">{c.code}</span>
                      <button onClick={() => copyCode(c.code)} className="p-1 text-muted hover:text-gold transition-colors" title="Copy">
                        {copied === c.code ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full",
                        expired ? "bg-gray-100 text-gray-500" :
                        c.active ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        "bg-red-100 text-red-700"
                      )}>
                        {expired ? "Expired" : c.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-sm text-muted mt-0.5">{c.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gold">
                      {c.type === "percentage" ? `${c.value}%` : formatPrice(c.value)}
                    </p>
                    <p className="text-xs text-muted">discount</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold">{c.minOrder > 0 ? formatPrice(c.minOrder) : "None"}</p>
                    <p className="text-xs text-muted">min order</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold">{c.used}/{c.maxUses}</p>
                    <p className="text-xs text-muted">used</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted">{formatDate(c.validFrom)}</p>
                    <p className="text-xs text-muted">→ {c.validUntil ? formatDate(c.validUntil) : "No expiry"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(c.id, !c.active)}
                      className={cn("relative w-10 h-5 rounded-full transition-colors flex-shrink-0", c.active ? "bg-gold" : "bg-navy/20 dark:bg-ivory/20")}
                    >
                      <div className={cn("absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform", c.active && "translate-x-5")} />
                    </button>
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-gold/10 text-muted hover:text-gold transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Usage bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted mb-1">
                  <span>Usage</span><span>{pct}%</span>
                </div>
                <div className="h-1.5 bg-navy/10 dark:bg-ivory/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white dark:bg-navy rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-navy/10 dark:border-ivory/10 flex-shrink-0">
              <h3 className="font-bold text-lg">{editId ? "Edit Coupon" : "Create Coupon"}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-navy/10 dark:hover:bg-ivory/10"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-sm">Coupon Code *</label>
                  <input value={form.code} onChange={(e) => f("code", e.target.value.toUpperCase())} required placeholder="LUXEN10" className="input-field font-mono tracking-widest" />
                </div>
                <div>
                  <label className="label-sm">Discount Type *</label>
                  <select value={form.type} onChange={(e) => f("type", e.target.value)} className="input-field bg-white dark:bg-navy">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (৳)</option>
                  </select>
                </div>
                <div>
                  <label className="label-sm">Discount Value *</label>
                  <input type="number" value={form.value} onChange={(e) => f("value", e.target.value)} required min={0} placeholder={form.type === "percentage" ? "10" : "200"} className="input-field" />
                </div>
                <div>
                  <label className="label-sm">Min Order (৳)</label>
                  <input type="number" value={form.minOrder} onChange={(e) => f("minOrder", e.target.value)} min={0} placeholder="0" className="input-field" />
                </div>
                <div>
                  <label className="label-sm">Max Uses</label>
                  <input type="number" value={form.maxUses} onChange={(e) => f("maxUses", e.target.value)} min={1} placeholder="100" className="input-field" />
                </div>
                <div>
                  <label className="label-sm">Active</label>
                  <div className="flex items-center h-10">
                    <button type="button" onClick={() => f("active", !form.active)} className={cn("relative w-10 h-5 rounded-full transition-colors", form.active ? "bg-gold" : "bg-navy/20")}>
                      <div className={cn("absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform", form.active && "translate-x-5")} />
                    </button>
                    <span className="text-sm ml-2">{form.active ? "Active" : "Inactive"}</span>
                  </div>
                </div>
                <div>
                  <label className="label-sm">Valid From *</label>
                  <input type="date" value={form.validFrom} onChange={(e) => f("validFrom", e.target.value)} required className="input-field" />
                </div>
                <div>
                  <label className="label-sm">Valid Until *</label>
                  <input type="date" value={form.validUntil} onChange={(e) => f("validUntil", e.target.value)} required className="input-field" />
                </div>
                <div className="col-span-2">
                  <label className="label-sm">Description</label>
                  <input value={form.description} onChange={(e) => f("description", e.target.value)} placeholder="Short description for internal use" className="input-field" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 h-10 rounded-xl border border-navy/20 dark:border-ivory/20 text-sm font-medium hover:bg-navy/5 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 h-10 bg-gold text-navy font-semibold rounded-xl hover:opacity-90 text-sm flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />{editId ? "Save" : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white dark:bg-navy rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
            <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-2">Delete Coupon?</h3>
            <p className="text-muted text-sm mb-5">The coupon code will no longer be usable by customers.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 h-10 rounded-xl border border-navy/20 dark:border-ivory/20 text-sm font-medium hover:bg-navy/5 transition-colors">Cancel</button>
              <button onClick={() => { const id = deleteId; setCoupons((p) => p.filter((c) => c.id !== id)); setDeleteId(null); void deleteCouponAction(id); router.refresh(); }} className="flex-1 h-10 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .input-field { width: 100%; height: 2.5rem; padding: 0 0.75rem; border-radius: 0.75rem; border: 1px solid rgba(26,58,74,0.2); background: transparent; font-size: 0.875rem; outline: none; transition: border-color 0.2s; }
        .input-field:focus { border-color: #a0d5e9; }
        .label-sm { display: block; font-size: 0.625rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-muted,#64748b); margin-bottom: 0.375rem; }
      `}</style>
    </div>
  );
}
