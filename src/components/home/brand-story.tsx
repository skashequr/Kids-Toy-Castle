import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function BrandStory() {
  return (
    <section className="py-16 lg:py-24 bg-ivory-dark dark:bg-navy-light/20">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="h-px w-10 bg-gold" />
              <span className="text-gold text-xs font-semibold tracking-[0.2em] uppercase">Our Story</span>
            </div>
            <h2 className="font-serif text-3xl lg:text-4xl font-bold mb-6 leading-tight">
              Born in Bangladesh,<br />
              <span className="text-gold-gradient">Crafted for the World</span>
            </h2>
            <p className="text-muted text-base leading-relaxed mb-4">
              Luxen was founded with a singular vision: to bring world-class luxury lifestyle products to Bangladesh without compromise. We believe every Bangladeshi deserves access to the finest watches, accessories, and fragrances.
            </p>
            <p className="text-muted text-base leading-relaxed mb-8">
              Our team of expert curators travels the world sourcing only the most premium, authentic products. Every item in our collection meets our strict quality standards — because you deserve nothing less than the best.
            </p>

            <div className="grid grid-cols-3 gap-6 mb-8">
              {[
                { number: "50K+", label: "Happy Customers" },
                { number: "500+", label: "Premium Products" },
                { number: "4.8★", label: "Average Rating" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="font-serif text-2xl lg:text-3xl font-bold text-gold">{stat.number}</div>
                  <div className="text-xs text-muted mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            <Link
              href="/about"
              className="inline-flex items-center gap-2 px-6 py-3 bg-navy dark:bg-gold text-ivory dark:text-navy rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              Read Our Full Story <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="relative aspect-square max-w-md mx-auto">
              {/* Main circle */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-navy to-navy-light flex items-center justify-center">
                <div className="text-center">
                  <div className="font-serif text-6xl font-bold text-gold mb-2">L</div>
                  <div className="text-ivory/60 text-sm tracking-[0.3em] uppercase">Since 2020</div>
                </div>
              </div>
              {/* Orbiting elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center">
                <span className="text-3xl">⌚</span>
              </div>
              <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-2xl bg-navy border border-gold/30 flex items-center justify-center">
                <span className="text-2xl">👜</span>
              </div>
              <div className="absolute top-1/2 -right-8 w-16 h-16 rounded-full bg-ivory-dark dark:bg-navy-light border border-gold/20 flex items-center justify-center">
                <span className="text-xl">🌸</span>
              </div>
              {/* Ring */}
              <div className="absolute inset-4 rounded-full border-2 border-dashed border-gold/20" />
              <div className="absolute -inset-4 rounded-full border border-gold/10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
