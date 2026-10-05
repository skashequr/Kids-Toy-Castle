import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProductDetailClient } from "@/components/product/product-detail-client";
import { getProductBySlug, getRelatedProducts } from "@/server/services/products";
import { getReviewsForProduct } from "@/server/services/reviews";
import { cache } from "react";
import { getStoreInformation } from "@/server/services/settings";
import { pageMetadata, seoDescription } from "@/lib/seo";

export const dynamic = "force-dynamic";
const getPageProduct = cache(getProductBySlug);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, store] = await Promise.all([getPageProduct(slug), getStoreInformation()]);
  if (!product) notFound();
  return pageMetadata(product.name, seoDescription(product.description) || `Shop ${product.name} at ${store.storeName}. Cash on Delivery across Bangladesh.`, `/product/${encodeURIComponent(product.slug)}`, store, product.images.find((image) => image.isPrimary)?.url || product.images[0]?.url);
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getPageProduct(slug);
  if (!product) notFound();

  const [related, reviews] = await Promise.all([
    getRelatedProducts(product.id, product.category.id, 4),
    getReviewsForProduct(product.id),
  ]);

  return (
    <>
      <Header />
      <main>
        <ProductDetailClient product={product} related={related} reviews={reviews} />
      </main>
      <Footer />
    </>
  );
}
