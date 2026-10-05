export const FINANCE_CATEGORIES = {
  income: ["Other income"],
  expense: ["Cost of goods sold", "Delivery", "Packaging", "Marketing", "Rent", "Salary", "Utilities", "Fees", "Other expense"],
} as const;
export type FinanceEntry = {
  id: string; date: string; type: "income" | "expense"; category: string;
  amountCents: number; description: string; reference: string;
  voided: boolean; voidReason: string; createdBy: string; updatedAt: string;
  productId?: string;
};
export type FinanceLine = { productId: string; variantId: string; name: string; quantity: number; revenueCents: number };
export type FinanceSale = { id: string; orderNumber: string; date: string; amountCents: number; paymentStatus: string; estimatedDate: boolean; lines: FinanceLine[] };
export type CostRate = { productId: string; variantId: string; effectiveFrom: string; unitCostCents: number };
export type FinanceProduct = { id: string; name: string; priceCents: number; variants: { id: string; name: string }[] };
export type FinanceData = { entries: FinanceEntry[]; sales: FinanceSale[]; products: FinanceProduct[]; costs: CostRate[] };

export function unitCost(costs: CostRate[], productId: string, variantId: string, date: string): number | null {
  const eligible = costs.filter((c) => c.productId === productId && c.effectiveFrom <= date);
  const variant = variantId ? eligible.filter((c) => c.variantId === variantId) : [];
  const rates = variant.length ? variant : eligible.filter((c) => c.variantId === "");
  return rates.sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0]?.unitCostCents ?? null;
}

// Allocate net merchandise sales by line value, preserving the exact order total in cents.
export function allocateRevenue(values: number[], net: number): number[] {
  const total = values.reduce((a, b) => a + b, 0);
  let cumulative = 0, allocated = 0;
  return values.map((value, i) => {
    cumulative += value;
    const target = i === values.length - 1 ? net : total > 0 ? Math.round(net * cumulative / total) : 0;
    const amount = target - allocated; allocated = target; return amount;
  });
}

export function financeSummary(data: FinanceData, from: string, to: string) {
  const entries = data.entries.filter((e) => !e.voided && e.date >= from && e.date <= to);
  const sales = data.sales.filter((s) => s.date >= from && s.date <= to);
  const revenue = sales.reduce((n, s) => n + s.amountCents, 0);
  const otherIncome = entries.filter((e) => e.type === "income").reduce((n, e) => n + e.amountCents, 0);
  const rows = new Map<string, { id: string; name: string; quantity: number; revenue: number; purchaseCost: number; missingUnits: number; marketing: number; otherCosts: number }>();
  function row(id: string, name: string) {
    if (!rows.has(id)) rows.set(id, { id, name, quantity: 0, revenue: 0, purchaseCost: 0, missingUnits: 0, marketing: 0, otherCosts: 0 });
    return rows.get(id)!;
  }
  for (const sale of sales) for (const line of sale.lines) {
    const r = row(line.productId || `unlinked:${line.name}`, line.name);
    r.quantity += line.quantity; r.revenue += line.revenueCents;
    const cost = unitCost(data.costs, line.productId, line.variantId, sale.date);
    if (cost === null) r.missingUnits += line.quantity;
    else r.purchaseCost += cost * line.quantity;
  }
  for (const e of entries) if (e.type === "expense" && e.productId) {
    const r = row(e.productId, data.products.find((p) => p.id === e.productId)?.name || "Archived product");
    if (e.category === "Marketing") r.marketing += e.amountCents;
    else if (e.category !== "Cost of goods sold") r.otherCosts += e.amountCents;
  }
  const automaticCost = [...rows.values()].reduce((n, r) => n + r.purchaseCost, 0);
  // Existing manual COGS remain visible as adjustments; never silently discard prior bookkeeping.
  const manualCost = entries.filter((e) => e.type === "expense" && e.category === "Cost of goods sold").reduce((n, e) => n + e.amountCents, 0);
  const costOfGoods = automaticCost + manualCost;
  const operatingExpenses = entries.filter((e) => e.type === "expense" && e.category !== "Cost of goods sold").reduce((n, e) => n + e.amountCents, 0);
  const marketing = entries.filter((e) => e.type === "expense" && e.category === "Marketing").reduce((n, e) => n + e.amountCents, 0);
  const missingUnits = [...rows.values()].reduce((n, r) => n + r.missingUnits, 0);
  const netProfit = revenue + otherIncome - costOfGoods - operatingExpenses;
  const productRows = [...rows.values()].map((r) => {
    const profit = r.revenue - r.purchaseCost - r.marketing - r.otherCosts;
    return { ...r, profit, margin: r.revenue > 0 ? profit / r.revenue * 100 : null };
  }).sort((a, b) => b.revenue - a.revenue);
  return { entries, sales, revenue, otherIncome, costOfGoods, operatingExpenses,
    productRows, marketing, missingUnits, automaticCost, manualCost,
    netMargin: revenue > 0 ? netProfit / revenue * 100 : null,
    grossProfit: revenue - costOfGoods,
    netProfit };
}
