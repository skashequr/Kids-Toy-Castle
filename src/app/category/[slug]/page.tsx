import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProductListingClient } from "@/components/product/product-listing-client";
import { getCategoryBySlug } from "@/server/services/categories";
import {
  getProductsByCategorySlug,
  getProductsByCategorySlugs,
} from "@/server/services/products";
import { CATEGORY_GROUPS } from "@/lib/data";
import type { Category } from "@/types";
import { RichTextContent } from "@/components/ui/rich-text";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // A real category, or a nav "group" (e.g. /category/fashion) that spans several.
  const category = await getCategoryBySlug(slug);
  const group = CATEGORY_GROUPS[slug];

  if (!category && !group) notFound();

  const products = category
    ? await getProductsByCategorySlug(slug)
    : await getProductsByCategorySlugs(group!.slugs);

  const title = category ? category.name : group!.name;
  const description = category ? category.description : group!.description;
  const listingCategory: Category = category ?? {
    id: "",
    name: group!.name,
    slug,
    image: "",
    description: group!.description,
  };

  return (
    <>
      <Header />
      <main>
        <div className="bg-navy py-12 px-4">
          <div className="container mx-auto text-center">
            <p className="text-gold text-sm font-medium tracking-[0.2em] uppercase mb-2">
              {products.length} Products
            </p>
            <h1 className="font-serif text-3xl lg:text-5xl font-bold text-ivory">{title}</h1>
            {description && (
              <RichTextContent
                value={description}
                className="mx-auto mt-3 max-w-2xl text-sm text-ivory/75 [&_h2]:text-xl [&_h3]:text-base"
              />
            )}
          </div>
        </div>
        <ProductListingClient initialProducts={products} category={listingCategory} />
      </main>
      <Footer />
    </>
  );
}
