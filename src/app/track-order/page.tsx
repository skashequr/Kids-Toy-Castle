"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Search, Package, Truck, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDate } from "@/lib/utils";
import { trackOrder, type TrackedOrder } from "@/server/actions/orders";

const TRACKING_STEPS = [
  { id: "pending", label: "Order Placed", icon: Package },
  { id: "confirmed", label: "Confirmed", icon: CheckCircle },
  { id: "shipped", label: "Shipped", icon: Truck },
  { id: "delivered", label: "Delivered", icon: CheckCircle },
];

// Maps an order status to how far along the 4-step tracker it is.
const STATUS_STEP: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  processing: 1,
  shipped: 2,
  delivered: 3,
  returned: 3,
  cancelled: 0,
};

export default function TrackOrderPage() {
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [result, setResult] = useState<null | "found" | "not_found">(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    const res = await trackOrder(query);
    setLoading(false);
    if (res.ok && res.order) {
      setOrder(res.order);
      setResult("found");
    } else {
      setOrder(null);
      setResult("not_found");
    }
  };

  const currentStep = order ? STATUS_STEP[order.status] ?? 0 : 0;
  const progressWidth = `${(currentStep / (TRACKING_STEPS.length - 1)) * 100}%`;

  return (
    <>
      <Header />
      <main>
        <div className="bg-navy py-16 px-4 text-center">
          <p className="text-gold text-sm font-medium tracking-[0.2em] uppercase mb-3">Order Tracking</p>
          <h1 className="font-serif text-4xl font-bold text-ivory">Track Your Order</h1>
          <p className="text-ivory/60 mt-3 text-sm">Enter your order ID to check status</p>
        </div>

        <section className="container mx-auto px-4 py-16 max-w-2xl">
          <form onSubmit={handleTrack} className="flex gap-3 mb-10">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setResult(null); }}
                placeholder="Enter Order ID (e.g., LXN-ABC123)"
                className="w-full h-12 pl-12 pr-4 rounded-xl border border-navy/20 dark:border-ivory/20 bg-ivory dark:bg-navy focus:outline-none focus:border-gold text-sm transition-colors"
              />
            </div>
            <Button variant="gold" size="md" type="submit" isLoading={loading}>Track</Button>
          </form>

          {result === "found" && order && (
            <div className="bg-ivory-dark dark:bg-navy-light rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="font-mono font-bold text-lg">{order.orderNumber}</p>
                  <p className="text-muted text-sm">
                    Placed {formatDate(order.createdAt)} · {formatPrice(order.total)}
                    {order.courier ? ` · ${order.courier}` : ""}
                  </p>
                </div>
                <span className="badge-new text-sm px-4 py-1.5 capitalize">{order.status}</span>
              </div>

              {/* Progress */}
              <div className="relative">
                <div className="absolute top-5 left-5 right-5 h-0.5 bg-navy/10 dark:bg-ivory/10" />
                <div className="absolute top-5 left-5 h-0.5 bg-gold transition-all" style={{ width: progressWidth }} />
                <div className="relative flex justify-between">
                  {TRACKING_STEPS.map((step, i) => {
                    const done = i <= currentStep;
                    return (
                      <div key={step.id} className="flex flex-col items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${done ? "bg-gold text-navy" : "bg-navy/10 dark:bg-ivory/10 text-muted"}`}>
                          <step.icon className="w-5 h-5" />
                        </div>
                        <span className={`text-xs font-medium ${done ? "text-navy dark:text-ivory" : "text-muted"}`}>{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {order.estimatedDelivery && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-sm">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">Estimated Delivery: {formatDate(order.estimatedDelivery)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {result === "not_found" && (
            <div className="text-center py-10 bg-ivory-dark dark:bg-navy-light rounded-2xl">
              <p className="text-4xl mb-3">🔍</p>
              <h3 className="font-semibold mb-2">Order Not Found</h3>
              <p className="text-muted text-sm">We couldn&apos;t find an order with that ID. Please check and try again, or <a href="/contact" className="text-gold hover:underline">contact us</a>.</p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
