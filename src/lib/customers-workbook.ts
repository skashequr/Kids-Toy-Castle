import { strToU8, zipSync } from "fflate";
import type { AdminCustomerRow } from "@/components/admin/customers-client";

const HEADERS = [
  "Customer ID",
  "Name",
  "Email",
  "Phone",
  "City",
  "Orders",
  "Total spent (BDT)",
  "Loyalty points",
  "Joined",
  "Last order",
  "Status",
];

function escapeXml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function columnName(index: number) {
  let result = "";
  for (let value = index + 1; value > 0; value = Math.floor((value - 1) / 26)) {
    result = String.fromCharCode(65 + ((value - 1) % 26)) + result;
  }
  return result;
}

function stringCell(column: number, row: number, value: unknown, style = 0) {
  return `<c r="${columnName(column)}${row}" t="inlineStr" s="${style}"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
}

function numberCell(column: number, row: number, value: number, style = 0) {
  return `<c r="${columnName(column)}${row}" s="${style}"><v>${Number.isFinite(value) ? value : 0}</v></c>`;
}

function excelDate(value: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((item) => item.type === type)?.value);
  return Date.UTC(part("year"), part("month") - 1, part("day")) / 86_400_000 + 25_569;
}

function dateCell(column: number, row: number, value: string) {
  const serial = excelDate(value);
  return serial === null ? stringCell(column, row, "") : numberCell(column, row, serial, 3);
}

function buildCustomersSheet(customers: AdminCustomerRow[]) {
  const header = HEADERS.map((value, index) => stringCell(index, 1, value, 1)).join("");
  const rows = customers.map((customer, index) => {
    const row = index + 2;
    return `<row r="${row}">${[
      stringCell(0, row, customer.id),
      stringCell(1, row, customer.name),
      stringCell(2, row, customer.email),
      stringCell(3, row, customer.phone),
      stringCell(4, row, customer.city),
      numberCell(5, row, customer.orders),
      numberCell(6, row, customer.totalSpent, 2),
      numberCell(7, row, customer.loyaltyPoints),
      dateCell(8, row, customer.joinedAt),
      dateCell(9, row, customer.lastOrder),
      stringCell(10, row, customer.status),
    ].join("")}</row>`;
  }).join("");
  const lastRow = Math.max(1, customers.length + 1);

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols><col min="1" max="1" width="26" customWidth="1"/><col min="2" max="2" width="24" customWidth="1"/><col min="3" max="3" width="30" customWidth="1"/><col min="4" max="5" width="18" customWidth="1"/><col min="6" max="8" width="18" customWidth="1"/><col min="9" max="10" width="15" customWidth="1"/><col min="11" max="11" width="12" customWidth="1"/></cols>
  <sheetData><row r="1">${header}</row>${rows}</sheetData>
  <autoFilter ref="A1:K${lastRow}"/>
</worksheet>`;
}

function buildSummarySheet(customers: AdminCustomerRow[]) {
  const totalOrders = customers.reduce((sum, customer) => sum + customer.orders, 0);
  const totalSpent = customers.reduce((sum, customer) => sum + customer.totalSpent, 0);
  const summary: Array<[string, string | number, number?]> = [
    ["Customer Export", "", 4],
    ["Exported customers", customers.length],
    ["Active customers", customers.filter((customer) => customer.status === "active").length],
    ["Total orders", totalOrders],
    ["Total spent (BDT)", totalSpent, 2],
    ["Average order value (BDT)", totalOrders ? totalSpent / totalOrders : 0, 2],
    ["Export date", excelDate(new Date().toISOString()) ?? "", 3],
  ];
  const rows = summary.map(([label, value, valueStyle], index) => {
    const row = index + 1;
    const left = stringCell(0, row, label, row === 1 ? 4 : 1);
    const right = typeof value === "number" ? numberCell(1, row, value, valueStyle ?? 0) : stringCell(1, row, value);
    return `<row r="${row}">${left}${right}</row>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols><col min="1" max="1" width="28" customWidth="1"/><col min="2" max="2" width="22" customWidth="1"/></cols><sheetData>${rows}</sheetData></worksheet>`;
}

export function createCustomersWorkbook(customers: AdminCustomerRow[]) {
  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`),
    "_rels/.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    "xl/workbook.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Summary" sheetId="1" r:id="rId1"/><sheet name="Customers" sheetId="2" r:id="rId2"/></sheets></workbook>`),
    "xl/_rels/workbook.xml.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`),
    "xl/styles.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="৳#,##0.00"/><numFmt numFmtId="165" formatCode="dd-mmm-yyyy"/></numFmts><fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="16"/><color rgb="FF23557D"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF238DCC"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>`),
    "xl/worksheets/sheet1.xml": strToU8(buildSummarySheet(customers)),
    "xl/worksheets/sheet2.xml": strToU8(buildCustomersSheet(customers)),
  };
  return zipSync(files, { level: 6 });
}
