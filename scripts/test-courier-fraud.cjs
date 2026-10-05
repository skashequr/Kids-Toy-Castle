/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

function load(file, mocks = {}, globals = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(source, { exports, console, ...globals, require: (name) => mocks[name] ?? require(name) });
  return exports;
}
const phone = "01712345678";
const report = { phone, total_orders: 10, total_delivered: 8, total_cancelled: 2, delivery_rate: "80%", steadfast_configured: false,
  couriers: [{ courier_name: "Pathao", orders: 0, delivered: 0, cancelled: 0, delivery_rate: "30%", customer_rating: "risky_customer", data_type: "rating", source: "pathao_merchant" }] };
let status = 200;
let body = { success: true, data: report };
let thrown;
let request;
const service = load("src/server/services/steadfast.ts", {
  "server-only": {}, "@/lib/steadfast-status": {},
}, { Error, AbortSignal, process: { env: { STEADFAST_API_KEY: "private-key", STEADFAST_SECRET_KEY: "private-secret" } }, fetch: async (url, init) => {
  request = { url, init };
  if (thrown) throw thrown;
  return { status, ok: status >= 200 && status < 300, json: async () => body };
} });

(async () => {
  assert.equal((await service.checkCourierFraud(phone)).couriers[0].source, "pathao_merchant");
  assert.equal(request.init.cache, "no-store");
  assert.equal(request.init.headers.Accept, "application/json");
  assert.ok(!JSON.stringify(request).includes("private-key"), "Steadfast credentials must not go to Elite Mart");
  status = 400; body = { error: "মোবাইল নাম্বার দিন।" };
  await assert.rejects(service.checkCourierFraud(phone), /মোবাইল নাম্বার দিন/);
  for (status of [401, 403]) await assert.rejects(service.checkCourierFraud(phone), /blocked this server/);
  status = 429;
  await assert.rejects(service.checkCourierFraud(phone), /request limit/);
  status = 503; body = null;
  await assert.rejects(service.checkCourierFraud(phone), /unavailable \(503\)/);
  status = 200;
  for (const data of [{ ...report, couriers: null }, { ...report, total_orders: -1 }, { ...report, phone: "01812345678" }, { ...report, total_delivered: "8" }]) {
    body = { success: true, data };
    await assert.rejects(service.checkCourierFraud(phone), /invalid report/);
  }
  body = { success: false, message: "Provider temporarily offline" };
  await assert.rejects(service.checkCourierFraud(phone), /temporarily offline/);
  thrown = Object.assign(new Error("timeout"), { name: "TimeoutError" });
  await assert.rejects(service.checkCourierFraud(phone), /fraud checker did not respond/);
  thrown = new Error("network");
  await assert.rejects(service.checkCourierFraud(phone), /Could not connect/);

  let authorized = true;
  let lookedUp;
  const actions = load("src/server/actions/steadfast.ts", {
    "next/cache": {}, "../db/connect": {}, "../models/Order": {}, "@/lib/steadfast-status": {},
    "../guard": { requireAdmin: async () => { if (!authorized) throw new Error("Unauthorized"); } },
    "../services/steadfast": { checkCourierFraud: async (value) => { lookedUp = value; return report; } },
  }, { Error });
  for (const value of [phone, "+8801712345678", "০১৭১২৩৪৫৬৭৮", "+৮৮০ ১৭১২-৩৪৫৬৭৮"]) {
    assert.equal((await actions.runCourierFraudCheck(value)).ok, true);
    assert.equal(lookedUp, phone);
  }
  for (const value of ["01012345678", "0171234567", "abc01712345678", "", null]) {
    lookedUp = null;
    assert.equal((await actions.runCourierFraudCheck(value)).ok, false);
    assert.equal(lookedUp, null);
  }
  authorized = false;
  lookedUp = null;
  assert.equal((await actions.runCourierFraudCheck(phone)).ok, false);
  assert.equal(lookedUp, null, "Unauthorized calls must never contact the provider");

  function render(result, error = "") {
    let index = 0;
    const states = [phone, result, error, false];
    const component = load("src/components/admin/courier-fraud-check.tsx", {
      react: { ...React, useState: () => [states[index++], () => {}], useRef: () => ({ current: false }) },
      "@/server/actions/steadfast": {},
    });
    return renderToStaticMarkup(React.createElement(component.CourierFraudCheck));
  }
  const html = render(report);
  assert.match(html, /Rating only, not delivery counts/);
  assert.match(html, /Steadfast figures may be incomplete/);
  assert.match(html, /Source: pathao_merchant/);
  assert.match(html, /type="submit"/);
  assert.match(html, /type="tel"/);
  assert.match(html, /does not prove fraud/);
  assert.match(render(null, "Provider blocked access"), /role="alert"/);

  let stateIndex = 0;
  const states = [phone, report, "old error", false];
  const busy = { current: false };
  let resolveLookup;
  let calls = 0;
  const interactive = load("src/components/admin/courier-fraud-check.tsx", {
    react: { ...React, useState: () => {
      const index = stateIndex++;
      return [states[index], (value) => { states[index] = value; }];
    }, useRef: () => busy },
    "@/server/actions/steadfast": { runCourierFraudCheck: () => {
      calls++;
      return new Promise((resolve) => { resolveLookup = resolve; });
    } },
  });
  function find(element, type) {
    if (!element || typeof element !== "object") return null;
    if (element.type === type) return element;
    for (const child of React.Children.toArray(element.props?.children)) {
      const match = find(child, type);
      if (match) return match;
    }
    return null;
  }
  const tree = interactive.CourierFraudCheck();
  const submit = find(tree, "form").props.onSubmit;
  submit({ preventDefault() {} });
  submit({ preventDefault() {} });
  assert.equal(calls, 1, "Double-submit must make one lookup");
  assert.equal(states[1], null, "Old report must clear immediately");
  assert.equal(states[2], "");
  assert.equal(states[3], true);
  resolveLookup({ ok: false, error: "Provider blocked access" });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(states[2], "Provider blocked access");
  assert.equal(states[3], false);
  assert.equal(busy.current, false);
  submit({ preventDefault() {} });
  resolveLookup({ ok: true, result: report });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(states[1], report, "Retry must render the new report");
  assert.equal(states[2], "");
  find(tree, "input").props.onChange({ target: { value: "01812345678" } });
  assert.equal(states[1], null, "Changing the phone must clear the previous phone's report");
  console.log("Courier fraud validation, provider errors, privacy, admin authorization and report rendering tests passed.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
