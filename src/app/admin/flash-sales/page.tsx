import {
  AdminFlashSalesClient,
  type AdminFlashRow,
  type FlashProductOption,
} from "@/components/admin/flash-sales-client";
import { getAllFlashSalesAdmin } from "@/server/services/flashSales";
import { getAllProductsAdmin } from "@/server/services/products";

export const metadata = { title: "Flash Sales | Kids Toy Castle Admin" };

export default async function AdminFlashSalesPage() {
  const [flash, products] = await Promise.all([
    getAllFlashSalesAdmin(),
    getAllProductsAdmin(),
  ]);
  const rows: AdminFlashRow[] = flash.map((f) => ({
    id: f.id,
    productId: f.productId,
    productName: f.productName,
    originalPrice: f.originalPrice,
    salePrice: f.salePrice,
    stock: f.stock,
    sold: f.sold,
    endTime: f.saleEndsAt,
    active: f.isActive,
  }));
  const options: FlashProductOption[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
  }));
  return <AdminFlashSalesClient initial={rows} products={options} />;
}
