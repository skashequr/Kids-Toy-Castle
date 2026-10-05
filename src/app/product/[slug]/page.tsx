import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProductDetailClient } from "@/components/product/product-detail-client";
import { getProductBySlug, getRelatedProducts } from "@/server/services/products";
import { getReviewsForProduct } from "@/server/services/reviews";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
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
