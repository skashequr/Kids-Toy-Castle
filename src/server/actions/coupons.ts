"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "../db/connect";
import { Coupon } from "../models/Coupon";
import { requireAdmin } from "../guard";
import { getValidCoupon } from "../services/coupons";

export type CouponInput = {
  code: string;
  type: string;
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  usageLimit?: number;
  description?: string;
  expiresAt?: string;
  isActive?: boolean;
};

/**
 * Public: validate a coupon for the cart. Returns the discount type/value so
 * the client can compute the discount; cart math stays client-side.
 */
export async function validateCoupon(code: string): Promise<{
  ok: boolean;
  type?: string;
  value?: number;
  minPurchase?: number;
  maxDiscount?: number;
  error?: string;
}> {
  const coupon = await getValidCoupon(code);
  if (!coupon) return { ok: false, error: "Invalid or expired coupon code." };
  return {
    ok: true,
    type: coupon.type,
    value: coupon.value,
    minPurchase: coupon.minPurchase ?? undefined,
    maxDiscount: coupon.maxDiscount ?? undefined,
  };
}

export async function createCoupon(input: CouponInput) {
  await requireAdmin();
  await connectDB();
  await Coupon.create({
    code: input.code.toUpperCase().trim(),
    type: input.type,
    value: input.value,
    minPurchase: input.minPurchase,
    maxDiscount: input.maxDiscount,
    usageLimit: input.usageLimit,
    description: input.description,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
    isActive: input.isActive ?? true,
  });
  revalidatePath("/admin/coupons");
  return { ok: true };
}

export async function updateCoupon(id: string, input: Partial<CouponInput>) {
  await requireAdmin();
  await connectDB();
  const update: Record<string, unknown> = { ...input };
  if (input.code) update.code = input.code.toUpperCase().trim();
  if (input.expiresAt) update.expiresAt = new Date(input.expiresAt);
  await Coupon.findByIdAndUpdate(id, update);
  revalidatePath("/admin/coupons");
  return { ok: true };
}

export async function deleteCoupon(id: string) {
  await requireAdmin();
  await connectDB();
  await Coupon.findByIdAndDelete(id);
  revalidatePath("/admin/coupons");
  return { ok: true };
}

export async function toggleCoupon(id: string, isActive: boolean) {
  await requireAdmin();
  await connectDB();
  await Coupon.findByIdAndUpdate(id, { isActive });
  revalidatePath("/admin/coupons");
  return { ok: true };
}
