"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "../guard";
import { connectDB } from "../db/connect";
import { MarketingCampaign, WhatsAppContact } from "../models/Marketing";

const draftSchema = z.object({
  channel: z.enum(["email", "whatsapp"]), subject: z.string().trim().min(1).max(200),
  body: z.string().max(10000), template: z.string().trim().max(512),
  language: z.string().regex(/^[a-z]{2,3}(?:_[A-Z]{2})?$/),
  parameters: z.array(z.string().trim().min(1).max(1024)).max(20),
});
export async function saveMarketingDraft(input: unknown) {
  await requireAdmin();
  const data = draftSchema.parse(input);
  await connectDB();
  const doc = await MarketingCampaign.create(data);
  revalidatePath("/admin/email");
  return String(doc._id);
}
export async function addWhatsAppContact(input: unknown) {
  await requireAdmin();
  const data = z.object({ name: z.string().trim().max(100), phone: z.string().trim().regex(/^\+[1-9]\d{7,14}$/), consent: z.literal(true) }).parse(input);
  await connectDB();
  await WhatsAppContact.updateOne({ phone: data.phone }, { $set: { name: data.name, active: true, consentAt: new Date() } }, { upsert: true });
  revalidatePath("/admin/email");
}
export async function setWhatsAppContactActive(id: string, active: boolean) {
  await requireAdmin();
  z.string().regex(/^[a-f\d]{24}$/i).parse(id);
  z.literal(false).parse(active);
  await connectDB();
  await WhatsAppContact.updateOne({ _id: id }, { $set: { active } });
  revalidatePath("/admin/email");
}
export async function sendWhatsAppCampaign(id: string, contactIds: string[]) {
  await requireAdmin();
  z.string().regex(/^[a-f\d]{24}$/i).parse(id);
  const ids = z.array(z.string().regex(/^[a-f\d]{24}$/i)).min(1).max(25).parse(contactIds);
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const version = process.env.WHATSAPP_GRAPH_VERSION;
  if (!token || !phoneId || !version || !/^v\d+\.\d+$/.test(version) || !/^\d+$/.test(phoneId)) throw new Error("WhatsApp is not configured. Add the server credentials first.");
  await connectDB();
  const contacts = await WhatsAppContact.find({ _id: { $in: ids }, active: true });
  if (!contacts.length) throw new Error("Select active WhatsApp contacts.");
  // Atomic claim prevents double-clicks or concurrent requests resending a campaign.
  const campaign = await MarketingCampaign.findOneAndUpdate({ _id: id, channel: "whatsapp", status: "draft", template: { $regex: /^[a-z0-9_]+$/ } }, { $set: { status: "sending" } }, { new: true });
  if (!campaign) throw new Error("Campaign is already submitted or its template name is invalid.");
  let accepted = 0;
  let failed = 0;
  for (const contact of contacts) {
    let result: { phone: string; messageId?: string; error?: string };
    try {
      const response = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify({ messaging_product: "whatsapp", to: contact.phone.replace(/^\+/, ""), type: "template", template: {
          name: campaign.template, language: { code: campaign.language },
          ...(campaign.parameters.length ? { components: [{ type: "body", parameters: campaign.parameters.map((text: string) => ({ type: "text", text })) }] } : {}),
        } }),
      });
      const data = await response.json();
      if (!response.ok || !data.messages?.[0]?.id) {
        failed++;
        result = { phone: contact.phone, error: `Provider rejected message (code ${data.error?.code ?? response.status}).` };
      } else {
        accepted++;
        result = { phone: contact.phone, messageId: data.messages[0].id };
      }
    } catch {
      failed++;
      result = { phone: contact.phone, error: "Provider response unavailable; verify in Meta before retrying." };
    }
    await MarketingCampaign.updateOne({ _id: id }, { $set: { accepted, failed }, $push: { results: result } });
  }
  await MarketingCampaign.updateOne({ _id: id }, { $set: { status: failed ? (accepted ? "partial" : "failed") : "submitted" } });
  revalidatePath("/admin/email");
  return { accepted, failed };
}

