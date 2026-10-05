import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata = { title: "Shipping Policy" };

export default function ShippingPolicyPage() {
  return (
    <>
      <Header />
      <main>
        <div className="bg-navy py-12 px-4 text-center">
          <h1 className="font-serif text-4xl font-bold text-ivory">Shipping Policy</h1>
        </div>
        <div className="container mx-auto px-4 py-12 max-w-3xl space-y-8 text-sm text-muted leading-relaxed">
          <div>
            <h2 className="font-serif text-xl font-bold text-navy dark:text-ivory mb-3">Delivery Timeframes</h2>
            <div className="space-y-3">
              {[
                { label: "Dhaka City (Same Day)", time: "Ordered before 12pm — delivered same day", cost: "৳60" },
                { label: "Dhaka City (Regular)", time: "1–2 business days", cost: "৳80" },
                { label: "Outside Dhaka (Divisional Cities)", time: "2–3 business days", cost: "৳120" },
                { label: "Outside Dhaka (Upazilas)", time: "3–5 business days", cost: "৳150" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between p-4 rounded-xl bg-ivory-dark dark:bg-navy-light">
                  <div>
                    <p className="font-medium text-navy dark:text-ivory">{row.label}</p>
                    <p className="text-xs">{row.time}</p>
                  </div>
                  <span className="font-bold text-gold">{row.cost}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-navy dark:text-ivory mb-2">Free Shipping</h2>
            <p>All orders above <strong className="text-gold">৳2,000</strong> qualify for free shipping across Bangladesh.</p>
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-navy dark:text-ivory mb-2">Courier Partners</h2>
            <p>We ship with Steadfast Courier, Pathao Courier, RedX, and Sundarban Courier. You'll receive a tracking number via SMS once your order ships.</p>
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-navy dark:text-ivory mb-2">Order Processing</h2>
            <p>Orders are processed within 12-24 hours on business days (Saturday–Thursday). Orders placed on Friday or public holidays are processed on the next business day.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
