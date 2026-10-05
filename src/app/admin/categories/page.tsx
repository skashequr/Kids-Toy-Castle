import { AdminCategoriesClient } from "@/components/admin/categories-client";
import { getCategoriesWithCounts } from "@/server/services/categories";

export const metadata = { title: "Categories | Luxen Admin" };

export default async function AdminCategoriesPage() {
  const categories = await getCategoriesWithCounts();
  return <AdminCategoriesClient categories={categories} />;
}
