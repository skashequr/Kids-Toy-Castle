"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "../db/connect";
import { Product } from "../models/Product";
import { requireAdmin } from "../guard";

/** Set a product's absolute stock count. */
export async function updateProductStock(id: string, stock: number) {
  await requireAdmin();
  await connectDB();
  await Product.findByIdAndUpdate(id, { stock: Math.max(0, Math.round(stock)) });
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
  return { ok: true };
}

/** Adjust stock by a relative delta (e.g. +10 restock, -1 sale correction). */
export async function adjustProductStock(id: string, delta: number) {
  await requireAdmin();
  await connectDB();
  const product = await Product.findById(id).select("stock").lean();
  const current = (product?.stock as number) ?? 0;
  const next = Math.max(0, current + Math.round(delta));
  await Product.findByIdAndUpdate(id, { stock: next });
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
  return { ok: true, stock: next };
}
