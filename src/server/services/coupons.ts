import { connectDB } from "../db/connect";
import { Coupon } from "../models/Coupon";

export type CouponRow = {
  id: string;
  code: string;
  type: string;
  value: number;
  minPurchase: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  description: string;
  expiresAt: string | null;
  isActive: boolean;
};

function toRow(d: Record<string, unknown>): CouponRow {
  return {
    id: String(d._id),
    code: d.code as string,
    type: (d.type as string) ?? "percentage",
    value: (d.value as number) ?? 0,
    minPurchase: (d.minPurchase as number) ?? null,
    maxDiscount: (d.maxDiscount as number) ?? null,
    usageLimit: (d.usageLimit as number) ?? null,
    usedCount: (d.usedCount as number) ?? 0,
    description: (d.description as string) ?? "",
    expiresAt: d.expiresAt ? new Date(d.expiresAt as Date).toISOString() : null,
    isActive: (d.isActive as boolean) ?? false,
  };
}

export async function getCoupons(): Promise<CouponRow[]> {
  await connectDB();
  const docs = await Coupon.find({}).sort({ createdAt: -1 }).lean();
  return docs.map((d) => toRow(d as Record<string, unknown>));
}

/** Validate a coupon code for the cart. Returns null if invalid/expired. */
export async function getValidCoupon(code: string): Promise<CouponRow | null> {
  await connectDB();
  const doc = await Coupon.findOne({
    code: code.trim().toUpperCase(),
    isActive: true,
  }).lean();
  if (!doc) return null;
  const row = toRow(doc as Record<string, unknown>);
  if (row.expiresAt && new Date(row.expiresAt) < new Date()) return null;
  if (row.usageLimit !== null && row.usedCount >= row.usageLimit) return null;
  return row;
}
