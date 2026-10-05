import { WHY_LUXEN } from "@/lib/data";

export function WhyLuxen() {
  return (
    <section className="py-16 lg:py-24 bg-navy">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="h-px w-12 bg-gold" />
            <span className="text-gold text-sm font-medium tracking-[0.2em] uppercase">Why Choose Us</span>
            <div className="h-px w-12 bg-gold" />
          </div>
          <h2 className="font-serif text-3xl lg:text-4xl font-bold text-ivory">
            The Luxen Promise
          </h2>
          <p className="text-ivory/60 text-base mt-3 max-w-xl mx-auto">
            We're committed to delivering the finest luxury experience, from product quality to your doorstep.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {WHY_LUXEN.map((item, i) => (
            <div
              key={i}
              className="group text-center p-6 rounded-2xl border border-ivory/10 hover:border-gold/40 hover:bg-gold/5 transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-5 group-hover:bg-gold/20 transition-colors">
                <span className="text-2xl">{item.icon}</span>
              </div>
              <h3 className="font-semibold text-ivory mb-2">{item.title}</h3>
              <p className="text-ivory/50 text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
