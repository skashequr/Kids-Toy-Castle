"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Phone, Mail, MapPin, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isValidEmail } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";
import { submitContact } from "@/server/actions/contact";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(form.email)) { toast.error("Please enter a valid email."); return; }
    setLoading(true);
    const res = await submitContact(form);
    setLoading(false);
    if (res.ok) {
      toast.success("Message sent! We'll respond within 24 hours.");
      setForm({ name: "", email: "", subject: "", message: "" });
    } else {
      toast.error(res.error ?? "Could not send message.");
    }
  };

  return (
    <>
      <Header />
      <main>
        <div className="bg-navy py-16 px-4 text-center">
          <p className="text-gold text-sm font-medium tracking-[0.2em] uppercase mb-3">Get in Touch</p>
          <h1 className="font-serif text-4xl font-bold text-ivory">Contact Us</h1>
          <p className="text-ivory/60 mt-3 max-w-md mx-auto text-sm">We're here to help with any questions about orders, products, or partnerships.</p>
        </div>

        <section className="container mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Info */}
            <div>
              <h2 className="font-serif text-2xl font-bold mb-6">Get in Touch</h2>
              <div className="space-y-6">
                {[
                  { icon: Phone, label: "Phone", value: "+880 1700-000000", sub: "Sat–Thu, 9am–8pm" },
                  { icon: Mail, label: "Email", value: "hello@luxen.com.bd", sub: "We reply within 24 hours" },
                  { icon: MapPin, label: "Address", value: "House 42, Road 11, Banani", sub: "Dhaka 1213, Bangladesh" },
                  { icon: Clock, label: "Business Hours", value: "Saturday – Thursday", sub: "9:00 AM – 8:00 PM" },
                ].map(({ icon: Icon, label, value, sub }) => (
                  <div key={label} className="flex items-start gap-4 p-5 rounded-2xl bg-ivory-dark dark:bg-navy-light">
                    <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{label}</p>
                      <p className="text-sm">{value}</p>
                      <p className="text-xs text-muted">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="bg-ivory-dark dark:bg-navy-light rounded-2xl p-6">
              <h2 className="font-serif text-2xl font-bold mb-6">Send a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Your Name</label>
                    <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Rahim Ahmed" required
                      className="w-full h-11 px-4 rounded-xl border border-navy/20 dark:border-ivory/20 bg-ivory dark:bg-navy text-sm focus:outline-none focus:border-gold transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Email Address</label>
                    <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="rahim@email.com" required
                      className="w-full h-11 px-4 rounded-xl border border-navy/20 dark:border-ivory/20 bg-ivory dark:bg-navy text-sm focus:outline-none focus:border-gold transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Subject</label>
                  <input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    placeholder="Order enquiry / Product question / Partnership"
                    className="w-full h-11 px-4 rounded-xl border border-navy/20 dark:border-ivory/20 bg-ivory dark:bg-navy text-sm focus:outline-none focus:border-gold transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Message</label>
                  <textarea value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Tell us how we can help..." rows={5} required
                    className="w-full px-4 py-3 rounded-xl border border-navy/20 dark:border-ivory/20 bg-ivory dark:bg-navy text-sm focus:outline-none focus:border-gold transition-colors resize-none" />
                </div>
                <Button variant="gold" size="lg" fullWidth isLoading={loading} type="submit" rightIcon={<Send className="w-4 h-4" />}>
                  Send Message
                </Button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
