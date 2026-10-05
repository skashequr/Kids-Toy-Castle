import { requireAdmin } from "../guard";
import { connectDB } from "../db/connect";
import { FinanceEntry } from "../models/FinanceEntry";
import { Order } from "../models/Order";
import { dhakaDate } from "@/lib/order-date-range";
import { allocateRevenue, type FinanceData } from "@/lib/finance";
import { Product } from "../models/Product";
import { ProductCost } from "../models/ProductCost";

export async function getFinanceData(): Promise<FinanceData> {
  await requireAdmin();
  await connectDB();
  const [entries, orders, products, costs] = await Promise.all([
    FinanceEntry.find({}).sort({ date: -1, createdAt: -1 }).lean(),
    Order.find({ status: "delivered" }).select("orderNumber total shipping items deliveredAt createdAt paymentStatus").sort({ createdAt: -1 }).lean(),
    Product.find({}).select("name price variants").sort({ name: 1 }).lean(),
    ProductCost.find({}).sort({ effectiveFrom: -1 }).lean(),
  ]);
  return {
    products: products.map((p) => ({ id: String(p._id), name: p.name, priceCents: Math.round(p.price * 100), variants: p.variants.map((v) => ({ id: String(v._id), name: v.name || [v.color, v.size, v.sku].filter(Boolean).join(" / ") })) })),
    costs: costs.map((c) => ({ productId: c.productId, variantId: c.variantId, effectiveFrom: c.effectiveFrom, unitCostCents: c.unitCostCents })),
    entries: entries.map((e) => ({
      id: String(e._id), date: e.date, type: e.type as "income" | "expense", category: e.category,
      amountCents: e.amountCents, description: e.description, reference: e.reference,
      voided: e.voided, voidReason: e.voidReason, createdBy: e.createdBy, updatedAt: e.updatedAt.toISOString(),
      productId: e.productId || "",
    })),
    sales: orders.map((o) => {
      const amounts = allocateRevenue(o.items.map((i) => Math.round(i.price * 100) * i.quantity), Math.round((o.total - (o.shipping || 0)) * 100));
      return ({
      id: String(o._id), orderNumber: o.orderNumber, date: dhakaDate(o.deliveredAt ?? o.createdAt),
      amountCents: Math.round(o.total * 100), paymentStatus: o.paymentStatus,
      estimatedDate: !o.deliveredAt,
      lines: o.items.map((i, index) => ({ productId: i.productId ? String(i.productId) : "", variantId: i.variantId || "", name: i.name, quantity: i.quantity, revenueCents: amounts[index] })),
    }); }),
  };
}
