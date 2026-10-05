import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProductListingClient } from "@/components/product/product-listing-client";
import { getProducts } from "@/server/services/products";

export const metadata = { title: "Best Sellers" };
export const dynamic = "force-dynamic";

export default async function BestSellersPage() {
  const top = await getProducts({ isBestSeller: true });
  const bestSellers = top.length > 0 ? top : await getProducts();
  return (
    <>
      <Header />
      <main>
        <div className="bg-navy py-12 px-4 text-center">
          <p className="text-gold text-sm font-medium tracking-[0.2em] uppercase mb-2">Most Loved</p>
          <h1 className="font-serif text-4xl font-bold text-ivory">Best Sellers</h1>
        </div>
        <ProductListingClient initialProducts={bestSellers} />
      </main>
      <Footer />
    </>
  );
}
