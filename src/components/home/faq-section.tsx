"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FAQ_ITEMS } from "@/lib/data";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="h-px w-12 bg-gold" />
              <span className="text-gold text-sm font-medium tracking-[0.2em] uppercase">FAQ</span>
              <div className="h-px w-12 bg-gold" />
            </div>
            <h2 className="font-serif text-3xl lg:text-4xl font-bold">Frequently Asked Questions</h2>
            <p className="text-muted text-sm mt-3">Can't find what you're looking for? <Link href="/contact" className="text-gold hover:underline">Contact us</Link></p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <div
                key={i}
                className={cn(
                  "border rounded-2xl overflow-hidden transition-all duration-300",
                  openIndex === i
                    ? "border-gold/40 bg-gold/5 dark:bg-gold/5"
                    : "border-navy/10 dark:border-ivory/10"
                )}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >
                  <span className="font-medium pr-4">{item.question}</span>
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 text-gold flex-shrink-0 transition-transform duration-300",
                      openIndex === i ? "rotate-180" : ""
                    )}
                  />
                </button>
                {openIndex === i && (
                  <div className="px-6 pb-5 text-sm text-muted leading-relaxed animate-fadeIn">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
