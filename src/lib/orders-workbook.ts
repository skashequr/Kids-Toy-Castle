import { strToU8, zipSync } from "fflate";
import type { DashboardExportRow } from "@/server/services/dashboard";

const HEADERS = [
  "Order ID",
  "Date",
  "Customer",
  "Email",
  "Phone",
  "Items",
  "Quantity",
  "Subtotal (BDT)",
  "Discount (BDT)",
  "Shipping (BDT)",
  "Total (BDT)",
  "Order Status",
  "Payment Method",
  "Payment Status",
];

function xmlEscape(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function columnName(index: number) {
  let name = "";
  for (let value = index + 1; value > 0; value = Math.floor((value - 1) / 26)) {
    name = String.fromCharCode(65 + ((value - 1) % 26)) + name;
  }
  return name;
}

function stringCell(column: number, row: number, value: unknown, style = 0) {
  return `<c r="${columnName(column)}${row}" t="inlineStr" s="${style}"><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
}

function numberCell(column: number, row: number, value: number, style = 0) {
  return `<c r="${columnName(column)}${row}" s="${style}"><v>${Number.isFinite(value) ? value : 0}</v></c>`;
}

function buildOrdersSheet(rows: DashboardExportRow[]) {
  const header = HEADERS.map((value, index) => stringCell(index, 1, value, 1)).join("");
  const dataRows = rows.map((order, index) => {
    const row = index + 2;
    const values = [
      stringCell(0, row, order.orderNumber),
      stringCell(1, row, new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" }).format(order.createdAt)),
      stringCell(2, row, order.customer),
      stringCell(3, row, order.email),
      stringCell(4, row, order.phone),
      stringCell(5, row, order.items),
      numberCell(6, row, order.quantity),
      numberCell(7, row, order.subtotal, 2),
      numberCell(8, row, order.discount, 2),
      numberCell(9, row, order.shipping, 2),
      numberCell(10, row, order.total, 2),
      stringCell(11, row, order.status),
      stringCell(12, row, order.paymentMethod),
      stringCell(13, row, order.paymentStatus),
    ];
    return `<row r="${row}">${values.join("")}</row>`;
  }).join("");
  const lastRow = Math.max(1, rows.length + 1);

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols><col min="1" max="2" width="15" customWidth="1"/><col min="3" max="5" width="22" customWidth="1"/><col min="6" max="6" width="42" customWidth="1"/><col min="7" max="14" width="17" customWidth="1"/></cols>
  <sheetData><row r="1">${header}</row>${dataRows}</sheetData>
  <autoFilter ref="A1:N${lastRow}"/>
</worksheet>`;
}

function buildSummarySheet(range: { from: string; to: string }, rows: DashboardExportRow[]) {
  const activeRows = rows.filter((row) => !["cancelled", "returned"].includes(row.status));
  const summary: Array<[string, string | number, boolean?]> = [
    ["Dashboard Performance Report", "", false],
    ["From", range.from],
    ["To", range.to],
    ["Total orders", rows.length],
    ["Active revenue", activeRows.reduce((sum, row) => sum + row.total, 0), true],
    ["Items sold", activeRows.reduce((sum, row) => sum + row.quantity, 0)],
    ["Returned orders", rows.filter((row) => row.status === "returned").length],
    ["Cancelled orders", rows.filter((row) => row.status === "cancelled").length],
  ];
  const sheetRows = summary.map(([label, value, currency], index) => {
    const row = index + 1;
    const labelStyle = row === 1 ? 3 : 1;
    const valueCell = typeof value === "number" ? numberCell(1, row, value, currency ? 2 : 0) : stringCell(1, row, value);
    return `<row r="${row}">${stringCell(0, row, label, labelStyle)}${valueCell}</row>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols><col min="1" max="1" width="28" customWidth="1"/><col min="2" max="2" width="22" customWidth="1"/></cols><sheetData>${sheetRows}</sheetData></worksheet>`;
}

export function buildWorkbook(range: { from: string; to: string }, rows: DashboardExportRow[]) {
  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`),
    "_rels/.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    "xl/workbook.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Summary" sheetId="1" r:id="rId1"/><sheet name="Orders" sheetId="2" r:id="rId2"/></sheets></workbook>`),
    "xl/_rels/workbook.xml.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`),
    "xl/styles.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="৳#,##0.00"/></numFmts><fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="16"/><color rgb="FF1B588B"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF238FDA"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>`),
    "xl/worksheets/sheet1.xml": strToU8(buildSummarySheet(range, rows)),
    "xl/worksheets/sheet2.xml": strToU8(buildOrdersSheet(rows)),
  };
  return zipSync(files, { level: 6 });
}
