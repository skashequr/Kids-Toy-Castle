"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, ArrowRight, ArrowLeft, Castle, Sparkles, ShieldCheck, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
        callbackUrl: "/admin",
      });
      if (res?.error) {
        setError(res.error === "CredentialsSignin"
          ? "Invalid email or password."
          : "Unable to connect to the login service. Please try again.");
      } else if (res?.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        setError("Sign in could not be completed. Please try again.");
      }
    } catch {
      setError("Unable to connect to the login service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "h-13 w-full rounded-2xl border border-[#d7e7f1] bg-[#f8fcff] pl-12 pr-4 text-base text-[#24445b] outline-none transition placeholder:text-[#8aa0b1] focus:border-[#238fda] focus:ring-4 focus:ring-[#238fda]/10 disabled:opacity-60";

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#f2fbff] px-4 py-8 text-[#24445b] [color-scheme:light] sm:px-8 sm:py-12">
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#dff2ff] blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-[#ffe7f0] blur-3xl" />
      <div className="relative w-full max-w-5xl">
        <Link href="/" className="mb-6 inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-medium text-[#617e93] transition hover:text-[#238fda] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#238fda]"><ArrowLeft className="h-4 w-4" />Back to store</Link>
        <div className="grid overflow-hidden rounded-[2rem] border border-[#d8edf9] bg-white shadow-[0_24px_80px_rgba(46,128,179,.12)] lg:grid-cols-[.95fr_1.05fr]">
          <section className="relative flex flex-col justify-between overflow-hidden bg-[#238fda] p-7 text-white sm:p-10 lg:p-12">
            <div aria-hidden="true" className="absolute -right-24 top-20 h-72 w-72 rounded-full border-[45px] border-white/5" />
            <div className="relative flex items-center gap-3"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15"><Castle className="h-7 w-7" /></span><div><p className="text-lg font-bold tracking-tight">Kids Toy Castle</p><p className="mt-0.5 text-[10px] font-bold uppercase tracking-[.22em] text-[#d8efff]">Admin workspace</p></div></div>
            <div className="relative my-12 hidden lg:block">
              <div aria-hidden="true" className="mb-8 flex h-24 w-24 -rotate-6 items-center justify-center rounded-[1.75rem] bg-[#ffe58a] text-[#267eb8] shadow-[10px_10px_0_rgba(255,255,255,.12)]"><Castle className="h-12 w-12" strokeWidth={1.5} /></div>
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#ffe58a]"><Sparkles className="h-4 w-4" />A little play. A lot of possibility.</span>
              <h2 className="mt-4 text-4xl font-bold leading-tight tracking-tight">Big smiles start<br />behind the scenes.</h2>
              <p className="mt-5 max-w-xs text-sm leading-7 text-[#e0f2ff]">Your products, orders and customer stories — all together in one happy place.</p>
            </div>
            <p className="relative hidden items-center gap-2 text-xs text-[#e0f2ff] lg:flex"><ShieldCheck className="h-4 w-4" />Store management, made simple.</p>
          </section>

          <section aria-labelledby="login-title" className="p-6 sm:p-10 lg:p-12">
            <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff0f6] text-[#d64f86]"><Lock className="h-5 w-5" /></div>
            <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#238fda]">Welcome back</p>
            <h1 id="login-title" className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Sign in to your store</h1>
            <p className="mt-3 text-sm leading-6 text-[#6f8799]">Enter your admin details to pick up where you left off.</p>

            <form onSubmit={handleSubmit} aria-busy={loading} className="mt-8 space-y-5">
              {error && <div id="login-error" role="alert" className="rounded-xl border border-[#f4c9d7] bg-[#fff1f5] p-3.5 text-sm leading-6 text-[#b23761]">{error}</div>}
              <div>
                <label htmlFor="admin-email" className="mb-2 block text-sm font-semibold">Email address</label>
                <div className="relative"><Mail aria-hidden="true" className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-[#8aa6b9]" /><input id="admin-email" name="email" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} value={email} onChange={e => setEmail(e.target.value)} disabled={loading} required placeholder="you@example.com" aria-describedby={error ? "login-error" : undefined} className={inputClass} /></div>
              </div>
              <div>
                <label htmlFor="admin-password" className="mb-2 block text-sm font-semibold">Password</label>
                <div className="relative"><Lock aria-hidden="true" className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-[#8aa6b9]" /><input id="admin-password" name="password" type={showPass ? "text" : "password"} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} required placeholder="Enter your password" aria-describedby={error ? "login-error" : undefined} className={`${inputClass} pr-14`} /><button type="button" aria-label={showPass ? "Hide password" : "Show password"} aria-pressed={showPass} aria-controls="admin-password" onClick={() => setShowPass(value => !value)} className="absolute right-1.5 top-1.5 flex h-10 w-10 items-center justify-center rounded-xl text-[#7b96a9] transition hover:bg-[#e2f4ff] hover:text-[#238fda] focus-visible:outline-2 focus-visible:outline-[#238fda]">{showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
              </div>
              <button type="submit" disabled={loading} className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#d94680] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(217,70,128,.2)] transition hover:bg-[#c7356e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d94680] disabled:cursor-wait disabled:opacity-65">{loading ? <><Loader2 className="h-4 w-4 animate-spin" />Signing in…</> : <>Sign in<ArrowRight className="h-4 w-4" /></>}</button>
            </form>
            <div className="mt-8 flex items-start gap-2 border-t border-[#e7f1f7] pt-5 text-xs leading-5 text-[#7892a5]"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /><p>This workspace is for authorized store administrators.</p></div>
          </section>
        </div>
        <p className="mt-6 text-center text-xs text-[#7892a5]">Kids Toy Castle · A little world of wonder</p>
      </div>
    </div>
  );
}
