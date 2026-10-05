/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

function load(path, mocks = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(source, { exports, URL, console, require: (name) => mocks[name] ?? require(name) });
  return exports;
}

const storeHelpers = load("src/lib/store-information.ts");
const { normalizeStoreInformation, safeStoreUrl, whatsappHref } = storeHelpers;
assert.equal(normalizeStoreInformation().storeName, "Kids Toy Castle");
assert.equal(normalizeStoreInformation({ storeName: "  New Store  ", tagline: "" }).storeName, "New Store");
assert.equal(normalizeStoreInformation({ tagline: "" }).tagline, "");
for (const url of ["javascript:alert(1)", "data:text/html,test", "//evil.example", "/\\evil.example", "https://user:password@example.com"]) {
  assert.equal(safeStoreUrl(url, true), "", url);
}
assert.equal(safeStoreUrl("/new-logo.png", true), "/new-logo.png");
assert.equal(whatsappHref("01712345678"), "https://wa.me/8801712345678");
assert.equal(whatsappHref("+880 1712-345678"), "https://wa.me/8801712345678");
assert.equal(whatsappHref("wrong"), "");

const store = normalizeStoreInformation({
  storeName: "Dynamic Test Shop", tagline: "Saved tagline", phone: "+880 1712-345678",
  email: "shop@example.com", address: "Saved address", facebook: "https://facebook.com/test-shop",
  instagram: "", youtube: "", whatsapp: "01712345678", logo: "/saved-logo.png", favicon: "/saved-icon.png",
  currency: "BDT", currencySymbol: "Tk ",
});
const provider = load("src/components/store-information-provider.tsx", { "@/lib/store-information": storeHelpers });
const Footer = load("src/components/layout/footer.tsx", {
  "@/components/store-information-provider": provider,
  "@/lib/store-information": storeHelpers,
  "next/link": { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children) },
}).Footer;
function Price() { return React.createElement("span", null, provider.useStorePrice()(1250)); }
function render(value) {
  return renderToStaticMarkup(React.createElement(provider.StoreInformationProvider, { store: value }, React.createElement(React.Fragment, null, React.createElement(Footer), React.createElement(Price))));
}
const html = render(store);
for (const marker of ["Dynamic Test Shop", "Saved tagline", "shop@example.com", "Saved address", "saved-logo.png", "facebook.com/test-shop", "wa.me/8801712345678", "Tk1,250"]) assert.ok(html.includes(marker), marker);
assert.ok(!html.includes("Kids Toy Castle"));
const emptyHtml = render(normalizeStoreInformation({ email: "", phone: "", address: "", facebook: "", whatsapp: "", tagline: "" }));
assert.ok(!emptyHtml.includes("mailto:"));
assert.ok(!emptyHtml.includes("wa.me"));
assert.ok(!emptyHtml.includes("Saved tagline"));
assert.ok(!Object.hasOwn(normalizeStoreInformation({ apiSecret: "private" }), "apiSecret"));

const Header = load("src/components/layout/header.tsx", {
  "@/components/store-information-provider": provider,
  "@/lib/store-information": storeHelpers,
  "@/lib/utils": { cn: (...classes) => classes.filter((value) => typeof value === "string").join(" ") },
  "@/store/cart": { useCartStore: () => ({ getItemCount: () => 0, openCart: () => {} }) },
  "@/store/wishlist": { useWishlistStore: () => 0 },
  "@/store/ui": { useUIStore: () => ({ isMobileMenuOpen: false, isSearchOpen: false, language: "en", closeMobileMenu: () => {}, closeSearch: () => {} }) },
  "@/lib/data": { NAV_MENU: [] },
  "next-auth/react": { useSession: () => ({ status: "unauthenticated", data: null }) },
  "next/navigation": { usePathname: () => "/" },
  "next/link": { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children) },
}).Header;

(async () => {
  const noop = () => null;
  const layout = load("src/app/layout.tsx", {
    "next/font/google": { Inter: () => ({ variable: "inter" }), Hind_Siliguri: () => ({ variable: "hind" }), Playfair_Display: () => ({ variable: "playfair" }) },
    "./globals.css": {},
    "@/components/theme-initializer": { ThemeInitializer: noop },
    "@/components/ui/toaster": { Toaster: noop },
    "@/components/cart/cart-drawer": { CartDrawer: noop },
    "@/components/analytics-tracker": { AnalyticsTracker: noop },
    "next-auth/react": { SessionProvider: ({ children }) => children },
    "@/server/services/settings": { getStoreInformation: async () => store, getTrackingSettings: async () => ({ googleAnalyticsId: "", facebookPixelId: "" }) },
    "@/components/store-information-provider": provider,
  });
  const metadata = await layout.generateMetadata();
  assert.equal(metadata.title.default, "Dynamic Test Shop — Saved tagline");
  assert.equal(metadata.icons.icon, "/saved-icon.png");
  const storefront = renderToStaticMarkup(await layout.default({ children: React.createElement(React.Fragment, null, React.createElement(Header), React.createElement(Footer)) }));
  assert.ok(storefront.includes("Dynamic Test Shop home"));
  assert.ok(storefront.includes("tel:+8801712345678"));
  assert.ok(!storefront.includes("KIDS TOY CASTLE"));
  let savedUpdate;
  const invalidations = [];
  const actions = load("src/server/actions/settings.ts", {
    "next/cache": { revalidatePath: (...args) => invalidations.push(args) },
    "../db/connect": { connectDB: async () => {} },
    "../models/Settings": { Settings: { updateOne: async (_query, update) => { savedUpdate = update; } } },
    "../guard": { requireAdmin: async () => {} },
    "@/lib/store-information": storeHelpers,
  });
  await actions.saveSettings({ store });
  assert.equal(savedUpdate.$set.store.storeName, store.storeName);
  assert.equal(savedUpdate.$set.store.favicon, "/saved-icon.png");
  assert.ok(invalidations.some(([path, scope]) => path === "/" && scope === "layout"));
  await assert.rejects(() => actions.saveSettings({ store: { ...store, facebook: "javascript:alert(1)" } }), /valid http/);
  await assert.rejects(() => actions.saveSettings({ store: { ...store, email: "wrong" } }), /valid contact email/);
  await assert.rejects(() => actions.saveSettings({ store: { ...store, storeName: " " } }), /Store name is required/);
  console.log("Store settings: normalization, safe links, dynamic footer/prices, save and storefront invalidation passed.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
