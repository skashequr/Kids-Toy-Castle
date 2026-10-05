"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, MessageCircle, Users, Send, Plus, Search, ArrowRight, CheckCircle2, FileText, Loader2 } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { toggleSubscriber } from "@/server/actions/newsletter";
import { addWhatsAppContact, saveMarketingDraft, sendWhatsAppCampaign, setWhatsAppContactActive } from "@/server/actions/marketing";

export interface AdminSubscriberRow { id: string; email: string; name: string; subscribedAt: string; active: boolean }
interface Contact { id: string; name: string; phone: string; active: boolean }
interface Campaign { id: string; channel: string; subject: string; body: string; template: string; language: string; parameters: string[]; status: string; accepted: number; failed: number; date: string }
type Channel = "email" | "whatsapp";
const input = "w-full rounded-xl border border-sky-100 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100";
const button = "inline-flex items-center justify-center gap-2 rounded-xl bg-[#238dcc] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1b76ad] disabled:opacity-50 disabled:cursor-not-allowed";
const panel = "rounded-2xl border border-sky-100 bg-white shadow-sm";
const empty = { subject: "", body: "", template: "", language: "en_US", parameters: "" };

export function AdminEmailClient({ subscribers, contacts, campaigns, whatsappReady }: { subscribers: AdminSubscriberRow[]; contacts: Contact[]; campaigns: Campaign[]; whatsappReady: boolean }) {
  const router = useRouter();
  const [channel, setChannel] = useState<Channel>("email");
  const [tab, setTab] = useState("audience");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(empty);
  const [draftId, setDraftId] = useState<string>();
  const [selected, setSelected] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [addContact, setAddContact] = useState(false);
  const [contact, setContact] = useState({ name: "", phone: "", consent: false });
  const wa = channel === "whatsapp";
  const audience = wa ? contacts.map(c => ({ ...c, address: c.phone })) : subscribers.map(s => ({ ...s, address: s.email }));
  const active = audience.filter(c => c.active);
  const history = campaigns.filter(c => c.channel === channel);
  const filtered = audience.filter(c => `${c.name} ${c.address}`.toLowerCase().includes(search.toLowerCase()));
  const run = (action: () => Promise<void>) => {
    setError(""); setNotice("");
    startTransition(async () => {
      try { await action(); router.refresh(); }
      catch (e) { setError(e instanceof Error ? e.message : "Something went wrong. Please try again."); }
    });
  };
  const update = (key: keyof typeof empty, value: string) => { setForm(p => ({ ...p, [key]: value })); setDraftId(undefined); };
  const save = async () => {
    if (!form.subject.trim()) throw new Error("Enter a campaign name first.");
    if (draftId) return draftId;
    const id = await saveMarketingDraft({ ...form, channel, parameters: form.parameters ? form.parameters.split("\n").map(s => s.trim()).filter(Boolean) : [] });
    setDraftId(id); return id;
  };
  const switchChannel = (next: Channel) => { setChannel(next); setSearch(""); setForm(empty); setDraftId(undefined); setSelected([]); setNotice(""); setError(""); };

  return <div className="mx-auto max-w-7xl space-y-6 text-[#23557d]">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><p className="mb-1 text-xs font-bold uppercase tracking-[.2em] text-[#ee77a1]">Connect & grow</p><h1 className="text-2xl font-bold sm:text-3xl">Marketing studio</h1><p className="mt-2 text-sm text-slate-500">Keep your customers close. Make every message count.</p></div>
      <button disabled={pending} className={button} onClick={() => { setForm(empty); setDraftId(undefined); setTab("compose"); }}><Plus size={17} /> New campaign</button>
    </header>
    <div className="grid gap-4 sm:grid-cols-2">
      {([{ id: "email", title: "Email marketing", text: "News, launches & little surprises", icon: Mail }, { id: "whatsapp", title: "WhatsApp marketing", text: "Reach customers where they chat", icon: MessageCircle }] as const).map(c => <button disabled={pending} key={c.id} aria-pressed={channel === c.id} onClick={() => switchChannel(c.id)} className={cn("flex items-center gap-4 rounded-2xl border p-5 text-left transition", channel === c.id ? (c.id === "whatsapp" ? "border-emerald-300 bg-emerald-50" : "border-sky-300 bg-sky-50") : "border-sky-100 bg-white hover:border-sky-300")}><span className={cn("rounded-xl p-3", c.id === "whatsapp" ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-600")}><c.icon size={24} /></span><span className="flex-1"><span className="block font-bold">{c.title}</span><span className="mt-1 block text-xs text-slate-500">{c.text}</span></span><ArrowRight size={18} /></button>)}
    </div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[
      { label: "Total contacts", value: audience.length, icon: Users }, { label: "Active audience", value: active.length, icon: CheckCircle2 },
      { label: "Submitted campaigns", value: history.filter(c => ["submitted", "partial"].includes(c.status)).length, icon: Send }, { label: "Saved drafts", value: history.filter(c => c.status === "draft").length, icon: FileText },
    ].map(s => <div key={s.label} className={cn(panel, "p-4 sm:p-5")}><div className="mb-3 flex items-center justify-between"><span className="text-xs text-slate-500">{s.label}</span><s.icon size={17} className="text-sky-400" /></div><p className="text-2xl font-bold">{s.value}</p></div>)}</div>
    <div className={cn("flex items-start gap-3 rounded-xl border p-4 text-sm", wa && whatsappReady ? "border-emerald-100 bg-emerald-50 text-emerald-800" : "border-amber-100 bg-amber-50 text-amber-800")}><CheckCircle2 size={18} className="mt-0.5 shrink-0" /><div><p className="font-semibold">{wa ? (whatsappReady ? "WhatsApp is connected" : "Connect WhatsApp to start sending") : "Email drafts are ready"}</p><p className="mt-1 text-xs leading-relaxed">{wa ? "Send approved Meta templates to opted-in contacts. Provider acceptance is shown in history; delivery and read tracking are not connected." : "Create and save email campaigns. Sending is unavailable until an email provider is connected."}</p></div></div>
    <div role="status" aria-live="polite">{notice && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}{error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}</div>
    <div className="flex gap-6 border-b border-sky-100 overflow-x-auto">{["audience", "campaigns", "compose"].map(t => <button disabled={pending} key={t} onClick={() => setTab(t)} className={cn("border-b-2 px-1 pb-3 text-sm font-semibold capitalize", tab === t ? "border-sky-500 text-sky-600" : "border-transparent text-slate-400")}>{t}</button>)}</div>
    {tab === "audience" && <section className={panel}>
      <div className="flex flex-wrap items-center justify-between gap-4 p-5"><div><h2 className="font-bold">Your audience</h2><p className="mt-1 text-xs text-slate-500">{wa ? "Manage contacts who opted in to WhatsApp updates." : "Everyone subscribed to your newsletter."}</p></div><div className="flex flex-wrap gap-2"><label className="relative"><Search size={16} className="absolute left-3 top-3.5 text-slate-400" /><input aria-label="Search contacts" className={cn(input, "pl-9")} placeholder="Search contacts…" value={search} onChange={e => setSearch(e.target.value)} /></label>{wa && <button className={button} onClick={() => setAddContact(!addContact)}><Plus size={16} /> Add contact</button>}</div></div>
      {wa && addContact && <form className="mx-5 mb-5 space-y-3 rounded-xl bg-sky-50 p-4" onSubmit={e => { e.preventDefault(); run(async () => { await addWhatsAppContact(contact); setContact({ name: "", phone: "", consent: false }); setAddContact(false); setNotice("Contact saved."); }); }}><div className="grid gap-3 sm:grid-cols-2"><input aria-label="Contact name" className={input} placeholder="Contact name" maxLength={100} value={contact.name} onChange={e => setContact({ ...contact, name: e.target.value })} /><input aria-label="WhatsApp phone number" className={input} required pattern="\+[1-9][0-9]{7,14}" placeholder="+8801712345678" value={contact.phone} onChange={e => setContact({ ...contact, phone: e.target.value })} /></div><label className="flex items-center gap-2 text-xs"><input type="checkbox" required checked={contact.consent} onChange={e => setContact({ ...contact, consent: e.target.checked })} /> This contact agreed to receive WhatsApp marketing messages.</label><button disabled={pending} className={button}>Save contact</button></form>}
      <div className="overflow-x-auto"><table className="w-full min-w-[480px] text-left text-sm"><thead className="bg-sky-50/70 text-xs text-slate-500"><tr><th className="px-5 py-3">CONTACT</th><th className="px-5 py-3">CHANNEL</th><th className="px-5 py-3">STATUS</th><th className="px-5 py-3 text-right">ACTION</th></tr></thead><tbody>{filtered.map(c => <tr key={c.id} className="border-t border-sky-50"><td className="px-5 py-4"><p className="font-semibold">{c.name || "Unnamed contact"}</p><p className="mt-1 text-xs text-slate-500">{c.address}</p></td><td className="px-5 py-4 text-xs">{wa ? "WhatsApp" : "Email"}</td><td className="px-5 py-4"><span className={cn("rounded-full px-2 py-1 text-xs", c.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>{c.active ? "Active" : "Unsubscribed"}</span></td><td className="px-5 py-4 text-right"><button disabled={pending || (!c.active && wa)} className="text-xs font-semibold text-sky-600 disabled:opacity-40" onClick={() => run(async () => { if (wa) await setWhatsAppContactActive(c.id, false); else await toggleSubscriber(c.id, !c.active); setNotice("Contact updated."); })}>{c.active ? "Unsubscribe" : wa ? "Add again to opt in" : "Reactivate"}</button></td></tr>)}</tbody></table></div>
      {!filtered.length && <div className="p-12 text-center"><Users className="mx-auto mb-3 text-sky-300" size={32} /><p className="font-semibold">{search ? "No matching contacts" : "Your audience starts here"}</p><p className="mt-2 text-xs text-slate-500">{search ? "Try a different name or address." : wa ? "Add your first opted-in WhatsApp contact above." : "Newsletter subscribers will appear here."}</p></div>}<p className="border-t border-sky-50 px-5 py-3 text-xs text-slate-400">{filtered.length} contacts</p>
    </section>}
    {tab === "campaigns" && <section className="space-y-3">{history.length ? history.map(c => <article key={c.id} className={cn(panel, "flex flex-wrap items-center justify-between gap-4 p-5")}><div><div className="flex items-center gap-3"><h2 className="font-semibold">{c.subject}</h2><span className="rounded-full bg-sky-50 px-2 py-1 text-xs capitalize">{c.status}</span></div><p className="mt-2 text-xs text-slate-500">{formatDate(c.date)} · {c.accepted} accepted · {c.failed} failed / unconfirmed</p></div>{c.status === "draft" && <button className="text-sm font-semibold text-sky-600" onClick={() => { setForm({ subject: c.subject, body: c.body, template: c.template, language: c.language, parameters: c.parameters.join("\n") }); setDraftId(c.id); setTab("compose"); }}>Open draft →</button>}</article>) : <div className={cn(panel, "p-12 text-center")}><FileText size={32} className="mx-auto mb-3 text-sky-300" /><h2 className="font-bold">A fresh start for your campaigns</h2><p className="mt-2 text-sm text-slate-500">Your saved drafts and real campaign activity will appear here.</p><button className={cn(button, "mt-5")} onClick={() => setTab("compose")}>Create a campaign</button></div>}</section>}
    {tab === "compose" && <div className="grid items-start gap-6 xl:grid-cols-[1.4fr_1fr]">
      <form className={cn(panel, "space-y-5 p-5 sm:p-6")} onSubmit={e => { e.preventDefault(); run(async () => { await save(); setNotice("Draft saved successfully."); }); }}><h2 className="text-lg font-bold">Create your {wa ? "WhatsApp" : "email"} campaign</h2><fieldset disabled={pending} className="space-y-4">
        <label className="block text-sm font-semibold">{wa ? "Campaign name" : "Subject line"}<input className={cn(input, "mt-2")} required maxLength={200} placeholder="A little something for our favourite customers" value={form.subject} onChange={e => update("subject", e.target.value)} /></label>
        {wa && <><div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm font-semibold">Approved template<input className={cn(input, "mt-2")} placeholder="summer_offer" pattern="[a-z0-9_]+" value={form.template} onChange={e => update("template", e.target.value)} /></label><label className="block text-sm font-semibold">Template language<input className={cn(input, "mt-2")} placeholder="en_US" value={form.language} onChange={e => update("language", e.target.value)} /></label></div><label className="block text-sm font-semibold">Body variables, in order<textarea className={cn(input, "mt-2")} rows={3} placeholder={'One value per line, matching {{1}}, {{2}}…'} value={form.parameters} onChange={e => update("parameters", e.target.value)} /></label><p className="text-xs text-slate-500">Supports approved text-only templates with positional body variables. Template content is managed in Meta.</p></>}
        <label className="block text-sm font-semibold">{wa ? "Internal notes (not sent)" : "Email message"}<textarea className={cn(input, "mt-2 resize-y")} rows={wa ? 3 : 8} maxLength={10000} placeholder={wa ? "Describe this campaign for your team…" : "Share your latest news…"} value={form.body} onChange={e => update("body", e.target.value)} /></label>
        {wa && <div><p className="text-sm font-semibold">Recipients <span className="font-normal text-slate-400">({selected.length}/25 selected)</span></p><p className="my-2 text-xs text-slate-500">Choose up to 25 active contacts per campaign.</p><div className="max-h-48 space-y-2 overflow-auto rounded-xl border border-sky-100 p-3">{contacts.filter(c => c.active).map(c => <label key={c.id} className="flex gap-2 text-sm"><input type="checkbox" checked={selected.includes(c.id)} disabled={!selected.includes(c.id) && selected.length >= 25} onChange={e => setSelected(p => e.target.checked ? [...p, c.id] : p.filter(id => id !== c.id))} /><span>{c.name || c.phone}<span className="ml-2 text-xs text-slate-400">{c.name && c.phone}</span></span></label>)}{!contacts.some(c => c.active) && <p className="text-xs text-slate-500">Add active contacts in the Audience tab first.</p>}</div></div>}
        <div className="flex flex-wrap gap-3 border-t border-sky-50 pt-5"><button type="submit" className="rounded-xl border border-sky-200 px-5 py-3 text-sm font-semibold">Save draft</button><button type="button" disabled={!wa || !whatsappReady || !selected.length || !form.subject.trim() || !/^[a-z0-9_]+$/.test(form.template)} className={cn(button, wa && "bg-emerald-600 hover:bg-emerald-700")} onClick={() => run(async () => { const id = await save(); const result = await sendWhatsAppCampaign(id, selected); setNotice(`${result.accepted} accepted by WhatsApp, ${result.failed} failed or unconfirmed.`); setDraftId(undefined); setForm(empty); setTab("campaigns"); })}>{pending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} {wa ? "Send WhatsApp campaign" : "Email sending unavailable"}</button></div>
      </fieldset></form>
      <aside className={cn(panel, "overflow-hidden")}><div className="border-b border-sky-100 p-5"><h2 className="font-semibold">{wa ? "Message summary" : "Message preview"}</h2><p className="mt-1 text-xs text-slate-400">{wa ? "The approved Meta template determines the final message." : "A quick look before you save."}</p></div><div className={cn("p-6", wa ? "bg-emerald-50" : "bg-sky-50")}><div className="rounded-2xl bg-white p-5 shadow-sm"><p className="mb-4 text-xs font-bold uppercase tracking-widest text-sky-500">Kids Toy Castle</p><h3 className="break-words font-bold">{form.subject || "Your campaign title"}</h3><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-500">{wa ? `Template: ${form.template || "Not selected"}\nLanguage: ${form.language}\n\n${form.parameters ? `Body variables:\n${form.parameters}` : "No body variables"}` : form.body || "Your message will appear here as you write."}</p></div></div><div className="p-5 text-xs leading-relaxed text-slate-500">{wa ? `${selected.length} contacts selected. Only active, opted-in contacts will be sent this campaign.` : `${active.length} active newsletter subscribers. Your draft is saved securely for later.`}</div></aside>
    </div>}
  </div>;
}
