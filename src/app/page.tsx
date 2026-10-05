import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Hero, HomepageBanners } from "@/components/home/hero";
import { CategoriesGrid } from "@/components/home/categories-grid";
import { ToyHighlights } from "@/components/home/toy-highlights";
import { FlashSale } from "@/components/home/flash-sale";
import { ProductSection } from "@/components/home/product-section";
import { getProducts } from "@/server/services/products";
import { getActiveFlashSales } from "@/server/services/flashSales";
import { getCategoriesWithCounts } from "@/server/services/categories";
import { getActiveBanners } from "@/server/services/banners";
import { getStoreInformation } from "@/server/services/settings";
import { HOME_TITLE, HOME_DESCRIPTION, pageMetadata, homeStructuredData, serializeJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const store = await getStoreInformation();
  return pageMetadata(HOME_TITLE, HOME_DESCRIPTION.replaceAll("KidsToyCastle", store.storeName), "/", store);
}

export default async function HomePage() {
  const [categories, featured, arrivals, fallbackProducts, flashProducts, heroBanners, middleBanners, store] = await Promise.all([
    getCategoriesWithCounts(),
    getProducts({ isFeatured: true, limit: 4 }),
    getProducts({ isNew: true, limit: 4 }),
    getProducts({ limit: 4 }),
    getActiveFlashSales(),
    getActiveBanners("hero"),
    getActiveBanners("homepage-mid"),
    getStoreInformation(),
  ]);
  const featuredProducts = featured.length > 0 ? featured : fallbackProducts;
  const arrivalProducts = arrivals.length > 0 ? arrivals : fallbackProducts;
  const seoProducts = [...new Map([...featuredProducts, ...arrivalProducts].map((product) => [product.id, product])).values()];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(homeStructuredData(store, seoProducts, categories)) }} />
      <Header />
      <main>
        <Hero banners={heroBanners} />
        <CategoriesGrid categories={categories} />
        <HomepageBanners banners={middleBanners} />
        <FlashSale products={flashProducts} />
        {featuredProducts.length > 0 && <ProductSection title="ছোট্ট তারকার পছন্দ" accent="Featured toys" subtitle="খেলা, শেখা আর কল্পনার প্রতিটি মুহূর্তকে রঙিন করে তুলতে বেছে নেওয়া প্রিয় খেলনা।" products={featuredProducts} viewAllHref="/products" viewAllLabel="সব খেলনা দেখুন" />}
        <ToyHighlights />
        {arrivalProducts.length > 0 && <ProductSection title="নতুন এসেছে" accent="Fresh from the castle" subtitle="নতুন নতুন খেলনা এসেছে—ছোট্ট মানুষটির পরের প্রিয় জিনিসটি এখানেই হতে পারে।" products={arrivalProducts} viewAllHref="/new-arrivals" viewAllLabel="নতুন খেলনা দেখুন" />}
      </main>
      <Footer />
    </>
  );
}
