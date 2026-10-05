import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata = { title: "Return Policy" };

export default function ReturnPolicyPage() {
  return (
    <>
      <Header />
      <main>
        <div className="bg-navy py-12 px-4 text-center">
          <h1 className="font-serif text-4xl font-bold text-ivory">Return Policy</h1>
          <p className="text-ivory/60 mt-2 text-sm">We want you to love every purchase</p>
        </div>
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <div className="grid sm:grid-cols-3 gap-6 mb-10">
            {[
              { icon: "📦", title: "7-Day Returns", desc: "Return within 7 days of delivery" },
              { icon: "🚪", title: "Free Pickup", desc: "We collect from your doorstep" },
              { icon: "💰", title: "Full Refund", desc: "100% refund on eligible items" },
            ].map((item) => (
              <div key={item.title} className="text-center p-5 rounded-2xl bg-ivory-dark dark:bg-navy-light">
                <span className="text-3xl block mb-2">{item.icon}</span>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-muted text-xs">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="space-y-6 text-sm text-muted leading-relaxed">
            <div>
              <h2 className="font-serif text-xl font-bold text-navy dark:text-ivory mb-2">Eligibility</h2>
              <p>Items must be returned within 7 days of delivery. Products must be unused, in original condition, with all tags attached and original packaging intact.</p>
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-navy dark:text-ivory mb-2">Non-Returnable Items</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Cosmetics and skincare products once opened</li>
                <li>Perfumes once used</li>
                <li>Items marked as "Final Sale"</li>
                <li>Gift cards</li>
              </ul>
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-navy dark:text-ivory mb-2">How to Initiate a Return</h2>
              <ol className="list-decimal list-inside space-y-2">
                <li>Contact us at returns@luxen.com.bd or call 01700-000000</li>
                <li>Provide your order number and reason for return</li>
                <li>Our team will schedule a free pickup within 24 hours</li>
                <li>Once received and inspected, your refund will be processed within 3-5 business days</li>
              </ol>
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-navy dark:text-ivory mb-2">Refund Methods</h2>
              <p>Refunds will be issued via the original payment method. Cash on Delivery orders will be refunded via bKash/Nagad to the number associated with the order.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
