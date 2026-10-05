import { ProductForm } from "@/components/admin/product-form";
import { getAllCategoriesAdmin } from "@/server/services/categories";

export const metadata = { title: "Add Product | Luxen Admin" };

export default async function NewProductPage() {
  const categories = await getAllCategoriesAdmin();
  return <ProductForm categories={categories} />;
}
