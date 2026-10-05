/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { JSDOM } = require("jsdom");

function load(path, mocks = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(source, { exports, console, require: (name) => mocks[name] ?? require(name) });
  return exports;
}

const utils = load("src/lib/utils.ts");
const validation = load("src/lib/checkout-validation.ts", { "@/lib/utils": utils });
const contact = { fullName: "Test Customer", phone: "01712345678", address: "House 1, Road 2" };
assert.equal(Object.keys(validation.validateCheckoutContact(contact)).length, 0);
assert.equal(Object.keys(validation.validateCheckoutContact({ ...contact, email: " ", city: "", area: "", district: "" })).length, 0);
assert.ok(validation.validateCheckoutContact({ ...contact, email: "invalid" }).email);
for (const key of ["fullName", "phone", "address"]) assert.ok(validation.validateCheckoutContact({ ...contact, [key]: "" })[key]);

let persistOptions;
const cart = load("src/store/cart.ts", {
  "zustand/middleware": { persist: (creator, options) => { persistOptions = options; return creator; } },
  "@/lib/analytics-client": { trackAnalyticsEvent: () => {} },
}).useCartStore;
const product = { id: "123456789012345678901234", name: "Test Toy", slug: "test-toy", price: 1900, stock: 10, images: [] };
const item = { id: "test-item", product, price: 1900, quantity: 1 };
const restored = persistOptions.merge({ items: [item], giftWrap: true, total: 2070 }, cart.getState());
assert.equal(restored.giftWrap, false);
assert.equal(restored.total, 2020, "Legacy gift wrap must not add 50");
cart.setState(restored);
cart.getState().applyCoupon({ code: "SAVE100", type: "fixed", value: 100 });
assert.equal(cart.getState().total, 1920);
cart.getState().updateQuantity(item.id, 2);
assert.equal(cart.getState().total, 3700);
assert.equal(cart.getState().shipping, 0, "Free-delivery rules stay unchanged");
cart.getState().removeCoupon();
assert.equal(cart.getState().total, 3800);
assert.ok(!Object.hasOwn(persistOptions.partialize(cart.getState()), "giftWrap"));
cart.setState({ ...restored, isOpen: true });

const uiMocks = {
  "@/components/store-information-provider": { useStorePrice: () => (price) => `৳${price}` },
  "@/store/cart": { useCartStore: () => cart.getState() },
  "@/components/ui/toaster": { toast: { success: () => {}, error: () => {} } },
  "@/lib/utils": utils,
  "next/link": { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children) },
};
const CartDrawer = load("src/components/cart/cart-drawer.tsx", { ...uiMocks, "@/server/actions/coupons": { validateCoupon: async () => ({ ok: false }) } }).CartDrawer;
const bagHtml = renderToStaticMarkup(React.createElement(CartDrawer));
assert.ok(!bagHtml.includes("Gift wrapping"));
assert.ok(!bagHtml.includes("Special packaging"));
assert.ok(!bagHtml.includes("more for free delivery"));
assert.ok(bagHtml.includes("Delivery"));

const CheckoutClient = load("src/components/checkout/checkout-client.tsx", {
  ...uiMocks,
  "@/lib/checkout-validation": validation,
  "@/components/ui/button": { Button: ({ children, ...props }) => { delete props.isLoading; return React.createElement("button", props, children); } },
  "@/server/actions/orders": { createOrder: async () => ({ ok: true }) },
  "@/lib/analytics-client": { trackPurchase: () => {} },
}).CheckoutClient;
const document = new JSDOM(renderToStaticMarkup(React.createElement(CheckoutClient))).window.document;
for (const name of ["ইমেইল ঠিকানা", "জেলা", "শহর", "এলাকা / থানা", "পোস্ট কোড"]) {
  const label = [...document.querySelectorAll("label")].find((element) => element.textContent.startsWith(name));
  assert.ok(label?.textContent.includes("ঐচ্ছিক"), name);
  assert.equal(label.querySelector("em"), null, `${name} must not show a required star`);
}
assert.equal(document.querySelector("select").value, "");

(async () => {
  const Order = load("src/server/models/Order.ts").Order;
  let created;
  let customerUpdates = 0;
  const actions = load("src/server/actions/orders.ts", {
    "next/cache": { revalidatePath: () => {} },
    "../db/connect": { connectDB: async () => {} },
    "../models/Order": { Order: { create: async (data) => { await new Order(data).validate(); created = data; } } },
    "../models/Product": { Product: { findById: () => ({ lean: async () => ({ ...product, isActive: true }) }) } },
    "../models/Customer": { Customer: { updateOne: async () => { customerUpdates += 1; } } },
    "../guard": { requireAdmin: async () => {} },
    "@/lib/checkout-validation": validation,
  });
  const request = { ...contact, items: [{ productId: product.id, name: product.name, quantity: 1, price: product.price }], subtotal: 1900, shipping: 120, total: 2020, giftWrap: true };
  assert.equal((await actions.createOrder(request)).ok, true, "Order must accept omitted optional fields");
  assert.equal(created.shippingAddress.city, "");
  assert.equal(created.customerEmail, undefined);
  assert.equal(created.giftWrap, false);
  assert.equal(customerUpdates, 0);
  assert.equal((await actions.createOrder({ ...request, email: "", city: "", area: "", district: "" })).ok, true);
  assert.equal((await actions.createOrder({ ...request, email: "invalid" })).ok, false);
  assert.equal((await actions.createOrder({ ...request, fullName: " " })).ok, false);
  assert.equal((await actions.createOrder({ ...request, email: " buyer@example.com " })).ok, true);
  assert.equal(created.customerEmail, "buyer@example.com");
  assert.equal(customerUpdates, 1);
  console.log("Checkout: optional fields accepted by client/server/schema; required fields protected; gift wrap removed including legacy charges; delivery banner removed.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
