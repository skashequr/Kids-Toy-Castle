import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProductListingClient } from "@/components/product/product-listing-client";
import { getProducts } from "@/server/services/products";
import { getStoreInformation } from "@/server/services/settings";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return pageMetadata("New Arrivals", "Discover new kids toys, play tents and baby play products. Cash on Delivery across Bangladesh.", "/new-arrivals", await getStoreInformation());
}
export const dynamic = "force-dynamic";

export default async function NewArrivalsPage() {
  const newArrivals = await getProducts({ isNew: true });
  const products = newArrivals.length > 0 ? newArrivals : await getProducts();
  return (
    <>
      <Header />
      <main>
        <div className="relative overflow-hidden bg-[#e4f5ff] px-4 py-12 text-center sm:py-16">
          <div className="absolute -left-8 bottom-0 h-28 w-28 rounded-t-full bg-[#fff0bf]" />
          <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full border-[18px] border-[#ffb9d4]/45" />
          <div className="relative">
            <p className="mb-2 text-xs font-bold uppercase tracking-[.2em] text-[#ef6197]">নতুন এসেছে</p>
            <h1 className="font-serif text-4xl font-bold text-[#1b588b]">নতুন খেলনা</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#57758b]">ছোট্ট সোনামণিদের জন্য নতুন, আনন্দময় ও যত্নে বাছাই করা খেলনা।</p>
          </div>
        </div>
        <ProductListingClient initialProducts={products} />
      </main>
      <Footer />
    </>
  );
}
