"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Tag,
  Zap, FileText, Image, Star, Mail, BarChart3,
  Settings, LogOut, ChevronRight, FolderOpen, Truck
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Finance", href: "/admin/finance", icon: BarChart3 },
  { label: "Categories", href: "/admin/categories", icon: FolderOpen },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Delivery", href: "/admin/delivery", icon: Truck },
  { label: "Inventory", href: "/admin/inventory", icon: Package },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Coupons", href: "/admin/coupons", icon: Tag },
  { label: "Flash Sales", href: "/admin/flash-sales", icon: Zap },
  { label: "Blog", href: "/admin/blog", icon: FileText },
  { label: "Banners", href: "/admin/banners", icon: Image },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Email & WhatsApp", href: "/admin/email", icon: Mail },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();

  const handleLogout = () => {
    signOut({ callbackUrl: "/admin/login" });
  };

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <aside className="sticky top-0 h-screen w-64 flex flex-shrink-0 flex-col border-r border-[#cce8fa] bg-white shadow-[8px_0_26px_rgba(52,136,189,.06)]">
      {/* Logo */}
      <div className="border-b border-[#e3f1fa] px-5 py-5">
        <div className="flex items-center gap-3">
          <span role="img" aria-label="Kids Toy Castle logo" className="h-10 w-10 rounded-xl bg-cover bg-center shadow-sm ring-2 ring-[#ff8dbb]/50" style={{ backgroundImage: "url('/favicon.ico')" }} />
          <div>
            <span className="block font-serif text-base font-bold tracking-[.03em] text-[#1b588b]">KIDS TOY CASTLE</span>
            <span className="text-[9px] font-bold tracking-[.18em] text-[#f05f9a] uppercase">Admin Panel</span>
          </div>
        </div>
      </div>

      {/* Admin info */}
      <div className="border-b border-[#e3f1fa] px-4 py-4">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#ffe0ed]">
            <span className="text-xs font-bold text-[#d84682]">A</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-[#23557d]">Admin</p>
            <p className="truncate text-[10px] text-[#7895aa]">{email}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-[#dff3ff] text-[#1d76af] shadow-[0_4px_12px_rgba(41,151,220,.12)]"
                  : "text-[#54758e] hover:bg-[#fff1f6] hover:text-[#d84682]"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-[#e3f1fa] px-3 py-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#54758e] transition-all hover:bg-[#fff1f6] hover:text-[#d84682]"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
