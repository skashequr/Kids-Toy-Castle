"use client";

import { useStorePrice } from "@/components/store-information-provider";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  SlidersHorizontal,
  LayoutGrid,
  List,
  ChevronDown,
  X,
  Star,
} from "lucide-react";
import { ProductCard } from "./product-card";
import { WhatsAppOrderButton } from "./whatsapp-order-button";
import type { Product, Category, FilterState } from "@/types";
import { cn } from "@/lib/utils";
import { richTextToPlainText } from "@/components/ui/rich-text";

interface ProductListingClientProps {
  initialProducts: Product[];
  category?: Category;
}

const SORT_OPTIONS = [
  { label: "Store order", value: "store-order" },
  { label: "Newest", value: "newest" },
  { label: "Most Popular", value: "popular" },
  { label: "Best Selling", value: "best-selling" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
] as const;

const PRICE_RANGES = [
  { label: "Under ৳2,000", min: 0, max: 2000 },
  { label: "৳2,000 – ৳5,000", min: 2000, max: 5000 },
  { label: "৳5,000 – ৳10,000", min: 5000, max: 10000 },
  { label: "৳10,000 – ৳20,000", min: 10000, max: 20000 },
  { label: "Over ৳20,000", min: 20000, max: Infinity },
];

export function ProductListingClient({
  initialProducts,
  category,
}: ProductListingClientProps) {
  const formatPrice = useStorePrice();
  const [filters, setFilters] = useState<FilterState>({
    sortBy: "store-order",
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [priceRange, setPriceRange] = useState<{
    min?: number;
    max?: number;
  }>({});

  /* ================= FILTER PRODUCTS ================= */

  const filtered = useMemo(() => {
    let result = [...initialProducts];

    if (filters.inStock) {
      result = result.filter((p) => p.stock > 0);
    }

    if (filters.rating) {
      result = result.filter(
        (p) => p.rating >= filters.rating!
      );
    }

    if (priceRange.min !== undefined) {
      result = result.filter(
        (p) => p.price >= priceRange.min!
      );
    }

    if (priceRange.max !== undefined) {
      result = result.filter(
        (p) => p.price <= priceRange.max!
      );
    }

    if (filters.color?.length) {
      result = result.filter((p) =>
        p.variants?.some(
          (v) =>
            v.color &&
            filters.color!.includes(v.color)
        )
      );
    }

    if (filters.size?.length) {
      result = result.filter((p) =>
        p.variants?.some(
          (v) =>
            v.size &&
            filters.size!.includes(v.size)
        )
      );
    }

    switch (filters.sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;

      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;

      case "best-selling":
        result.sort(
          (a, b) => b.reviewCount - a.reviewCount
        );
        break;

      case "popular":
        result.sort(
          (a, b) => b.rating - a.rating
        );
        break;

      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        );
        break;
    }

    return result;
  }, [initialProducts, filters, priceRange]);

  /* ================= AVAILABLE FILTERS ================= */

  const allColors = [
    ...new Set(
      initialProducts.flatMap(
        (p) =>
          p.variants
            ?.filter((v) => v.color)
            .map((v) => v.color!) ?? []
      )
    ),
  ];

  const allSizes = [
    ...new Set(
      initialProducts.flatMap(
        (p) =>
          p.variants
            ?.filter((v) => v.size)
            .map((v) => v.size!) ?? []
      )
    ),
  ];

  /* ================= ACTIVE FILTER COUNT ================= */

  const activeFilterCount =
    (filters.inStock ? 1 : 0) +
    (filters.rating ? 1 : 0) +
    (filters.color?.length ?? 0) +
    (filters.size?.length ?? 0) +
    (priceRange.min !== undefined ? 1 : 0);

  /* ================= ARRAY FILTER ================= */

  const toggleArrayFilter = <K extends keyof FilterState>(
    key: K,
    value: string
  ) => {
    setFilters((prev) => {
      const current =
        (prev[key] as string[] | undefined) ?? [];

      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];

      return {
        ...prev,
        [key]: updated.length
          ? updated
          : undefined,
      };
    });
  };

  /* ================= CLEAR FILTERS ================= */

  const clearFilters = () => {
    setFilters({ sortBy: "store-order" });
    setPriceRange({});
  };

  return (
    <div className="container mx-auto px-4 py-8 lg:py-10">

      {/* ================================================= */}
      {/* TOOLBAR */}
      {/* ================================================= */}

      <div
        className={cn(
          "flex flex-col sm:flex-row",
          "sm:items-center sm:justify-between",
          "gap-4 mb-7",
          "pb-5 border-b border-[#A0D5E5]/30"
        )}
      >
        {/* Left */}

        <div className="flex items-center gap-3">

          <button
            type="button"
            onClick={() =>
              setIsFilterOpen(!isFilterOpen)
            }
            className={cn(
              "inline-flex items-center gap-2",
              "px-4 py-2.5 rounded-xl",
              "border",
              "text-sm font-semibold",
              "transition-all duration-200",

              isFilterOpen
                ? "bg-[#F6DD83] border-[#F6DD83] text-[#2f3a3d]"
                : "bg-[#FAF8EA] border-[#A0D5E5]/50 text-[#2f3a3d]",

              "hover:bg-[#F7B3BC]",
              "hover:border-[#F7B3BC]"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />

            Filters

            {activeFilterCount > 0 && (
              <span className="min-w-5 h-5 px-1 rounded-full bg-[#F7B3BC] text-[#2f3a3d] text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          <span className="text-[#6f7779] text-sm">
            {filtered.length}{" "}
            {filtered.length === 1
              ? "product"
              : "products"}
          </span>
        </div>

        {/* Right */}

        <div className="flex items-center gap-3">

          {/* View Mode */}

          <div
            className={cn(
              "hidden sm:flex overflow-hidden",
              "rounded-xl border",
              "border-[#A0D5E5]/50"
            )}
          >
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
              className={cn(
                "p-2.5 transition-all",

                viewMode === "grid"
                  ? "bg-[#F6DD83] text-[#2f3a3d]"
                  : "bg-[#FAF8EA] text-[#6f7779] hover:bg-[#F7B3BC]"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setViewMode("list")}
              aria-label="List view"
              className={cn(
                "p-2.5 transition-all",

                viewMode === "list"
                  ? "bg-[#F6DD83] text-[#2f3a3d]"
                  : "bg-[#FAF8EA] text-[#6f7779] hover:bg-[#F7B3BC]"
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Sort */}

          <div className="relative">

            <select
              value={filters.sortBy ?? "store-order"}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  sortBy:
                    e.target.value as FilterState["sortBy"],
                }))
              }
              className={cn(
                "appearance-none",
                "pl-4 pr-9 py-2.5",
                "rounded-xl",
                "border border-[#A0D5E5]/50",
                "bg-[#FAF8EA]",
                "text-[#2f3a3d]",
                "text-sm font-medium",
                "focus:outline-none",
                "focus:border-[#F6DD83]",
                "focus:ring-2 focus:ring-[#F6DD83]/20",
                "cursor-pointer"
              )}
            >
              {SORT_OPTIONS.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                >
                  {opt.label}
                </option>
              ))}
            </select>

            <ChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6f7779] pointer-events-none"
            />

          </div>
        </div>
      </div>

      {/* ================================================= */}
      {/* MAIN CONTENT */}
      {/* ================================================= */}

      <div className="flex gap-7">

        {/* ================================================= */}
        {/* FILTER SIDEBAR */}
        {/* ================================================= */}

        {isFilterOpen && (
          <aside className="hidden lg:block w-64 flex-shrink-0">

            <div
              className={cn(
                "sticky top-24",
                "rounded-2xl",
                "bg-[#FAF8EA]",
                "border border-[#A0D5E5]/40",
                "p-5",
                "space-y-7"
              )}
            >

              {/* Header */}

              <div className="flex items-center justify-between">

                <div>
                  <h3 className="font-bold text-[#2f3a3d]">
                    Filters
                  </h3>

                  <p className="text-[11px] text-[#6f7779] mt-0.5">
                    Refine your selection
                  </p>
                </div>

                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-xs font-semibold text-[#A0D5E5] hover:text-[#2f3a3d] transition-colors"
                  >
                    Clear All
                  </button>
                )}

              </div>

              {/* Divider */}

              <div className="h-px bg-[#A0D5E5]/25" />

              {/* ================= STOCK ================= */}

              <div>

                <label className="flex items-center gap-3 cursor-pointer group">

                  <input
                    type="checkbox"
                    checked={filters.inStock ?? false}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        inStock:
                          e.target.checked ||
                          undefined,
                      }))
                    }
                    className="sr-only peer"
                  />

                  <span
                    className={cn(
                      "w-5 h-5 rounded-md",
                      "border",
                      "flex items-center justify-center",
                      "transition-all",

                      "border-[#A0D5E5]/60",
                      "peer-checked:bg-[#F6DD83]",
                      "peer-checked:border-[#F6DD83]"
                    )}
                  >
                    {filters.inStock && (
                      <span className="text-[#2f3a3d] text-xs font-bold">
                        ✓
                      </span>
                    )}
                  </span>

                  <span className="text-sm font-medium text-[#2f3a3d]">
                    In Stock Only
                  </span>

                </label>

              </div>

              {/* ================= PRICE ================= */}

              <div>

                <h4 className="text-xs font-bold uppercase tracking-wider text-[#A0D5E5] mb-3">
                  Price Range
                </h4>

                <div className="space-y-2.5">

                  {PRICE_RANGES.map((range) => {

                    const active =
                      priceRange.min === range.min &&
                      priceRange.max ===
                        (range.max === Infinity
                          ? undefined
                          : range.max);

                    return (
                      <label
                        key={range.label}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <input
                          type="radio"
                          name="price"
                          checked={active}
                          onChange={() =>
                            setPriceRange({
                              min: range.min,
                              max:
                                range.max === Infinity
                                  ? undefined
                                  : range.max,
                            })
                          }
                          className="sr-only peer"
                        />

                        <span
                          className={cn(
                            "w-4 h-4 rounded-full",
                            "border",
                            "flex items-center justify-center",
                            "transition-all",

                            active
                              ? "border-[#F6DD83]"
                              : "border-[#A0D5E5]/60"
                          )}
                        >
                          {active && (
                            <span className="w-2 h-2 rounded-full bg-[#F6DD83]" />
                          )}
                        </span>

                        <span
                          className={cn(
                            "text-sm transition-colors",
                            active
                              ? "text-[#2f3a3d] font-semibold"
                              : "text-[#6f7779] group-hover:text-[#2f3a3d]"
                          )}
                        >
                          {range.label}
                        </span>
                      </label>
                    );
                  })}

                  {priceRange.min !== undefined && (
                    <button
                      type="button"
                      onClick={() =>
                        setPriceRange({})
                      }
                      className="text-xs text-[#F7B3BC] font-semibold flex items-center gap-1 mt-2"
                    >
                      <X className="w-3 h-3" />
                      Clear price
                    </button>
                  )}

                </div>
              </div>

              {/* ================= RATING ================= */}

              <div>

                <h4 className="text-xs font-bold uppercase tracking-wider text-[#A0D5E5] mb-3">
                  Minimum Rating
                </h4>

                <div className="space-y-2.5">

                  {[4, 3, 2].map((r) => (

                    <label
                      key={r}
                      className="flex items-center gap-3 cursor-pointer"
                    >

                      <input
                        type="radio"
                        name="rating"
                        checked={filters.rating === r}
                        onChange={() =>
                          setFilters((prev) => ({
                            ...prev,
                            rating: r,
                          }))
                        }
                        className="sr-only peer"
                      />

                      <span
                        className={cn(
                          "w-4 h-4 rounded-full border",
                          "flex items-center justify-center",

                          filters.rating === r
                            ? "border-[#F6DD83]"
                            : "border-[#A0D5E5]/60"
                        )}
                      >
                        {filters.rating === r && (
                          <span className="w-2 h-2 rounded-full bg-[#F6DD83]" />
                        )}
                      </span>

                      <div className="flex items-center gap-0.5">
                        {Array.from({
                          length: 5,
                        }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "w-3 h-3",
                              i < r
                                ? "fill-[#F6DD83] text-[#F6DD83]"
                                : "text-[#A0D5E5]/40"
                            )}
                          />
                        ))}

                        <span className="text-xs text-[#6f7779] ml-1">
                          & above
                        </span>
                      </div>

                    </label>

                  ))}

                </div>
              </div>

              {/* ================= COLORS ================= */}

              {allColors.length > 0 && (
                <div>

                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#A0D5E5] mb-3">
                    Color
                  </h4>

                  <div className="flex flex-wrap gap-2">

                    {allColors.map((color) => {

                      const active =
                        filters.color?.includes(color);

                      return (
                        <button
                          type="button"
                          key={color}
                          onClick={() =>
                            toggleArrayFilter(
                              "color",
                              color
                            )
                          }
                          className={cn(
                            "px-3 py-1.5",
                            "text-xs font-medium",
                            "rounded-lg border",
                            "transition-all",

                            active
                              ? "bg-[#F6DD83] border-[#F6DD83] text-[#2f3a3d]"
                              : "bg-transparent border-[#A0D5E5]/50 text-[#6f7779] hover:bg-[#F7B3BC] hover:border-[#F7B3BC] hover:text-[#2f3a3d]"
                          )}
                        >
                          {color}
                        </button>
                      );
                    })}

                  </div>
                </div>
              )}

              {/* ================= SIZES ================= */}

              {allSizes.length > 0 && (
                <div>

                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#A0D5E5] mb-3">
                    Size
                  </h4>

                  <div className="flex flex-wrap gap-2">

                    {allSizes.map((size) => {

                      const active =
                        filters.size?.includes(size);

                      return (
                        <button
                          type="button"
                          key={size}
                          onClick={() =>
                            toggleArrayFilter(
                              "size",
                              size
                            )
                          }
                          className={cn(
                            "w-10 h-9",
                            "text-xs font-semibold",
                            "rounded-lg border",
                            "transition-all",

                            active
                              ? "bg-[#F6DD83] border-[#F6DD83] text-[#2f3a3d]"
                              : "border-[#A0D5E5]/50 text-[#6f7779] hover:bg-[#F7B3BC] hover:border-[#F7B3BC] hover:text-[#2f3a3d]"
                          )}
                        >
                          {size}
                        </button>
                      );
                    })}

                  </div>
                </div>
              )}

            </div>
          </aside>
        )}

        {/* ================================================= */}
        {/* PRODUCTS */}
        {/* ================================================= */}

        <div className="flex-1 min-w-0">

          {filtered.length === 0 ? (

            <div
              className={cn(
                "text-center py-20",
                "rounded-2xl",
                "border border-dashed",
                "border-[#A0D5E5]/50",
                "bg-[#FAF8EA]"
              )}
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#A0D5E5]/20 flex items-center justify-center">
                <SlidersHorizontal className="w-6 h-6 text-[#A0D5E5]" />
              </div>

              <h3 className="font-bold text-lg text-[#2f3a3d] mb-2">
                No products found
              </h3>

              <p className="text-[#6f7779] text-sm mb-5">
                Try adjusting your filters
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="px-5 py-2.5 rounded-xl bg-[#F6DD83] text-[#2f3a3d] text-sm font-semibold hover:bg-[#F7B3BC] transition-colors"
              >
                Clear Filters
              </button>
            </div>

          ) : (

            <div
              className={cn(
                viewMode === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
                  : "flex flex-col gap-4"
              )}
            >

              {filtered.map((product) =>

                viewMode === "grid" ? (

                  <ProductCard
                    key={product.id}
                    product={product}
                  />

                ) : (

                  <div key={product.id} className="space-y-2">
                  <Link
                    href={`/product/${product.slug}`}
                    className={cn(
                      "group flex gap-5",
                      "p-4 rounded-2xl",
                      "bg-[#FAF8EA]",
                      "border border-[#A0D5E5]/30",
                      "transition-all duration-300",
                      "hover:border-[#A0D5E5]/70",
                      "hover:shadow-[0_10px_30px_rgba(160,213,229,0.15)]"
                    )}
                  >

                    {/* Product Image */}

                    <div className="relative w-32 sm:w-40 h-40 sm:h-48 rounded-xl overflow-hidden flex-shrink-0 bg-[#A0D5E5]/10">

                      {product.images[0] ? (
                        <Image
                          src={
                            product.images[0].url
                          }
                          alt={
                            product.images[0].alt
                          }
                          fill
                          sizes="160px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-4xl opacity-30">
                            🛍️
                          </span>
                        </div>
                      )}

                    </div>

                    {/* Product Info */}

                    <div className="flex-1 min-w-0 py-1">

                      <p className="text-[10px] uppercase tracking-wider font-bold text-[#A0D5E5] mb-1.5">
                        {product.category.name}
                      </p>

                      <h3 className="font-semibold text-base sm:text-lg text-[#2f3a3d] group-hover:text-[#A0D5E5] transition-colors line-clamp-2 mb-2">
                        {product.name}
                      </h3>

                      <div className="flex items-center gap-2 mb-3">

                        <div className="flex">
                          {Array.from({
                            length: 5,
                          }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "w-3.5 h-3.5",
                                i <
                                  Math.floor(
                                    product.rating
                                  )
                                  ? "fill-[#F6DD83] text-[#F6DD83]"
                                  : "text-[#A0D5E5]/40"
                              )}
                            />
                          ))}
                        </div>

                        <span className="text-xs text-[#6f7779]">
                          ({product.reviewCount})
                        </span>

                      </div>

                      <p className="text-sm text-[#6f7779] line-clamp-2 mb-4">
                        {richTextToPlainText(product.description)}
                      </p>

                      <div className="flex items-center gap-2">

                        <span className="text-lg font-bold text-[#2f3a3d]">
                          {formatPrice(
                            product.price
                          )}
                        </span>

                        {product.comparePrice && (
                          <span className="text-xs text-[#6f7779] line-through">
                            {formatPrice(
                              product.comparePrice
                            )}
                          </span>
                        )}

                      </div>

                    </div>

                  </Link>
                  <WhatsAppOrderButton product={product} className="h-10 sm:max-w-xs" />
                  </div>
                )
              )}

            </div>
          )}

        </div>
      </div>

      {/* ================================================= */}
      {/* MOBILE FILTER PANEL */}
      {/* ================================================= */}

      {isFilterOpen && (
        <div className="lg:hidden fixed inset-0 z-50">

          {/* Backdrop */}

          <button
            type="button"
            aria-label="Close filters"
            onClick={() =>
              setIsFilterOpen(false)
            }
            className="absolute inset-0 bg-[#2f3a3d]/30 backdrop-blur-sm"
          />

          {/* Panel */}

          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-[#FAF8EA] border-t border-[#A0D5E5]/40 p-5">

            <div className="flex items-center justify-between mb-5">

              <div>
                <h3 className="text-lg font-bold text-[#2f3a3d]">
                  Filters
                </h3>

                <p className="text-xs text-[#6f7779]">
                  Refine your products
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setIsFilterOpen(false)
                }
                className="w-9 h-9 rounded-full bg-[#A0D5E5]/15 flex items-center justify-center text-[#2f3a3d] hover:bg-[#F7B3BC] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

            </div>

            {/* Mobile filters */}

            <div className="space-y-6">

              {/* Stock */}

              <label className="flex items-center gap-3">

                <input
                  type="checkbox"
                  checked={filters.inStock ?? false}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      inStock:
                        e.target.checked ||
                        undefined,
                    }))
                  }
                  className="w-4 h-4 accent-[#F6DD83]"
                />

                <span className="text-sm font-medium">
                  In Stock Only
                </span>

              </label>

              {/* Price */}

              <div>

                <h4 className="text-xs font-bold uppercase tracking-wider text-[#A0D5E5] mb-3">
                  Price Range
                </h4>

                <div className="grid grid-cols-2 gap-2">

                  {PRICE_RANGES.map((range) => {

                    const active =
                      priceRange.min === range.min &&
                      priceRange.max ===
                        (range.max === Infinity
                          ? undefined
                          : range.max);

                    return (
                      <button
                        key={range.label}
                        type="button"
                        onClick={() =>
                          setPriceRange({
                            min: range.min,
                            max:
                              range.max === Infinity
                                ? undefined
                                : range.max,
                          })
                        }
                        className={cn(
                          "p-3 rounded-xl border text-xs font-medium text-left",
                          active
                            ? "bg-[#F6DD83] border-[#F6DD83] text-[#2f3a3d]"
                            : "border-[#A0D5E5]/40 text-[#6f7779] hover:bg-[#F7B3BC]"
                        )}
                      >
                        {range.label}
                      </button>
                    );
                  })}

                </div>
              </div>

              {/* Rating */}

              <div>

                <h4 className="text-xs font-bold uppercase tracking-wider text-[#A0D5E5] mb-3">
                  Minimum Rating
                </h4>

                <div className="flex gap-2">

                  {[4, 3, 2].map((r) => (

                    <button
                      key={r}
                      type="button"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          rating:
                            prev.rating === r
                              ? undefined
                              : r,
                        }))
                      }
                      className={cn(
                        "flex-1 py-2 rounded-xl border text-xs",
                        filters.rating === r
                          ? "bg-[#F6DD83] border-[#F6DD83]"
                          : "border-[#A0D5E5]/40"
                      )}
                    >
                      {r}★+
                    </button>

                  ))}

                </div>
              </div>

              {/* Colors */}

              {allColors.length > 0 && (
                <div>

                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#A0D5E5] mb-3">
                    Color
                  </h4>

                  <div className="flex flex-wrap gap-2">

                    {allColors.map((color) => (

                      <button
                        key={color}
                        type="button"
                        onClick={() =>
                          toggleArrayFilter(
                            "color",
                            color
                          )
                        }
                        className={cn(
                          "px-3 py-2 rounded-lg border text-xs",
                          filters.color?.includes(
                            color
                          )
                            ? "bg-[#F6DD83] border-[#F6DD83]"
                            : "border-[#A0D5E5]/40 hover:bg-[#F7B3BC]"
                        )}
                      >
                        {color}
                      </button>

                    ))}

                  </div>
                </div>
              )}

              {/* Sizes */}

              {allSizes.length > 0 && (
                <div>

                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#A0D5E5] mb-3">
                    Size
                  </h4>

                  <div className="flex flex-wrap gap-2">

                    {allSizes.map((size) => (

                      <button
                        key={size}
                        type="button"
                        onClick={() =>
                          toggleArrayFilter(
                            "size",
                            size
                          )
                        }
                        className={cn(
                          "w-11 h-9 rounded-lg border text-xs",
                          filters.size?.includes(
                            size
                          )
                            ? "bg-[#F6DD83] border-[#F6DD83]"
                            : "border-[#A0D5E5]/40 hover:bg-[#F7B3BC]"
                        )}
                      >
                        {size}
                      </button>

                    ))}

                  </div>
                </div>
              )}

            </div>

            {/* Mobile bottom actions */}

            <div className="flex gap-3 mt-7 pt-5 border-t border-[#A0D5E5]/25">

              <button
                type="button"
                onClick={clearFilters}
                className="flex-1 h-11 rounded-xl border border-[#A0D5E5]/50 text-sm font-semibold hover:bg-[#F7B3BC] transition-colors"
              >
                Clear All
              </button>

              <button
                type="button"
                onClick={() =>
                  setIsFilterOpen(false)
                }
                className="flex-1 h-11 rounded-xl bg-[#F6DD83] text-[#2f3a3d] text-sm font-bold hover:bg-[#F7B3BC] transition-colors"
              >
                Show {filtered.length} Products
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
