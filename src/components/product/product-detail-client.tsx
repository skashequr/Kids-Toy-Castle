"use client";

import { useStorePrice } from "@/components/store-information-provider";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Heart,
  ShoppingBag,
  Star,
  Share2,
  ChevronRight,
  Minus,
  Plus,
  CheckCircle,
  Truck,
  RotateCcw,
  Shield,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductCard } from "./product-card";
import { WhatsAppOrderButton } from "./whatsapp-order-button";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { toast } from "@/components/ui/toaster";
import { RichTextContent } from "@/components/ui/rich-text";
import { calculateDiscount, cn } from "@/lib/utils";
import { submitReview } from "@/server/actions/reviews";
import { trackAnalyticsEvent } from "@/lib/analytics-client";

import type { Product, ProductVariant, Review } from "@/types";

interface ProductDetailClientProps {
  product: Product;
  related: Product[];
  reviews: Review[];
}

export function ProductDetailClient({
  product,
  related,
  reviews,
}: ProductDetailClientProps) {
  const formatPrice = useStorePrice();
  const trackedProduct = useRef("");
  useEffect(() => {
    if (trackedProduct.current === product.id) return;
    trackedProduct.current = product.id;
    trackAnalyticsEvent("product_view", {
      productId: product.id, productName: product.name, value: product.price,
    });
  }, [product.id, product.name, product.price]);
  const [selectedImage, setSelectedImage] = useState(0);

  const [selectedVariant, setSelectedVariant] = useState<
    ProductVariant | undefined
  >(product.variants?.find((v) => v.stock > 0) ?? product.variants?.[0]);
  const [variantImageActive, setVariantImageActive] = useState(true);
  const chooseVariant = (variant: ProductVariant) => { setSelectedVariant(variant); setVariantImageActive(true); setQuantity(1); };
  const heroImage = variantImageActive && selectedVariant?.image ? selectedVariant.image : product.images[selectedImage]?.url;

  const [quantity, setQuantity] = useState(1);

  const [activeTab, setActiveTab] = useState<
    "description" | "specs" | "reviews"
  >("description");

  // Review form state
  const [rwName, setRwName] = useState("");
  const [rwRating, setRwRating] = useState(5);
  const [rwTitle, setRwTitle] = useState("");
  const [rwBody, setRwBody] = useState("");
  const [rwSubmitting, setRwSubmitting] = useState(false);

  const { addItem } = useCartStore();
  const { toggleItem, isWishlisted } = useWishlistStore();

  const wishlisted = isWishlisted(product.id);

  const discount = product.comparePrice
    ? calculateDiscount(product.comparePrice, product.price)
    : 0;

  const currentPrice = selectedVariant?.price ?? product.price;
  const currentStock = selectedVariant?.stock ?? product.stock;

  // Add to cart
  const handleAddToCart = () => {
    addItem(product, quantity, selectedVariant);

    toast.success(`${product.name} added to your bag!`);
  };

  // Buy now
  const handleBuyNow = () => {
    addItem(product, quantity, selectedVariant);

    window.location.href = "/checkout";
  };

  const productReviews = reviews;

  // Submit review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    setRwSubmitting(true);

    const res = await submitReview({
      productId: product.id,
      productName: product.name,
      userName: rwName,
      rating: rwRating,
      title: rwTitle,
      body: rwBody,
    });

    setRwSubmitting(false);

    if (res.ok) {
      toast.success("Thanks! Your review is awaiting approval.");

      setRwName("");
      setRwTitle("");
      setRwBody("");
      setRwRating(5);
    } else {
      toast.error(res.error ?? "Could not submit review.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8EA] text-[#2f3a3d]">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[#6f7779] mb-8 overflow-x-auto whitespace-nowrap">
          <Link
            href="/"
            className="hover:text-[#A0D5E5] transition-colors"
          >
            Home
          </Link>

          <ChevronRight className="w-4 h-4 flex-shrink-0" />

          <Link
            href={`/category/${product.category.slug}`}
            className="hover:text-[#A0D5E5] transition-colors"
          >
            {product.category.name}
          </Link>

          <ChevronRight className="w-4 h-4 flex-shrink-0" />

          <span className="text-[#2f3a3d] line-clamp-1">
            {product.name}
          </span>
        </nav>

        {/* Product Main Section */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 mb-16 lg:mb-24">
          {/* ================= IMAGE SECTION ================= */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-white/40 border border-[#A0D5E5]/30 shadow-sm">
              {heroImage ? (
                <Image
                  src={heroImage}
                  alt={selectedVariant?.name || product.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-8xl opacity-20">🛍️</span>
                </div>
              )}

              {/* Discount */}
              {discount > 0 && (
                <div className="absolute top-5 left-5">
                  <span className="inline-flex items-center rounded-full bg-[#F7B3BC] text-[#2f3a3d] px-4 py-2 text-xs font-bold shadow-sm">
                    -{discount}%
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {product.images.map((img, i) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => { setSelectedImage(i); setVariantImageActive(false); }}
                    className={cn(
                      "relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all",
                      i === selectedImage
                        ? "border-[#F6DD83] ring-2 ring-[#F6DD83]/30"
                        : "border-transparent opacity-60 hover:opacity-100 hover:border-[#A0D5E5]"
                    )}
                  >
                    <Image
                      src={img.url}
                      alt={img.alt}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ================= DETAILS SECTION ================= */}
          <div className="flex flex-col">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {product.isNew && (
                <span className="inline-flex rounded-full bg-[#A0D5E5] px-3 py-1 text-xs font-semibold text-[#2f3a3d]">
                  New
                </span>
              )}

              {product.isBestSeller && (
                <span className="inline-flex rounded-full bg-[#F6DD83] px-3 py-1 text-xs font-semibold text-[#2f3a3d]">
                  Best Seller
                </span>
              )}

              {currentStock < 10 && currentStock > 0 && (
                <span className="inline-flex rounded-full bg-[#F7B3BC]/60 px-3 py-1 text-xs font-semibold text-[#2f3a3d]">
                  Only {currentStock} left
                </span>
              )}
            </div>

            {/* Category */}
            <p className="text-[#A0D5E5] text-sm font-semibold mb-2">
              {product.category.name}
            </p>

            {/* Title */}
            <h1 className="font-serif text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight text-[#2f3a3d] mb-4">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-4 h-4",
                      i < Math.floor(product.rating)
                        ? "fill-[#F6DD83] text-[#F6DD83]"
                        : "text-[#A0D5E5]/40"
                    )}
                  />
                ))}
              </div>

              <span className="text-sm font-semibold">
                {product.rating}
              </span>

              <span className="text-sm text-[#6f7779]">
                ({product.reviewCount} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex flex-wrap items-center gap-3 mb-7">
              <span className="text-3xl font-bold text-[#2f3a3d]">
                {formatPrice(currentPrice)}
              </span>

              {product.comparePrice && (
                <>
                  <span className="text-[#6f7779] line-through text-lg">
                    {formatPrice(product.comparePrice)}
                  </span>

                  <span className="rounded-full bg-[#F7B3BC] px-3 py-1 text-xs font-bold">
                    Save {discount}%
                  </span>
                </>
              )}
            </div>

            {!!product.variants?.length && (
              <div className="mb-6">
                <p className="mb-3 text-sm font-semibold">আপনার পছন্দের ভ্যারিয়েন্ট বেছে নিন: {selectedVariant?.name || [selectedVariant?.color, selectedVariant?.size].filter(Boolean).join(" / ") || selectedVariant?.sku}</p>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map((variant) => {
                    const label = variant.name || [variant.color, variant.size].filter(Boolean).join(" / ") || variant.sku;
                    return <button key={variant.id} type="button" aria-pressed={selectedVariant?.id === variant.id} disabled={variant.stock <= 0} onClick={() => chooseVariant(variant)} className={cn("w-28 overflow-hidden rounded-xl border-2 p-2 text-xs transition disabled:opacity-40", selectedVariant?.id === variant.id ? "border-[#238fda] bg-[#e5f5ff]" : "border-slate-200 hover:border-[#238fda]")}>
                      {variant.image ? <span className="relative mb-2 block h-20 w-full"><Image src={variant.image} alt={label} fill sizes="96px" className="rounded-lg object-cover" /></span> : <span className="mb-2 block h-12 rounded-lg" style={{ backgroundColor: variant.colorHex || "#e5f5ff" }} />}
                      <span className="block font-semibold">{label}</span>
                      <span className="block">{variant.stock > 0 ? formatPrice(variant.price ?? product.price) : "Stock নেই"}</span>
                    </button>;
                  })}
                </div>
              </div>
            )}

            {/* Quantity & Stock */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center border border-[#A0D5E5]/50 rounded-xl overflow-hidden bg-white/30">
                <button
                  type="button"
                  onClick={() =>
                    setQuantity(Math.max(1, quantity - 1))
                  }
                  className="w-11 h-11 flex items-center justify-center hover:bg-[#F7B3BC]/30 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <span className="w-12 text-center font-semibold">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setQuantity(
                      Math.min(currentStock, quantity + 1)
                    )
                  }
                  className="w-11 h-11 flex items-center justify-center hover:bg-[#F7B3BC]/30 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    currentStock > 0
                      ? "bg-[#A0D5E5]"
                      : "bg-[#F7B3BC]"
                  )}
                />

                <span className="text-sm text-[#6f7779]">
                  {currentStock > 0
                    ? `${currentStock} in stock`
                    : "Out of stock"}
                </span>
              </div>
            </div>

            {/* SKU */}
            <p className="text-xs text-[#6f7779] mb-6">
              SKU: {selectedVariant?.sku ?? product.sku}
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-3">
              <Button
                size="lg"
                className="flex-1 bg-[#F6DD83] text-[#2f3a3d] hover:bg-[#F7B3BC] border-0 shadow-sm"
                leftIcon={<ShoppingBag className="w-5 h-5" />}
                onClick={handleAddToCart}
                disabled={currentStock === 0}
              >
                Add to Bag
              </Button>

              {/* Wishlist */}
              <button
                type="button"
                onClick={() => {
                  toggleItem(product);

                  toast.info(
                    wishlisted
                      ? "Removed from wishlist"
                      : "Added to wishlist"
                  );
                }}
                className={cn(
                  "w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all",
                  wishlisted
                    ? "border-[#F7B3BC] bg-[#F7B3BC]/30 text-[#2f3a3d]"
                    : "border-[#A0D5E5]/50 hover:border-[#F7B3BC] hover:bg-[#F7B3BC]/20"
                )}
              >
                <Heart
                  className={cn(
                    "w-5 h-5",
                    wishlisted && "fill-[#F7B3BC]"
                  )}
                />
              </button>

              {/* Share */}
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    window.location.href
                  );

                  toast.success("Product link copied!");
                }}
                className="w-12 h-12 rounded-xl border-2 border-[#A0D5E5]/50 flex items-center justify-center hover:border-[#F6DD83] hover:bg-[#F6DD83]/20 transition-all"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Buy Now */}
            <Button
              size="lg"
              fullWidth
              onClick={handleBuyNow}
              disabled={currentStock === 0}
              className="bg-[#A0D5E5] text-[#2f3a3d] hover:bg-[#F6DD83] border-0"
            >
              Buy Now
            </Button>

            {/* WhatsApp */}
            <WhatsAppOrderButton
              product={{ ...product, price: currentPrice }}
              quantity={quantity}
              variantLabel={selectedVariant ? [selectedVariant.name, selectedVariant.color, selectedVariant.size].filter(Boolean).join(" / ") || selectedVariant.sku : undefined}
              className="mt-3 h-12 text-sm"
            />

            {/* Highlights */}
            {product.highlights && (
              <div className="mt-7 space-y-2">
                {product.highlights.map((h) => (
                  <div
                    key={h}
                    className="flex items-center gap-2 text-sm"
                  >
                    <CheckCircle className="w-4 h-4 text-[#A0D5E5] flex-shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Shipping Info */}
            <div className="mt-7 p-5 bg-white/30 border border-[#A0D5E5]/30 rounded-2xl space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Truck className="w-5 h-5 text-[#A0D5E5]" />

                <div>
                  <p className="font-semibold">Fast Delivery</p>
                  <p className="text-[#6f7779] text-xs">
                    Dhaka: 1-2 days · Outside: 3-5 days
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <RotateCcw className="w-5 h-5 text-[#A0D5E5]" />

                <div>
                  <p className="font-semibold">7-Day Returns</p>
                  <p className="text-[#6f7779] text-xs">
                    Free pickup from your doorstep
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Shield className="w-5 h-5 text-[#A0D5E5]" />

                <div>
                  <p className="font-semibold">100% Genuine</p>
                  <p className="text-[#6f7779] text-xs">
                    Authenticity guaranteed
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= TABS ================= */}
        <div className="mb-16">
          <div className="flex gap-6 lg:gap-8 border-b border-[#A0D5E5]/30 mb-7 overflow-x-auto">
            {(["description", "specs", "reviews"] as const).map(
              (tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "pb-3 text-sm font-semibold capitalize transition-all border-b-2 -mb-px whitespace-nowrap",
                    activeTab === tab
                      ? "border-[#F6DD83] text-[#2f3a3d]"
                      : "border-transparent text-[#6f7779] hover:text-[#A0D5E5]"
                  )}
                >
                  {tab === "reviews"
                    ? `Reviews (${
                        productReviews.length ||
                        product.reviewCount
                      })`
                    : tab}
                </button>
              )
            )}
          </div>

          {/* Description */}
          {activeTab === "description" && (
            <div className="max-w-3xl">
              <RichTextContent value={product.description} className="text-[#6f7779]" />
            </div>
          )}

          {/* Specifications */}
          {activeTab === "specs" &&
            product.specifications && (
              <div className="max-w-2xl">
                <table className="w-full text-sm">
                  <tbody>
                    {Object.entries(
                      product.specifications
                    ).map(([key, value]) => (
                      <tr
                        key={key}
                        className="border-b border-[#A0D5E5]/20"
                      >
                        <td className="py-4 pr-4 font-semibold text-[#6f7779] w-40">
                          {key}
                        </td>

                        <td className="py-4">
                          {value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          {/* Reviews */}
          {activeTab === "reviews" && (
            <div className="space-y-5 max-w-3xl">
              {productReviews.length > 0 ? (
                productReviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-5 rounded-2xl border border-[#A0D5E5]/30 bg-white/20"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#A0D5E5] flex items-center justify-center">
                          <span className="text-[#2f3a3d] font-bold text-sm">
                            {review.user.name[0]}
                          </span>
                        </div>

                        <div>
                          <p className="font-semibold text-sm">
                            {review.user.name}
                          </p>

                          {review.isVerified && (
                            <p className="text-xs text-[#A0D5E5] font-medium">
                              ✓ Verified Purchase
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex">
                        {Array.from({ length: 5 }).map(
                          (_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "w-3.5 h-3.5",
                                i < review.rating
                                  ? "fill-[#F6DD83] text-[#F6DD83]"
                                  : "text-[#A0D5E5]/40"
                              )}
                            />
                          )
                        )}
                      </div>
                    </div>

                    {review.title && (
                      <h4 className="font-semibold text-sm mb-1">
                        {review.title}
                      </h4>
                    )}

                    <p className="text-sm text-[#6f7779] leading-relaxed">
                      {review.body}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-[#6f7779] text-sm">
                  No reviews yet. Be the first to review this
                  product.
                </p>
              )}

              {/* Write Review */}
              <form
                onSubmit={handleSubmitReview}
                className="mt-8 p-6 rounded-2xl border border-[#A0D5E5]/30 bg-white/20 space-y-4"
              >
                <h4 className="font-serif text-xl font-bold text-[#2f3a3d]">
                  Write a Review
                </h4>

                {/* Rating */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRwRating(n)}
                      aria-label={`${n} star`}
                    >
                      <Star
                        className={cn(
                          "w-6 h-6",
                          n <= rwRating
                            ? "fill-[#F6DD83] text-[#F6DD83]"
                            : "text-[#A0D5E5]/40"
                        )}
                      />
                    </button>
                  ))}
                </div>

                {/* Name */}
                <input
                  type="text"
                  required
                  value={rwName}
                  onChange={(e) =>
                    setRwName(e.target.value)
                  }
                  placeholder="Your name"
                  className="w-full h-11 px-4 rounded-xl border border-[#A0D5E5]/40 bg-[#FAF8EA] focus:outline-none focus:border-[#F6DD83] text-sm"
                />

                {/* Title */}
                <input
                  type="text"
                  value={rwTitle}
                  onChange={(e) =>
                    setRwTitle(e.target.value)
                  }
                  placeholder="Review title (optional)"
                  className="w-full h-11 px-4 rounded-xl border border-[#A0D5E5]/40 bg-[#FAF8EA] focus:outline-none focus:border-[#F6DD83] text-sm"
                />

                {/* Body */}
                <textarea
                  required
                  value={rwBody}
                  onChange={(e) =>
                    setRwBody(e.target.value)
                  }
                  placeholder="Share your thoughts about this product…"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-[#A0D5E5]/40 bg-[#FAF8EA] focus:outline-none focus:border-[#F6DD83] text-sm resize-none"
                />

                <Button
                  type="submit"
                  disabled={rwSubmitting}
                  className="bg-[#F6DD83] text-[#2f3a3d] hover:bg-[#F7B3BC] border-0"
                >
                  {rwSubmitting
                    ? "Submitting…"
                    : "Submit Review"}
                </Button>
              </form>
            </div>
          )}
        </div>

        {/* ================= RELATED PRODUCTS ================= */}
        {related.length > 0 && (
          <div>
            <div className="flex items-end justify-between gap-4 mb-7">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] font-semibold text-[#A0D5E5] mb-2">
                  You May Also Like
                </p>

                <h2 className="font-serif text-2xl lg:text-3xl font-bold text-[#2f3a3d]">
                  Related Products
                </h2>
              </div>

              <div className="hidden sm:block h-px flex-1 bg-[#F6DD83]/60 max-w-40" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {related.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
