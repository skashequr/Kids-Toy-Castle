"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "../guard";
import { connectDB } from "../db/connect";
import { FinanceEntry } from "../models/FinanceEntry";
import { FINANCE_CATEGORIES } from "@/lib/finance";
import { dhakaDate } from "@/lib/order-date-range";
import { ProductCost } from "../models/ProductCost";
import { Product } from "../models/Product";

const inputSchema = z.object({
  requestId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((d) => {
    const parsed = new Date(d + "T00:00:00Z");
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === d && d <= dhakaDate();
  }, "Choose a valid date on or before today."),
  type: z.enum(["income", "expense"]),
  category: z.string(),
  amountCents: z.number().int().positive().max(100000000000),
  description: z.string().trim().min(1).max(500),
  reference: z.string().trim().max(120),
  productId: z.string().regex(/^$|^[a-f0-9]{24}$/i).default(""),
}).refine((v) => (FINANCE_CATEGORIES[v.type] as readonly string[]).includes(v.category), "Invalid category.");

export async function addFinanceEntry(input: z.input<typeof inputSchema>) {
  const session = await requireAdmin();
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  await connectDB();
  if (parsed.data.productId && !(await Product.exists({ _id: parsed.data.productId }))) return { ok: false, error: "Product no longer exists." };
  // Repeated submissions with the same request ID cannot duplicate an expense.
  await FinanceEntry.updateOne({ requestId: parsed.data.requestId }, {
    $setOnInsert: { ...parsed.data, createdBy: session.user?.email || "Admin" },
  }, { upsert: true, runValidators: true });
  const saved = await FinanceEntry.findOne({ requestId: parsed.data.requestId }).lean();
  const { date, type, category, amountCents, description, reference, productId } = parsed.data;
  if (!saved || saved.date !== date || saved.type !== type || saved.category !== category || saved.amountCents !== amountCents || saved.description !== description || saved.reference !== reference || (saved.productId ?? "") !== productId) {
    return { ok: false, error: "The earlier submission was already saved. Refresh and review the ledger before adding another entry." };
  }
  revalidatePath("/admin/finance");
  return { ok: true };
}

export async function saveProductCost(input: { productId: string; variantId: string; effectiveFrom: string; unitCostCents: number }) {
  const session = await requireAdmin();
  const parsed = z.object({
    productId: z.string().regex(/^[a-f0-9]{24}$/i), variantId: z.string().max(100),
    effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((date) => {
      const d = new Date(date + "T00:00:00Z");
      return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === date && date <= dhakaDate();
    }), unitCostCents: z.number().int().min(0).max(100000000000),
  }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter a valid product, date and buying price." };
  await connectDB();
  const product = await Product.findById(input.productId).select("variants").lean();
  if (!product || (input.variantId && !product.variants.some((v) => String(v._id) === input.variantId))) return { ok: false, error: "Product or variant no longer exists." };
  const { unitCostCents, ...key } = parsed.data;
  await ProductCost.updateOne(key, { $set: { unitCostCents, recordedBy: session.user?.email || "Admin" } }, { upsert: true, runValidators: true });
  revalidatePath("/admin/finance");
  return { ok: true };
}

export async function voidFinanceEntry(id: string, reason: string) {
  const session = await requireAdmin();
  if (!/^[a-f0-9]{24}$/i.test(id) || !reason.trim() || reason.length > 500) return { ok: false, error: "A correction reason is required." };
  await connectDB();
  const result = await FinanceEntry.updateOne({ _id: id, voided: false }, { $set: {
    voided: true, voidReason: reason.trim(), voidedBy: session.user?.email || "Admin", voidedAt: new Date(),
  } });
  if (!result.matchedCount) return { ok: false, error: "Entry already voided or no longer exists. Refresh the page." };
  revalidatePath("/admin/finance");
  return { ok: true };
}
