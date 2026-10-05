import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";
import { getProductById } from "@/server/services/products";
import { getAllCategoriesAdmin } from "@/server/services/categories";

export const metadata = { title: "Edit Product | Luxen Admin" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductById(id),
    getAllCategoriesAdmin(),
  ]);

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-muted mb-4">Product not found.</p>
        <Link
          href="/admin/products"
          className="flex items-center gap-2 justify-center text-gold hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </Link>
      </div>
    );
  }

  return <ProductForm product={product} categories={categories} />;
}
