export type AnalyticsEventType = "page_view" | "product_view" | "add_to_cart" | "checkout_started";

type AnalyticsEventPayload = {
  path?: string;
  productId?: string;
  productName?: string;
  value?: number;
  quantity?: number;
};

type ExternalEvent = { google: string; meta: string; data: Record<string, unknown> };
const googleQueue: ExternalEvent[] = [];
const pixelQueue: ExternalEvent[] = [];

function sendExternal(event: ExternalEvent) {
  if (typeof window === "undefined" || window.location.pathname.startsWith("/admin")) return;
  if (window.gtag) window.gtag("event", event.google, event.data);
  else if (googleQueue.length < 100) googleQueue.push(event);
  if (window.fbq) window.fbq("track", event.meta, event.data);
  else if (pixelQueue.length < 100) pixelQueue.push(event);
}

export function flushTrackingEvents(provider: "google" | "meta") {
  if (typeof window === "undefined") return;
  if (provider === "google" && window.gtag) {
    for (const event of googleQueue.splice(0)) window.gtag("event", event.google, event.data);
  }
  if (provider === "meta" && window.fbq) {
    for (const event of pixelQueue.splice(0)) window.fbq("track", event.meta, event.data);
  }
}

export function trackPurchase(orderNumber: string, value: number, items: Array<{ id: string; quantity: number; price: number }>) {
  if (!Number.isFinite(value) || value < 0) return;
  sendExternal({ google: "purchase", meta: "Purchase", data: {
    transaction_id: orderNumber, value, currency: "BDT", content_type: "product",
    content_ids: items.map((item) => item.id),
    contents: items.map((item) => ({ id: item.id, quantity: item.quantity, item_price: item.price })),
    items: items.map((item) => ({ item_id: item.id, quantity: item.quantity, price: item.price })),
    num_items: items.reduce((sum, item) => sum + item.quantity, 0),
  } });
}

const SESSION_KEY = "kids-toy-castle-analytics-session";

function getSessionId() {
  if (typeof window === "undefined") return "";
  let stored: string | null = null;
  try { stored = window.localStorage.getItem(SESSION_KEY); } catch { /* Storage may be blocked. */ }
  if (stored) return stored;

  const id = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  try { window.localStorage.setItem(SESSION_KEY, id); } catch { /* Analytics must not block checkout. */ }
  return id;
}

/** Sends anonymous storefront events without blocking the shopper's action. */
export function trackAnalyticsEvent(type: AnalyticsEventType, payload: AnalyticsEventPayload = {}) {
  if (typeof window === "undefined") return;

  if (type !== "page_view") {
    const externalEvents: Record<Exclude<AnalyticsEventType, "page_view">, { google: string; meta: string }> = {
      product_view: { google: "view_item", meta: "ViewContent" },
      add_to_cart: { google: "add_to_cart", meta: "AddToCart" },
      checkout_started: { google: "begin_checkout", meta: "InitiateCheckout" },
    };
    const event = externalEvents[type];
    const eventData = {
      content_ids: payload.productId ? [payload.productId] : undefined,
      content_name: payload.productName,
      items: payload.productId ? [{ item_id: payload.productId, item_name: payload.productName }] : undefined,
      content_type: payload.productId ? "product" : undefined,
      value: payload.value,
      currency: payload.value !== undefined ? "BDT" : undefined,
      num_items: payload.quantity,
    };
    sendExternal({ ...event, data: eventData });
  }

  const body = JSON.stringify({
    type,
    sessionId: getSessionId(),
    path: payload.path ?? window.location.pathname,
    productId: payload.productId,
    productName: payload.productName,
  });

  if (navigator.sendBeacon) {
    try {
      if (navigator.sendBeacon("/api/analytics/events", new Blob([body], { type: "application/json" }))) return;
    } catch { /* Fall back to fetch. */ }
  }

  void fetch("/api/analytics/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}
