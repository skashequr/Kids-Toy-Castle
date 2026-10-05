import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { FAQSection } from "@/components/home/faq-section";

export const metadata = { title: "FAQ" };

export default function FAQPage() {
  return (
    <>
      <Header />
      <main>
        <div className="bg-navy py-16 px-4 text-center">
          <p className="text-gold text-sm font-medium tracking-[0.2em] uppercase mb-3">Help Center</p>
          <h1 className="font-serif text-4xl font-bold text-ivory">Frequently Asked Questions</h1>
        </div>
        <FAQSection />
      </main>
      <Footer />
    </>
  );
}
