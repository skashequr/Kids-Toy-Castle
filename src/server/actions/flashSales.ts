"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "../db/connect";
import { FlashSale } from "../models/FlashSale";
import { requireAdmin } from "../guard";

export type FlashSaleInput = {
  productId: string;
  flashPrice: number;
  flashStock?: number;
  soldCount?: number;
  saleEndsAt: string;
  isActive?: boolean;
};

function revalidate() {
  revalidatePath("/admin/flash-sales");
  revalidatePath("/flash-sale");
  revalidatePath("/");
}

export async function createFlashSale(input: FlashSaleInput) {
  await requireAdmin();
  await connectDB();
  await FlashSale.create({
    product: input.productId,
    flashPrice: input.flashPrice,
    flashStock: input.flashStock ?? 0,
    soldCount: input.soldCount ?? 0,
    saleEndsAt: new Date(input.saleEndsAt),
    isActive: input.isActive ?? true,
  });
  revalidate();
  return { ok: true };
}

export async function updateFlashSale(id: string, input: Partial<FlashSaleInput>) {
  await requireAdmin();
  await connectDB();
  const update: Record<string, unknown> = { ...input };
  if (input.productId) update.product = input.productId;
  if (input.saleEndsAt) update.saleEndsAt = new Date(input.saleEndsAt);
  delete (update as { productId?: string }).productId;
  await FlashSale.findByIdAndUpdate(id, update);
  revalidate();
  return { ok: true };
}

export async function deleteFlashSale(id: string) {
  await requireAdmin();
  await connectDB();
  await FlashSale.findByIdAndDelete(id);
  revalidate();
  return { ok: true };
}

export async function toggleFlashSale(id: string, isActive: boolean) {
  await requireAdmin();
  await connectDB();
  await FlashSale.findByIdAndUpdate(id, { isActive });
  revalidate();
  return { ok: true };
}
