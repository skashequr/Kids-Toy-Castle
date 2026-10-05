/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { JSDOM } = require("jsdom");

function load(path, mocks = {}, globals = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(source, { exports, URL, console, ...globals, require: (name) => mocks[name] ?? require(name) });
  return exports;
}
const storeHelpers = load("src/lib/store-information.ts");
const helpers = load("src/lib/whatsapp-order.ts", { "@/lib/store-information": storeHelpers });
const detail = { name: "বাংলা Toy & Gift #1", slug: "toy-gift", priceLabel: "৳1,250", quantity: 2, variantLabel: "Red / XL" };
const url = new URL(helpers.buildWhatsAppOrderUrl("01712345678", detail, "https://shop.example/path"));
assert.equal(url.origin + url.pathname, "https://wa.me/8801712345678");
const text = url.searchParams.get("text");
for (const marker of [detail.name, "৳1,250", "পরিমাণ: 2", "Red / XL", "https://shop.example/product/toy-gift"]) assert.ok(text.includes(marker), marker);
assert.equal(helpers.buildWhatsAppOrderUrl("", detail, "https://shop.example"), "");
assert.equal(helpers.buildWhatsAppOrderUrl("invalid", detail, "https://shop.example"), "");
assert.equal(helpers.buildWhatsAppOrderUrl("01712345678", detail, "javascript:alert(1)"), "");
const variantText = new URL(helpers.buildWhatsAppOrderUrl("+8801712345678", { ...detail, variantLabel: undefined, hasVariants: true }, "https://shop.example")).searchParams.get("text");
assert.ok(variantText.includes("চ্যাটে নিশ্চিত করব"));

let phone = "01712345678";
const opened = [];
const utils = load("src/lib/utils.ts");
const provider = {
  useStoreInformation: () => ({ whatsapp: phone }),
  useStorePrice: () => (price) => `৳${price}`,
};
const WhatsAppOrderButton = load("src/components/product/whatsapp-order-button.tsx", {
  "@/components/store-information-provider": provider,
  "@/lib/store-information": storeHelpers,
  "@/lib/whatsapp-order": helpers,
  "@/lib/utils": utils,
}, { window: { location: { origin: "https://current-shop.example" }, open: (...args) => opened.push(args) } }).WhatsAppOrderButton;
const product = { id: "toy1", name: detail.name, slug: detail.slug, price: 500, images: [], variants: [], rating: 5, reviewCount: 1, category: { name: "Toys" } };
const button = WhatsAppOrderButton({ product });
assert.equal(button.props.disabled, false);
button.props.onClick();
assert.equal(opened.length, 1);
assert.equal(opened[0][1], "_blank");
assert.equal(opened[0][2], "noopener,noreferrer");
assert.ok(new URL(opened[0][0]).searchParams.get("text").includes("https://current-shop.example/product/toy-gift"));
phone = "";
assert.equal(WhatsAppOrderButton({ product }).props.disabled, true);
phone = "01712345678";

const mocks = {
  "@/components/store-information-provider": provider,
  "@/components/product/whatsapp-order-button": { WhatsAppOrderButton },
  "@/lib/utils": utils,
  "@/store/cart": { useCartStore: () => ({ addItem: () => {} }) },
  "@/store/wishlist": { useWishlistStore: () => ({ toggleItem: () => {}, isWishlisted: () => false }) },
  "@/components/ui/toaster": { toast: { info: () => {}, success: () => {} } },
  "next/link": { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children) },
};
const ProductCard = load("src/components/product/product-card.tsx", mocks).ProductCard;
const cardDocument = new JSDOM(renderToStaticMarkup(React.createElement(ProductCard, { product }))).window.document;
assert.ok(cardDocument.body.textContent.includes("কার্টে যোগ করুন"));
const whatsappButton = cardDocument.querySelector('button[aria-label*="WhatsApp"]');
assert.ok(whatsappButton);
assert.equal(whatsappButton.closest("a"), null, "WhatsApp must not be nested inside a product link");
const FlashSale = load("src/components/home/flash-sale.tsx", mocks).FlashSale;
const saleHtml = renderToStaticMarkup(React.createElement(FlashSale, { products: [{ ...product, flashPrice: 300, flashStock: 10, soldCount: 1 }] }));
assert.ok(saleHtml.includes("WhatsApp অর্ডার"));
WhatsAppOrderButton({ product: { ...product, price: 300 } }).props.onClick();
assert.ok(new URL(opened[1][0]).searchParams.get("text").includes("৳300"));
console.log("WhatsApp order checks passed: configured number, Bengali message/link, variants/quantity, flash price, cart button preserved, safe new tab, missing-number disabled.");
