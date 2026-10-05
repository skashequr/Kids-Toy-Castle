/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { JSDOM } = require("jsdom");
function load(file, mocks = {}, globals = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(source, { exports, console, ...globals, require: (name) => mocks[name] ?? require(name) });
  return exports;
}
const mapping = load("src/lib/steadfast-status.ts");
const utils = load("src/lib/utils.ts");
const orderId = "123456789012345678901234";
let current = { _id: orderId, courier: "Steadfast", trackingNumber: "TRACK", status: "shipped", courierStatus: "pending", courierTrackingMessage: "Rider Note: Call before delivery" };
let lastUpdate;
let concurrentWebhook = false;
let authenticated = true;
const actions = load("src/server/actions/steadfast.ts", {
  "next/cache": { revalidatePath: () => {} },
  "../db/connect": { connectDB: async () => {} },
  "../guard": { requireAdmin: async () => { if (!authenticated) throw Error("Unauthorized"); } },
  "../models/Order": { Order: {
    findById: () => ({ lean: async () => ({ ...current }) }),
    updateOne: async (query, update) => {
      lastUpdate = { query, update };
      if (concurrentWebhook) {
        current = { ...current, status: "delivered", courierStatus: "delivered", courierStatusUpdatedAt: new Date("2099-01-01") };
        return { matchedCount: 0 };
      }
      current = { ...current, ...update.$set };
      return { matchedCount: 1 };
    },
  } },
  "@/lib/steadfast-status": mapping,
  "../services/steadfast": { getSteadfastStatusByTrackingCode: async () => ({ status: 200, delivery_status: "hold" }) },
});

(async () => {
  const result = await actions.syncSteadfastOrderStatus(orderId);
  assert.equal(result.ok, true);
  assert.equal(result.deliveryStatus, "hold");
  assert.equal(result.orderStatus, "shipped");
  assert.equal(result.courierTrackingMessage, "Rider Note: Call before delivery");
  assert.equal(lastUpdate.update.$set.courierTrackingMessage, undefined, "Status-only polling must not erase webhook notes");
  assert.ok(lastUpdate.query.courierStatusUpdatedAt, "Poll must check the snapshot timestamp atomically");
  concurrentWebhook = true;
  const raced = await actions.syncSteadfastOrderStatus(orderId);
  assert.equal(raced.deliveryStatus, "delivered", "Newer webhook must win over an in-flight poll");
  concurrentWebhook = false;
  assert.equal((await actions.syncSteadfastDeliveryOrders([orderId, orderId])).updates.length, 1);
  assert.equal((await actions.syncSteadfastDeliveryOrders(["bad-id"])).ok, false);
  assert.equal((await actions.syncSteadfastDeliveryOrders(Array(51).fill(orderId))).ok, false);
  authenticated = false;
  assert.equal((await actions.syncSteadfastDeliveryOrders([orderId])).ok, false);

  let response = { status: 200, delivery_status: "hold", tracking_message: "Latest rider note", delivery_charge: 80 };
  const api = load("src/server/services/steadfast.ts", {
    "server-only": {}, "@/lib/steadfast-status": mapping,
  }, {
    process: { env: { STEADFAST_API_KEY: "test-only", STEADFAST_SECRET_KEY: "test-only" } },
    AbortSignal,
    fetch: async () => ({ ok: true, status: 200, json: async () => response }),
  });
  const extended = await api.getSteadfastStatusByTrackingCode("TRACK");
  assert.equal(extended.tracking_message, "Latest rider note");
  assert.equal(extended.delivery_charge, 80);
  response = { status: 200, delivery_status: "hold" };
  assert.equal((await api.getSteadfastStatusByTrackingCode("TRACK")).tracking_message, undefined);

  const AdminDeliveryClient = load("src/components/admin/delivery-client.tsx", {
    "next/navigation": { useRouter: () => ({ refresh: () => {} }) },
    "@/lib/utils": utils,
    "@/lib/steadfast-status": mapping,
    "@/server/actions/orders": { updateOrderDelivery: async () => ({ ok: true }) },
    "@/server/actions/steadfast": actions,
    "@/components/ui/toaster": { toast: { success: () => {}, error: () => {} } },
  }).AdminDeliveryClient;
  const html = renderToStaticMarkup(React.createElement(AdminDeliveryClient, {
    initialOrders: [{ id: orderId, orderNumber: "INV1", customer: "Test", phone: "01712345678", address: "Dhaka", items: 1, total: 1000, status: "shipped", date: "2026-10-05", courier: "Steadfast", trackingNumber: "TRACK", courierStatus: "hold", courierTrackingMessage: "Rider Note: Customer requested evening", notes: "Private admin note", courierDeliveryCharge: 80, courierTrackingHistory: [{ message: "Earlier rider note", updatedAt: "2026-10-05T01:00:00Z" }] }],
    initialSteadfastBalance: 0, initialSteadfastError: "",
  }));
  const document = new JSDOM(html).window.document;
  const card = document.querySelector('article[aria-label="Delivery order INV1"]');
  assert.ok(card);
  assert.equal(document.querySelector("table"), null, "Order cards must not require a wide table");
  assert.ok(card.querySelector("[data-courier-note]").textContent.includes("Rider Note: Customer requested evening"));
  assert.ok(card.querySelector("[data-courier-note]").textContent.includes("Earlier rider note"));
  assert.ok(card.querySelector('textarea[aria-label="Internal note"]').textContent.includes("Private admin note"));
  assert.ok(card.querySelector("[data-courier-status]").textContent.includes("hold"));
  assert.equal(card.querySelector("select"), null, "API status must be read-only, not a manual dropdown");
  assert.ok(![...card.querySelectorAll("button")].some((button) => button.textContent.includes("Cancel")), "Booked Steadfast orders must not have a misleading local cancel button");
  assert.equal(card.querySelector('a[target="_blank"]').href, "https://portal.steadfast.com.bd/");
  assert.ok(document.body.textContent.includes("courier booking বাতিল হয় না"));
  assert.ok(document.querySelector('option[value="api:hold"]'), "Filters must expose actual API statuses");
  let allowCancel = false;
  const localChanges = [];
  let bookings = 0;
  const DirectDelivery = load("src/components/admin/delivery-client.tsx", {
    react: { ...React, useState: (value) => [typeof value === "function" ? value() : value, () => {}], useEffect: () => {}, useMemo: (getValue) => getValue() },
    "next/navigation": { useRouter: () => ({ refresh: () => {} }) },
    "@/lib/utils": utils,
    "@/lib/steadfast-status": mapping,
    "@/server/actions/orders": { updateOrderDelivery: async (_id, input) => { localChanges.push(input); return { ok: true }; } },
    "@/server/actions/steadfast": { ...actions, sendOrderToSteadfast: async () => { bookings++; return { ok: false }; } },
    "@/components/ui/toaster": { toast: { success: () => {}, error: () => {} } },
  }, { window: { confirm: (message) => { assert.ok(message.includes("courier booking বাতিল করবে না")); return allowCancel; } } }).AdminDeliveryClient;
  const tree = DirectDelivery({ initialOrders: [{ id: orderId, orderNumber: "LOCAL1", customer: "Test", phone: "01712345678", address: "Dhaka", items: 1, total: 1000, status: "pending", date: "2026-10-05", courier: "", trackingNumber: "", courierStatus: "", courierTrackingMessage: "", notes: "" }], initialSteadfastBalance: 0, initialSteadfastError: "" });
  function findCancel(node) {
    if (Array.isArray(node)) return node.map(findCancel).find(Boolean);
    if (!React.isValidElement(node)) return undefined;
    if (node.type === "button" && node.props.children === "Cancel locally") return node;
    return findCancel(node.props.children);
  }
  const cancel = findCancel(tree);
  assert.ok(cancel);
  await cancel.props.onClick();
  assert.equal(localChanges.length, 0, "Rejecting the confirmation must not cancel an order");
  allowCancel = true;
  await cancel.props.onClick();
  assert.equal(localChanges[0].status, "cancelled");
  assert.equal(bookings, 0, "Local cancellation must not pretend to call the courier API");
  console.log("Live delivery checks passed: API status, read-only UI, notes/history, safe polling, batch limits, auth and webhook race protection.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
