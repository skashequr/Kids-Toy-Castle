"use client";

import { useState } from "react";
import { Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isValidEmail } from "@/lib/utils";
import { subscribeNewsletter } from "@/server/actions/newsletter";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    const res = await subscribeNewsletter(email);
    if (res.ok) {
      setSubmitted(true);
    } else {
      setError(res.error ?? "Subscription failed. Try again.");
    }
  };

  return (
    <section className="py-16 lg:py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-light to-navy" />
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full border border-gold" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full border border-gold" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 mb-5">
            <div className="h-px w-12 bg-gold" />
            <span className="text-gold text-sm font-medium tracking-[0.2em] uppercase">Newsletter</span>
            <div className="h-px w-12 bg-gold" />
          </div>
          <h2 className="font-serif text-3xl lg:text-4xl font-bold text-ivory mb-4">
            Join the Luxen Inner Circle
          </h2>
          <p className="text-ivory/60 text-base mb-8 leading-relaxed">
            Get exclusive access to new arrivals, flash sales, and style inspiration. Plus, enjoy{" "}
            <span className="text-gold font-semibold">10% off</span> your first order.
          </p>

          {submitted ? (
            <div className="flex items-center justify-center gap-3 text-ivory">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <span className="text-lg font-medium">Thank you! Check your inbox for your discount code.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <div className="flex-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className={`w-full h-12 px-5 rounded-xl border ${
                    error ? "border-red-400" : "border-ivory/20"
                  } bg-white/10 text-ivory placeholder-ivory/40 focus:outline-none focus:border-gold transition-colors`}
                />
                {error && <p className="text-red-400 text-xs mt-1 text-left">{error}</p>}
              </div>
              <Button variant="gold" size="md" type="submit" rightIcon={<Send className="w-4 h-4" />}>
                Subscribe
              </Button>
            </form>
          )}

          <p className="text-ivory/30 text-xs mt-4">
            No spam, ever. Unsubscribe anytime. By subscribing you agree to our Privacy Policy.
          </p>

          <div className="flex items-center justify-center gap-8 mt-8">
            {["5,000+ Subscribers", "Weekly Style Tips", "Exclusive Offers"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                <span className="text-ivory/60 text-xs">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
