import { AdminInventoryClient } from "@/components/admin/inventory-client";
import { getAllProductsAdmin } from "@/server/services/products";

export const metadata = { title: "Inventory | Kids Toy Castle Admin" };

export default async function AdminInventoryPage() {
  const products = await getAllProductsAdmin();
  return <AdminInventoryClient products={products} />;
}
