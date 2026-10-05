"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "../db/connect";
import { ContactMessage } from "../models/ContactMessage";
import { isValidEmail } from "@/lib/utils";

export async function submitContact(input: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}): Promise<{ ok: boolean; error?: string }> {
  await connectDB();
  if (!input.name?.trim() || !input.message?.trim()) {
    return { ok: false, error: "Name and message are required." };
  }
  if (!isValidEmail(input.email)) {
    return { ok: false, error: "Enter a valid email." };
  }
  await ContactMessage.create({
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    subject: input.subject ?? "",
    message: input.message.trim(),
  });
  revalidatePath("/admin/contact");
  return { ok: true };
}
