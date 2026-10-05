import { AdminProductsClient } from "@/components/admin/products-client";
import { getAllProductsAdmin } from "@/server/services/products";
import { getAllCategoriesAdmin } from "@/server/services/categories";

export const metadata = { title: "Products | Kids Toy Castle Admin" };

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    getAllProductsAdmin(),
    getAllCategoriesAdmin(),
  ]);
  // A saved reorder changes this key, so router.refresh() mounts the table
  // with the exact sequence returned from the database.
  const orderKey = products.map((product) => product.id).join(":");
  return <AdminProductsClient key={orderKey} products={products} categories={categories} />;
}
