"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "../db/connect";
import { Newsletter } from "../models/Newsletter";
import { requireAdmin } from "../guard";
import { isValidEmail } from "@/lib/utils";

export async function subscribeNewsletter(
  email: string,
  name?: string
): Promise<{ ok: boolean; error?: string }> {
  await connectDB();
  const clean = email.trim().toLowerCase();
  if (!isValidEmail(clean)) return { ok: false, error: "Enter a valid email." };
  await Newsletter.updateOne(
    { email: clean },
    {
      $set: { isActive: true, name },
      $setOnInsert: { email: clean, subscribedAt: new Date() },
    },
    { upsert: true }
  );
  revalidatePath("/admin/email");
  return { ok: true };
}

export async function deleteSubscriber(id: string) {
  await requireAdmin();
  await connectDB();
  await Newsletter.findByIdAndDelete(id);
  revalidatePath("/admin/email");
  return { ok: true };
}

export async function toggleSubscriber(id: string, isActive: boolean) {
  await requireAdmin();
  await connectDB();
  await Newsletter.findByIdAndUpdate(id, { isActive });
  revalidatePath("/admin/email");
  return { ok: true };
}
