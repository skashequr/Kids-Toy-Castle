
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  Sun,
  Moon,
  Globe,
  ChevronDown,
  Phone,
  Truck,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { useUIStore } from "@/store/ui";
import { NAV_MENU } from "@/lib/data";
import { useSession } from "next-auth/react";
import { useStoreInformation } from "@/components/store-information-provider";
import { storePhoneHref } from "@/lib/store-information";

type NavMenuChild = {
  label: string;
  href: string;
};

type NavMenuItem = {
  label: string;
  href: string;
  badge?: string;
  children: NavMenuChild[];
};

const typedNavMenu: NavMenuItem[] = NAV_MENU as NavMenuItem[];

export function Header() {
  const store = useStoreInformation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  const pathname = usePathname();
  const searchRef = useRef<HTMLInputElement>(null);
  const { data: session, status } = useSession();

  const { getItemCount, openCart } = useCartStore();
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const isAdmin = status === "authenticated" && (session?.user as any)?.role === "ADMIN";
  const accountHref = status === "authenticated" ? (isAdmin ? "/admin" : "/account") : "/login";

  const {
    isDarkMode,
    language,
    toggleDarkMode,
    setLanguage,
    isSearchOpen,
    openSearch,
    closeSearch,
    isMobileMenuOpen,
    openMobileMenu,
    closeMobileMenu,
  } = useUIStore();

  // Hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  const cartCount = mounted ? getItemCount() : 0;

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Close menus when pathname changes
  useEffect(() => {
    closeMobileMenu();
    closeSearch();
    setActiveMenu(null);
  }, [pathname, closeMobileMenu, closeSearch]);

  // Focus search
  useEffect(() => {
    if (isSearchOpen) {
      searchRef.current?.focus();
    }
  }, [isSearchOpen]);

  return (
    <>
      {/* =====================================================
          ANNOUNCEMENT BAR
      ====================================================== */}
     

      {/* =====================================================
          MAIN HEADER
      ====================================================== */}
      <header
        className={cn(
          "sticky top-0 z-50 w-full",
          "bg-[#fffdf8]/95 backdrop-blur-xl",
          "transition-all duration-300",
          isScrolled &&
          "border-b border-[#d9ceb9] shadow-[0_8px_30px_rgba(23,43,54,0.08)]"
        )}
      >
        {/* =================================================
            UTILITY BAR
        ================================================== */}
        <div className="hidden md:block border-b border-slate-900/5">
          <div className="container mx-auto px-4">
            <div className="flex h-9 items-center justify-between text-[11px] font-medium text-slate-500">
              <div className="flex items-center gap-5">
                <Link
                  href="/track-order"
                  className="transition-colors hover:text-[#bd9144]"
                >
                  Track Order
                </Link>

                <Link
                  href="/blog"
                  className="transition-colors hover:text-[#bd9144]"
                >
                  Blog
                </Link>

                <Link
                  href="/become-a-partner"
                  className="transition-colors hover:text-[#bd9144]"
                >
                  Become a Partner
                </Link>
              </div>

              <div className="flex items-center gap-5">
                <a
                  href={storePhoneHref(store.phone) || "/contact"}
                  className="flex items-center gap-1.5 transition-colors hover:text-[#bd9144]"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {store.phone || "Contact"}
                </a>

                <button
                  type="button"
                  onClick={() =>
                    setLanguage(language === "en" ? "bn" : "en")
                  }
                  className="flex items-center gap-1.5 transition-colors hover:text-[#bd9144]"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {language === "en" ? "বাংলা" : "English"}
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            MAIN NAVIGATION
        ================================================== */}
        <div className="container mx-auto px-4">
          <div className="flex h-[70px] items-center gap-3 lg:h-[84px] lg:gap-5">
            {/* Mobile menu */}
            <button
              type="button"
              onClick={() =>
                isMobileMenuOpen
                  ? closeMobileMenu()
                  : openMobileMenu()
              }
              aria-label="Toggle menu"
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center",
                "rounded-xl bg-[#ead0c5]",
                "transition-all duration-200",
                "hover:bg-[#e7ca86]",
                "active:scale-95",
                "lg:hidden"
              )}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 text-slate-800" />
              ) : (
                <Menu className="h-5 w-5 text-slate-800" />
              )}
            </button>

            {/* =================================================
                LOGO
            ================================================== */}
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2"
              aria-label={`${store.storeName} home`}
            >
              <span
                role="img"
                aria-label={`${store.storeName} logo`}
                className="h-11 w-11 rounded-full bg-white bg-cover bg-center shadow-sm ring-2 ring-[#ff8dbb]/50"
                style={{ backgroundImage: `url(${JSON.stringify(store.logo)})` }}
              />
              <span className="hidden max-w-56 font-serif text-lg font-bold tracking-[.04em] text-[#175a9f] sm:block">{store.storeName}</span>
            </Link>

            {/* =================================================
                DESKTOP NAV
            ================================================== */}
            <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
              {typedNavMenu.map((item) => (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => {
                    if (item.children.length > 0) {
                      setActiveMenu(item.label);
                    }
                  }}
                  onMouseLeave={() => {
                    setActiveMenu(null);
                  }}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "relative flex items-center gap-1.5",
                      "rounded-xl px-3 py-2.5 xl:px-4",
                      "text-sm font-semibold",
                      "text-slate-700",
                      "transition-all duration-200",
                      "hover:bg-[#F7B3BC]/30",
                      "hover:text-slate-900",
                      pathname === item.href &&
                      "text-slate-900"
                    )}
                  >
                    {item.label}

                    {item.badge && (
                      <span
                        className={cn(
                          "ml-1 rounded-full px-2 py-0.5",
                          "text-[9px] font-bold uppercase",
                          item.badge === "New"
                            ? "bg-[#F7B3BC] text-slate-800"
                            : "bg-[#F6DD83] text-slate-800"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}

                    {item.children.length > 0 && (
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 transition-transform duration-200",
                          activeMenu === item.label &&
                          "rotate-180"
                        )}
                      />
                    )}

                    {/* Active underline */}
                    {pathname === item.href && (
                      <span className="absolute bottom-0 left-1/2 h-[3px] w-7 -translate-x-1/2 rounded-full bg-[#F6DD83]" />
                    )}
                  </Link>

                  {/* =================================================
                      DROPDOWN
                  ================================================== */}
                  {item.children.length > 0 &&
                    activeMenu === item.label && (
                      <div
                        className={cn(
                          "absolute left-0 top-full z-50 mt-2",
                          "min-w-[220px]",
                          "overflow-hidden rounded-2xl",
                          "border border-[#A0D5E5]/30",
                          "bg-[#FAF8EA]",
                          "shadow-[0_18px_50px_rgba(30,50,60,0.14)]"
                        )}
                      >
                        <div className="h-1 bg-[#F6DD83]" />

                        <div className="p-2">
                          {item.children.map((child) => (
                            <Link
                              key={child.label}
                              href={child.href}
                              className={cn(
                                "block rounded-xl px-4 py-3",
                                "text-sm font-medium text-slate-700",
                                "transition-all duration-200",
                                "hover:bg-[#F7B3BC]/40",
                                "hover:text-slate-900"
                              )}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              ))}
            </nav>

            {/* =================================================
                ACTION BUTTONS
            ================================================== */}
            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              {/* Search */}
              <button
                type="button"
                onClick={() =>
                  isSearchOpen ? closeSearch() : openSearch()
                }
                aria-label="Search"
                className={cn(
                  "flex h-10 w-10 items-center justify-center",
                  "rounded-xl border border-slate-900/5",
                  "bg-white/40",
                  "text-slate-800",
                  "transition-all duration-200",
                  "hover:border-[#F7B3BC]",
                  "hover:bg-[#F7B3BC]/40",
                  "active:scale-95"
                )}
              >
                <Search className="h-[18px] w-[18px] text-slate-800" />
              </button>

              {/* Dark mode */}
              <button
                type="button"
                onClick={toggleDarkMode}
                aria-label="Toggle dark mode"
                className={cn(
                  "flex h-10 w-10 items-center justify-center",
                  "rounded-xl border border-slate-900/5",
                  "bg-white/40",
                  "text-slate-800",
                  "transition-all duration-200",
                  "hover:border-[#F6DD83]",
                  "hover:bg-[#F6DD83]/50",
                  "active:scale-95"
                )}
              >
                {isDarkMode ? (
                  <Sun className="h-[18px] w-[18px] text-slate-800" />
                ) : (
                  <Moon className="h-[18px] w-[18px] text-slate-800" />
                )}
              </button>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                aria-label="Wishlist"
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center",
                  "rounded-xl border border-slate-900/5",
                  "bg-white/40",
                  "text-slate-800",
                  "transition-all duration-200",
                  "hover:border-[#F7B3BC]",
                  "hover:bg-[#F7B3BC]/40",
                  "active:scale-95"
                )}
              >
                <Heart className="h-[18px] w-[18px]" />

                {mounted && wishlistCount > 0 && (
                  <span
                    className={cn(
                      "absolute -right-1.5 -top-1.5",
                      "flex h-5 min-w-5 items-center justify-center",
                      "rounded-full bg-[#F7B3BC]",
                      "px-1 text-[10px] font-bold text-slate-800",
                      "ring-2 ring-[#FAF8EA]"
                    )}
                  >
                    {wishlistCount > 9
                      ? "9+"
                      : wishlistCount}
                  </span>
                )}
              </Link>

              {/* Account */}
              <Link
                href={accountHref}
                aria-label={status === "authenticated" ? (isAdmin ? "Admin dashboard" : "My account") : "Login"}
                className={cn(
                  "flex h-10 w-10 items-center justify-center",
                  "rounded-xl border border-slate-900/5",
                  "bg-white/40",
                  "text-slate-800",
                  "transition-all duration-200",
                  "hover:border-[#A0D5E5]",
                  "hover:bg-[#A0D5E5]/30",
                  "active:scale-95"
                )}
              >
                <User className="h-[18px] w-[18px] text-slate-800" />
              </Link>

              {/* Cart */}
              <button
                type="button"
                onClick={openCart}
                aria-label="Cart"
                className={cn(
                  "relative flex h-10 min-w-10 items-center justify-center gap-2",
                  "rounded-xl px-3",
                  "bg-[#F6DD83]",
                  "font-semibold text-slate-800",
                  "shadow-sm",
                  "transition-all duration-200",
                  "hover:bg-[#F7B3BC]",
                  "hover:-translate-y-0.5",
                  "hover:shadow-md",
                  "active:scale-95"
                )}
              >
                <ShoppingBag className="h-[18px] w-[18px]" />

                {mounted && cartCount > 0 && (
                  <span className="text-sm font-bold">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* =================================================
              SEARCH BAR
          ================================================== */}
          {isSearchOpen && (
            <div className="pb-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#A0D5E5]" />

                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(event.target.value)
                  }
                  placeholder="খেলনা খুঁজুন..."
                  className={cn(
                    "h-12 w-full rounded-2xl",
                    "border border-[#A0D5E5]/40",
                    "bg-white/50",
                    "pl-12 pr-12",
                    "text-sm text-slate-800",
                    "placeholder:text-slate-400",
                    "outline-none",
                    "transition-all duration-200",
                    "focus:border-[#A0D5E5]",
                    "focus:ring-4 focus:ring-[#A0D5E5]/15"
                  )}
                  onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
                    if (event.key === "Escape") {
                      closeSearch();
                    }

                    if (
                      event.key === "Enter" &&
                      searchQuery.trim().length > 0
                    ) {
                      const query = encodeURIComponent(searchQuery.trim());
                      window.location.href = `/search?q=${query}`;
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={closeSearch}
                  aria-label="Close search"
                  className={cn(
                    "absolute right-3 top-1/2",
                    "flex h-8 w-8 -translate-y-1/2",
                    "items-center justify-center",
                    "rounded-lg transition-colors",
                    "hover:bg-[#F7B3BC]/50"
                  )}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {searchQuery && (
                <div
                  className={cn(
                    "mt-2 rounded-xl",
                    "border border-[#A0D5E5]/20",
                    "bg-[#FAF8EA]",
                    "p-3",
                    "text-sm",
                    "shadow-md"
                  )}
                >
                  <p className="text-slate-500">
                    Press Enter to search for{" "}
                    <span className="font-semibold text-slate-800">
                      "{searchQuery}"
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* =====================================================
          MOBILE MENU OVERLAY
      ====================================================== */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={closeMobileMenu}
          />

          {/* Drawer */}
          <div
            className={cn(
              "absolute left-0 top-0",
              "h-full w-[320px] max-w-[88vw]",
              "overflow-y-auto",
              "bg-[#FAF8EA]",
              "shadow-[10px_0_50px_rgba(30,50,60,0.18)]"
            )}
          >
            {/* Mobile header */}
            <div
              className={cn(
                "sticky top-0 z-10",
                "flex items-center justify-between",
                "border-b border-[#A0D5E5]/20",
                "bg-[#FAF8EA]",
                "px-5 py-5"
              )}
            >
              <Link
                href="/"
                onClick={closeMobileMenu}
                className="flex items-center gap-3"
              >
                <span
                  role="img"
                  aria-label={`${store.storeName} logo`}
                  className="h-11 w-11 rounded-full bg-white bg-cover bg-center shadow-sm ring-2 ring-[#ff8dbb]/50"
                  style={{ backgroundImage: `url(${JSON.stringify(store.logo)})` }}
                />
                <span className="font-serif text-xl font-bold tracking-[.04em] text-[#175a9f]">{store.storeName}</span>
              </Link>

              <button
                type="button"
                onClick={closeMobileMenu}
                aria-label="Close menu"
                className={cn(
                  "flex h-9 w-9 items-center justify-center",
                  "rounded-xl bg-[#F7B3BC]/70",
                  "transition-colors",
                  "hover:bg-[#F7B3BC]"
                )}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="p-4">
              <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Navigation
              </div>

              <div className="space-y-1">
                {typedNavMenu.map((item) => (
                  <div key={item.label}>
                    <Link
                      href={item.href}
                      onClick={closeMobileMenu}
                      className={cn(
                        "flex items-center justify-between",
                        "rounded-xl px-4 py-3.5",
                        "font-semibold",
                        "transition-colors duration-200",
                        pathname === item.href
                          ? "bg-[#F6DD83]/70 text-slate-900"
                          : "text-slate-700",
                        "hover:bg-[#F7B3BC]/40",
                        "hover:text-slate-900"
                      )}
                    >
                      <span>{item.label}</span>

                      <span className="flex items-center gap-2">
                        {item.badge && (
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5",
                              "text-[9px] font-bold",
                              item.badge === "New"
                                ? "bg-[#F7B3BC]"
                                : "bg-[#F6DD83]"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}

                        {item.children.length > 0 && (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </span>
                    </Link>

                    {/* Children */}
                    {item.children.length > 0 && (
                      <div className="ml-5 mt-1 space-y-0.5 border-l-2 border-[#A0D5E5]/30 pl-2">
                        {item.children.map((child) => (
                          <Link
                            key={child.label}
                            href={child.href}
                            onClick={closeMobileMenu}
                            className={cn(
                              "block rounded-lg px-4 py-2.5",
                              "text-sm text-slate-500",
                              "transition-colors",
                              "hover:bg-[#A0D5E5]/20",
                              "hover:text-slate-800"
                            )}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </nav>

            {/* Account */}
            <div className="mx-4 border-t border-[#A0D5E5]/20 pt-4">
              <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                My Space
              </div>

              <div className="space-y-1">
                <Link
                  href="/account"
                  onClick={closeMobileMenu}
                  className={cn(
                    "flex items-center gap-3",
                    "rounded-xl px-4 py-3",
                    "text-sm font-medium text-slate-700",
                    "transition-colors",
                    "hover:bg-[#A0D5E5]/25"
                  )}
                >
                  <User className="h-5 w-5 text-[#A0D5E5]" />
                  My Account
                </Link>

                <Link
                  href="/wishlist"
                  onClick={closeMobileMenu}
                  className={cn(
                    "flex items-center justify-between",
                    "rounded-xl px-4 py-3",
                    "text-sm font-medium text-slate-700",
                    "transition-colors",
                    "hover:bg-[#F7B3BC]/30"
                  )}
                >
                  {/* <span className="flex items-center gap-3">
                    <Heart className="h-5 w-5 text-[#F7B3BC]" />
                    Wishlist
                  </span> */}

                  {mounted && wishlistCount > 0 && (
                    <span className="rounded-full bg-[#F7B3BC] px-2 py-0.5 text-xs font-bold">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                <button
                  type="button"
                  onClick={toggleDarkMode}
                  className={cn(
                    "flex w-full items-center gap-3",
                    "rounded-xl px-4 py-3",
                    "text-left text-sm font-medium text-slate-700",
                    "transition-colors",
                    "hover:bg-[#F6DD83]/40"
                  )}
                >
                  {isDarkMode ? (
                    <Sun className="h-5 w-5 text-[#F6DD83]" />
                  ) : (
                    <Moon className="h-5 w-5 text-[#A0D5E5]" />
                  )}

                  {isDarkMode ? "Light Mode" : "Dark Mode"}
                </button>
              </div>
            </div>

            {/* Help card */}
            <div className="p-4">
              <div className="rounded-2xl border border-[#A0D5E5]/30 bg-[#A0D5E5]/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F6DD83]">
                    <Phone className="h-4 w-4 text-slate-800" />
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-500">
                      Need Help?
                    </p>

                    <a
                      href={storePhoneHref(store.phone) || "/contact"}
                      className="text-sm font-bold text-slate-800"
                    >
                      {store.phone || "Contact"}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
