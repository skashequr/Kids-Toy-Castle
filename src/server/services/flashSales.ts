import { connectDB } from "../db/connect";
import { FlashSale } from "../models/FlashSale";
import { toFlashSaleProduct } from "../mappers";
import type { FlashSaleProduct } from "@/types";

export async function getActiveFlashSales(): Promise<FlashSaleProduct[]> {
  await connectDB();
  const docs = await FlashSale.find({ isActive: true })
    .populate({ path: "product", populate: { path: "category" } })
    .sort({ saleEndsAt: 1 })
    .lean();
  return docs.filter((d) => d.product).map(toFlashSaleProduct);
}

/** Raw flash sale rows for admin (with product name resolved). */
export async function getAllFlashSalesAdmin() {
  await connectDB();
  const docs = await FlashSale.find({})
    .populate("product")
    .sort({ createdAt: -1 })
    .lean();
  return docs.map((d) => {
    const product = d.product as unknown as
      | { _id: unknown; name?: string; price?: number }
      | null;
    return {
      id: String(d._id),
      productId: product ? String(product._id) : "",
      productName: product?.name ?? "(deleted product)",
      originalPrice: product?.price ?? 0,
      salePrice: d.flashPrice,
      stock: d.flashStock ?? 0,
      sold: d.soldCount ?? 0,
      saleEndsAt: new Date(d.saleEndsAt as Date).toISOString(),
      isActive: d.isActive ?? false,
    };
  });
}
