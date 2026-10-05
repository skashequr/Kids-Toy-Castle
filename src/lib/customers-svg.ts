import type { AdminCustomerRow } from "@/components/admin/customers-client";
import { formatDate, formatPrice } from "./utils";

function escapeXml(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]!);
}

/** Standalone SVG: all fields are text, never markup or external resources. */
export function createCustomersSvg(customers: AdminCustomerRow[]): string {
  const columns = [
    { title: "Customer / ID", width: 270, values: (c: AdminCustomerRow) => [c.name || "Unnamed customer", c.id] },
    { title: "Contact", width: 330, values: (c: AdminCustomerRow) => [c.email || "—", c.phone || "—"] },
    { title: "City", width: 170, values: (c: AdminCustomerRow) => [c.city || "—"] },
    { title: "Orders", width: 90, values: (c: AdminCustomerRow) => [String(c.orders)] },
    { title: "Total spent", width: 160, values: (c: AdminCustomerRow) => [formatPrice(c.totalSpent)] },
    { title: "Points", width: 100, values: (c: AdminCustomerRow) => [String(c.loyaltyPoints)] },
    { title: "Joined / Last order", width: 220, values: (c: AdminCustomerRow) => [formatDate(c.joinedAt), formatDate(c.lastOrder)] },
    { title: "Status", width: 110, values: (c: AdminCustomerRow) => [c.status] },
  ];
  const width = columns.reduce((sum, column) => sum + column.width, 64);
  const text = (x: number, y: number, value: string, extra = "") => `<text x="${x}" y="${y}" ${extra}>${escapeXml(value)}</text>`;
  let y = 166;
  const rows = customers.map((customer, index) => {
    const cells = columns.map(column => column.values(customer).flatMap(value => {
      const chars = Array.from(value);
      const length = Math.max(1, Math.floor((column.width - 28) / 9));
      return Array.from({ length: Math.max(1, Math.ceil(chars.length / length)) }, (_, i) => chars.slice(i * length, (i + 1) * length).join(""));
    }));
    const height = Math.max(70, Math.max(...cells.map(cell => cell.length)) * 22 + 24);
    let x = 48;
    const content = cells.map((lines, i) => {
      const result = lines.map((line, j) => text(x, y + 27 + j * 22, line)).join("");
      x += columns[i].width;
      return result;
    }).join("");
    const row = `<rect x="32" y="${y}" width="${width - 64}" height="${height}" fill="${index % 2 ? "#f2f9fd" : "#ffffff"}"/>${content}`;
    y += height;
    return row;
  }).join("");
  let x = 48;
  const headings = columns.map(column => { const heading = text(x, 147, column.title, 'font-weight="700"'); x += column.width; return heading; }).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${y + 64}" viewBox="0 0 ${width} ${y + 64}" role="img" aria-labelledby="title description">
<title id="title">Customer data export</title><desc id="description">${customers.length} customers with contact details, orders, spending, loyalty points, dates and status.</desc>
<rect width="100%" height="100%" fill="#f2fbff"/>
<g font-family="Arial, sans-serif" font-size="13" fill="#23557d">
${text(40, 48, "KIDS TOY CASTLE", 'font-size="13" font-weight="700" letter-spacing="2"')}
${text(40, 83, "Customer directory", 'font-size="26" font-weight="700"')}
${text(40, 108, `${customers.length} customers · Exported ${formatDate(new Date())}`, 'fill="#54758e"')}
<rect x="32" y="124" width="${width - 64}" height="42" rx="8" fill="#dff3ff"/>
${headings}${rows}
${text(40, y + 36, "Private customer data · For internal use", 'fill="#54758e" font-size="11"')}
</g></svg>`;
}
