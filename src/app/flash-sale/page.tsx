import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { FlashSale } from "@/components/home/flash-sale";
import { getActiveFlashSales } from "@/server/services/flashSales";
import { getStoreInformation } from "@/server/services/settings";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return pageMetadata("Flash Sale", "Explore current offers on kids toys and baby play products. Cash on Delivery across Bangladesh.", "/flash-sale", await getStoreInformation());
}
export const dynamic = "force-dynamic";

export default async function FlashSalePage() {
  const flashSales = await getActiveFlashSales();
  return (
    <>
      <Header />
      <main>
        <div className="relative overflow-hidden bg-[#fff0c5] px-4 py-12 text-center sm:py-16">
          <div className="absolute -left-10 -top-12 h-40 w-40 rounded-full bg-[#ffb5d2]/50" />
          <div className="absolute -bottom-14 -right-8 h-36 w-36 rounded-full bg-[#bfeaff]" />
          <div className="relative">
            <p className="mb-2 text-xs font-bold uppercase tracking-[.2em] text-[#e8528c]">⚡ সীমিত সময়ের অফার</p>
            <h1 className="font-serif text-4xl font-bold text-[#1b588b]">Flash Sale</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#57758b]">পছন্দের খেলনায় বিশেষ দাম—সময় শেষ হওয়ার আগেই অর্ডার করুন।</p>
          </div>
        </div>
        <FlashSale products={flashSales} />
      </main>
      <Footer />
    </>
  );
}
