import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  return (
    <>
      <Header />
      <main>
        <div className="bg-navy py-12 px-4 text-center">
          <h1 className="font-serif text-4xl font-bold text-ivory">Terms & Conditions</h1>
          <p className="text-ivory/60 mt-2 text-sm">Last updated: June 6, 2026</p>
        </div>
        <div className="container mx-auto px-4 py-12 max-w-3xl space-y-8 text-sm text-muted leading-relaxed">
          {[
            { title: "1. Acceptance of Terms", body: "By accessing and using luxen.com.bd, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our website." },
            { title: "2. Products and Pricing", body: "All products are subject to availability. Prices are displayed in Bangladeshi Taka (BDT) and are subject to change without notice. We reserve the right to limit quantities." },
            { title: "3. Orders and Payment", body: "By placing an order, you confirm that you are authorized to use the payment method provided. We reserve the right to refuse or cancel any order at our discretion." },
            { title: "4. Intellectual Property", body: "All content on this website, including images, text, logos, and graphics, is the property of Luxen Bangladesh and is protected by applicable copyright laws." },
            { title: "5. Limitation of Liability", body: "Luxen Bangladesh shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our products or services." },
            { title: "6. Governing Law", body: "These Terms shall be governed by and construed in accordance with the laws of Bangladesh. Any disputes shall be subject to the exclusive jurisdiction of the courts of Dhaka, Bangladesh." },
          ].map(({ title, body }) => (
            <div key={title}>
              <h2 className="font-serif text-xl font-bold text-navy dark:text-ivory mb-2">{title}</h2>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
