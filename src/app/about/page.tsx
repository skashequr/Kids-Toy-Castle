import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Newsletter } from "@/components/home/newsletter";

export const metadata = { title: "About Us" };

export default function AboutPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <div className="bg-navy py-20 px-4 text-center">
          <p className="text-gold text-sm font-medium tracking-[0.2em] uppercase mb-3">Our Story</p>
          <h1 className="font-serif text-4xl lg:text-6xl font-bold text-ivory">About Luxen</h1>
        </div>

        {/* Story */}
        <section className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="font-serif text-3xl font-bold mb-5">Born in Dhaka, Made for the World</h2>
              <p className="text-muted leading-relaxed mb-4">
                Founded in 2020 in the heart of Dhaka, Bangladesh, Luxen set out to redefine what luxury means for modern Bangladeshis. We believed that everyone deserves access to premium, authentic lifestyle products without compromise.
              </p>
              <p className="text-muted leading-relaxed mb-4">
                Our team of passionate curators traveled across the globe — from the watch workshops of Switzerland to the leather ateliers of Italy — to bring you the finest collection of watches, wallets, bags, perfumes, and fashion accessories.
              </p>
              <p className="text-muted leading-relaxed">
                Today, with over 50,000 happy customers and a curated collection of 500+ premium products, Luxen stands as Bangladesh's most trusted luxury lifestyle brand.
              </p>
            </div>
            <div className="relative aspect-square max-w-sm mx-auto">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-navy to-navy-light" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="font-serif text-8xl font-bold text-gold mb-2 opacity-20">L</div>
                  <div className="font-serif text-4xl font-bold text-ivory">LUXEN</div>
                  <div className="text-gold text-xs tracking-[0.3em] uppercase mt-1">Est. 2020</div>
                </div>
              </div>
            </div>
          </div>

          {/* Values */}
          <h2 className="font-serif text-3xl font-bold text-center mb-10">Our Core Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
            {[
              { icon: "💎", title: "Authenticity", desc: "Every product we sell is 100% genuine. We have zero tolerance for counterfeits." },
              { icon: "🌟", title: "Excellence", desc: "We don't just sell products — we curate experiences that exceed expectations." },
              { icon: "🤝", title: "Trust", desc: "Built on transparency, honest pricing, and customer-first service every day." },
            ].map((v) => (
              <div key={v.title} className="text-center p-6 rounded-2xl bg-ivory-dark dark:bg-navy-light">
                <span className="text-4xl block mb-4">{v.icon}</span>
                <h3 className="font-bold text-lg mb-2">{v.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="bg-navy rounded-3xl p-10 text-center">
            <h2 className="font-serif text-2xl font-bold text-ivory mb-8">Luxen by the Numbers</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[
                { number: "50K+", label: "Happy Customers" },
                { number: "500+", label: "Premium Products" },
                { number: "4.8★", label: "Average Rating" },
                { number: "2020", label: "Founded" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="font-serif text-3xl font-bold text-gold mb-1">{s.number}</div>
                  <div className="text-ivory/60 text-sm">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Newsletter />
      </main>
      <Footer />
    </>
  );
}
