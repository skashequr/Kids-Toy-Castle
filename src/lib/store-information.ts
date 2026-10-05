export const DEFAULT_STORE_INFORMATION = {
  storeName: "Kids Toy Castle",
  tagline: "Magical playthings for little imaginations",
  email: "hello@kidstoycastle.com",
  phone: "+880 1819-788257",
  address: "",
  facebook: "",
  instagram: "",
  youtube: "",
  whatsapp: "",
  logo: "/favicon.ico",
  favicon: "/favicon.ico",
  currency: "BDT",
  currencySymbol: "৳",
};

export type StoreInformation = typeof DEFAULT_STORE_INFORMATION;

export function safeStoreUrl(value: string, allowLocal = false): string {
  if (allowLocal && /^\/(?!\/)[^\s\\]*$/.test(value)) return value;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : "";
  } catch {
    return "";
  }
}

export function normalizeStoreInformation(input: Record<string, unknown> = {}): StoreInformation {
  const result = { ...DEFAULT_STORE_INFORMATION };
  for (const key of Object.keys(result) as (keyof StoreInformation)[]) {
    if (typeof input[key] === "string") result[key] = (input[key] as string).trim();
  }
  result.storeName ||= DEFAULT_STORE_INFORMATION.storeName;
  for (const key of ["facebook", "instagram", "youtube"] as const) result[key] = safeStoreUrl(result[key]);
  for (const key of ["logo", "favicon"] as const) result[key] = safeStoreUrl(result[key], true) || DEFAULT_STORE_INFORMATION[key];
  result.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email) ? result.email : "";
  result.currency = /^[A-Z]{3}$/.test(result.currency.toUpperCase()) ? result.currency.toUpperCase() : "BDT";
  return result;
}

export function storePhoneHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  return /\d/.test(digits) ? `tel:${digits}` : "";
}

export function whatsappHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const international = /^01\d{9}$/.test(digits) ? `88${digits}` : digits;
  return /^\d{7,15}$/.test(international) ? `https://wa.me/${international}` : "";
}
