const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const ts = require("typescript");
const compiled = new Module("finance-test");
compiled._compile(ts.transpileModule(fs.readFileSync("src/lib/finance.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, "finance-test.cjs");
const { financeSummary, unitCost, allocateRevenue } = compiled.exports;
const costs = [
  { productId: "p", variantId: "", effectiveFrom: "2026-01-01", unitCostCents: 4000 },
  { productId: "p", variantId: "", effectiveFrom: "2026-10-01", unitCostCents: 6000 },
  { productId: "p", variantId: "v", effectiveFrom: "2026-01-01", unitCostCents: 5000 },
];
assert.equal(unitCost(costs, "p", "", "2026-09-29"), 4000);
assert.equal(unitCost(costs, "p", "v", "2026-09-29"), 5000);
assert.equal(unitCost(costs, "p", "other", "2026-09-29"), 4000);
assert.equal(unitCost(costs, "p", "", "2025-01-01"), null);
assert.equal(unitCost([{ ...costs[0], unitCostCents: 0 }], "p", "", "2026-09-29"), 0);
assert.deepEqual(allocateRevenue([100, 100, 100], 100), [33, 34, 33]);
const entry = (category, amountCents, productId = "", extra = {}) => ({ date: "2026-09-29", type: "expense", category, amountCents, productId, voided: false, ...extra });
const data = { costs, products: [{ id: "p", name: "Toy" }], sales: [{ date: "2026-09-29", amountCents: 21000, lines: [{ productId: "p", variantId: "", name: "Toy", quantity: 2, revenueCents: 20000 }] }], entries: [entry("Marketing", 2000, "p"), entry("Rent", 1000), entry("Delivery", 500, "p"), entry("Other income", 500, "", { type: "income" }), entry("Marketing", 9999, "p", { voided: true })] };
const r = financeSummary(data, "2026-09-29", "2026-09-29");
assert.equal(r.automaticCost, 8000);
assert.equal(r.marketing, 2000);
assert.equal(r.netProfit, 10000);
assert.equal(r.productRows[0].profit, 9500);
assert.equal(r.productRows[0].margin, 47.5);
assert.equal(r.productRows[0].quantity, 2);
assert.equal(r.missingUnits, 0);
assert.equal(financeSummary(data, "2026-09-30", "2026-10-01").revenue, 0);
assert.equal(financeSummary({ ...data, costs: [] }, "2026-09-29", "2026-09-29").missingUnits, 2);
const loss = financeSummary({ ...data, sales: [], entries: [entry("Marketing", 2000, "p")] }, "2026-09-29", "2026-09-29");
assert.equal(loss.productRows[0].profit, -2000);
assert.equal(loss.netMargin, null);
assert.equal(financeSummary({ ...data, entries: [entry("Cost of goods sold", 200)] }, "2026-09-29", "2026-09-29").costOfGoods, 8200);
console.log("PASS: dated buying costs, variant fallback, zero/missing costs, exact discount allocation, product marketing, shared expenses, margins, losses, voids and legacy adjustments.");
