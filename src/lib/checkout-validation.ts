import { isValidEmail, isValidPhone } from "@/lib/utils";

export type CheckoutContact = {
  fullName: string;
  phone: string;
  address: string;
  email?: string;
  city?: string;
  district?: string;
  area?: string;
};

export function validateCheckoutContact(form: CheckoutContact): Partial<Record<keyof CheckoutContact, string>> {
  const errors: Partial<Record<keyof CheckoutContact, string>> = {};
  if (!form.fullName?.trim()) errors.fullName = "আপনার নাম লিখুন";
  if (!isValidPhone(form.phone?.trim() ?? "")) errors.phone = "সঠিক মোবাইল নম্বর দিন";
  if (!form.address?.trim()) errors.address = "বিস্তারিত ঠিকানা লিখুন";
  const email = form.email?.trim();
  if (email && !isValidEmail(email)) errors.email = "সঠিক ইমেইল দিন";
  return errors;
}
