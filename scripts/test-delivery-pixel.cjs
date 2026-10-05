/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function load(file, globals = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(source, { exports, ...globals });
  return exports;
}

const mapping = load("src/lib/steadfast-status.ts");
assert.equal(mapping.mapSteadfastStatus("Delivered", "shipped"), "delivered");
assert.equal(mapping.mapSteadfastStatus("partial_delivered", "shipped"), "shipped");
for (const status of ["hold", "unknown", "delivered_approval_pending", "pending"]) {
  assert.equal(mapping.mapSteadfastStatus(status, "delivered"), "delivered");
}
assert.equal(mapping.mapSteadfastStatus("in_review", "pending"), "processing");
assert.equal(mapping.normalizeSteadfastStatus("bad_status"), null);

const meta = [];
const internal = [];
const window = {
  location: { pathname: "/product/toy" },
  crypto: { randomUUID: () => "test-session" },
  localStorage: { getItem() { throw Error("blocked"); }, setItem() { throw Error("blocked"); } },
};
const tracking = load("src/lib/analytics-client.ts", {
  window,
  navigator: { sendBeacon: () => false },
  Blob,
  fetch: async (path) => { internal.push(path); },
});
tracking.trackAnalyticsEvent("product_view", { productId: "toy", value: 120 });
assert.equal(internal.length, 1, "beacon failure must fall back to fetch");
window.fbq = (...args) => meta.push(args);
tracking.flushTrackingEvents("meta");
assert.equal(meta[0][1], "ViewContent", "initial product view must survive late Pixel loading");
assert.equal(meta[0][2].currency, "BDT");
tracking.flushTrackingEvents("meta");
assert.equal(meta.length, 1, "queued events must flush only once");
tracking.trackPurchase("ORDER-1", 240, [{ id: "toy", quantity: 2, price: 120 }]);
assert.equal(meta[1][1], "Purchase");
assert.equal(meta[1][2].num_items, 2);
window.location.pathname = "/admin/delivery";
tracking.trackPurchase("ADMIN-1", 50, []);
assert.equal(meta.length, 2, "admin activity must not reach Pixel");
console.log("Delivery status and Pixel regression checks passed.");

async function testWebhook() {
  const updates = [];
  let connects = 0;
  const route = load("src/app/api/webhooks/steadfast/route.ts", {
    process: { env: { STEADFAST_WEBHOOK_SECRET: "test-secret" } },
    Buffer, Response,
    require(name) {
      if (name === "node:crypto" || name === "zod") return require(name);
      if (name === "next/cache") return { revalidatePath() {} };
      if (name === "@/lib/steadfast-status") return mapping;
      if (name === "@/server/db/connect") return { connectDB: async () => { connects++; } };
      if (name === "@/server/models/Order") return { Order: {
        findOne: () => ({ lean: async () => ({ _id: "order-1", status: "shipped" }) }),
        updateOne: async (query, update) => { updates.push({ query, update }); },
      } };
      throw Error(`Unexpected import: ${name}`);
    },
  });
  const send = (body, authorization = "Bearer test-secret") => route.POST(new Request("https://example.com/api/webhooks/steadfast", {
    method: "POST", headers: { authorization, "Content-Type": "application/json" }, body: JSON.stringify(body),
  }));
  assert.equal((await send({}, "test-secret")).status, 401);
  assert.equal((await send({ notification_type: "delivery_status", invoice: { $ne: "" }, status: "delivered" })).status, 400);
  assert.equal(connects, 0, "invalid callbacks must never reach the DB");
  assert.equal((await send({ notification_type: "delivery_status", invoice: "INV-1", status: "hold", updated_at: "2026-10-05 12:00:00" })).status, 200);
  assert.equal(updates[0].update.$set.status, "shipped", "hold must preserve the local shipment status");
  assert.equal(updates[0].update.$set.courierStatusUpdatedAt.toISOString(), "2026-10-05T06:00:00.000Z");
  assert.ok(updates[0].query.$or[1].courierStatusUpdatedAt.$lt, "old callbacks must have an atomic timestamp guard");
  await send({ notification_type: "tracking_update", invoice: "INV-1", status: "cancelled", tracking_message: "At sorting centre" });
  assert.equal(updates[1].update.$set.status, undefined, "tracking callbacks must not change delivery state");
  assert.equal(updates[1].update.$push.courierTrackingHistory.$each[0].message, "At sorting centre");
  await send({ notification_type: "delivery_status", invoice: "INV-1", status: "delivered", tracking_message: "Rider Note: Customer requested afternoon delivery", delivery_charge: 80, cod_amount: 1500 });
  assert.equal(updates[2].update.$set.courierDeliveryCharge, 80);
  assert.equal(updates[2].update.$set.courierCodAmount, 1500);
  assert.equal(updates[2].update.$set.courierTrackingMessage, undefined, "status and rider notes must use independent clocks");
  assert.equal(updates[3].update.$set.courierTrackingMessage, "Rider Note: Customer requested afternoon delivery");
  assert.ok(updates[3].query.$or[1].courierUpdatedAt.$lt);
  assert.equal(updates[3].update.$push.courierTrackingHistory.$slice, -100);
  assert.equal((await send({ notification_type: "tracking_update", invoice: "INV-1" })).status, 400);
  console.log("Webhook authentication, payload, status and timestamp checks passed.");
}

testWebhook().catch((error) => { console.error(error); process.exitCode = 1; });
