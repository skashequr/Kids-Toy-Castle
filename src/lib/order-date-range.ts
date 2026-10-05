export type OrderDateRange = { from: string; to: string };

export function dhakaDate(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function orderPresetRange(days: number, today = dhakaDate()): OrderDateRange {
  const start = new Date(today + "T00:00:00Z");
  start.setUTCDate(start.getUTCDate() - days + 1);
  return { from: start.toISOString().slice(0, 10), to: today };
}

export function inOrderDateRange(date: string, range: OrderDateRange): boolean {
  const time = new Date(date).getTime();
  const start = new Date(range.from + "T00:00:00+06:00").getTime();
  const end = new Date(range.to + "T00:00:00+06:00").getTime() + 86400000;
  return time >= start && time < end;
}
