"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";

export function AccountClient() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isAdmin = isAuthenticated && (session?.user as any)?.role === "ADMIN";

  if (status === "loading") {
    return (
      <div className="container mx-auto px-4 py-24">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-navy/10 bg-white p-10 shadow-card">
          <p className="text-center text-sm text-muted">Checking your session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-24">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-navy/10 bg-white p-10 shadow-card">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gold/10 text-gold">
              <Heart className="h-10 w-10" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-navy">Sign in or register</h1>
            <p className="mx-auto mt-4 max-w-xl text-sm text-muted">
              Access your profile, order history, wishlist, and faster checkout by signing in.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full bg-navy px-6 py-3 text-sm font-semibold text-ivory hover:bg-navy-light transition"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full border border-navy/10 bg-transparent px-6 py-3 text-sm font-semibold text-navy hover:border-gold hover:text-gold transition"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-navy/10 bg-white p-10 shadow-card">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-serif font-bold text-navy mb-2">Welcome back, {session.user?.name ?? "customer"}</h1>
            <p className="text-sm text-muted">You are signed in with {session.user?.email}.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {isAdmin ? (
              <Button variant="outline" href="/admin">
                Dashboard
              </Button>
            ) : (
              <Button variant="outline" href="/">
                Continue shopping
              </Button>
            )}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-red-600 px-6 text-sm font-semibold text-white hover:bg-red-700 transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
