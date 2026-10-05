"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProductCard } from "@/components/product/product-card";
import { useWishlistStore } from "@/store/wishlist";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WishlistPage() {
  const items = useWishlistStore((s) => s.items);

  return (
    <>
      <Header />
      <main>
        <div className="bg-navy py-12 px-4 text-center">
          <h1 className="font-serif text-4xl font-bold text-ivory">My Wishlist</h1>
          <p className="text-ivory/60 mt-2 text-sm">{items.length} saved items</p>
        </div>
        <div className="container mx-auto px-4 py-10">
          {items.length === 0 ? (
            <div className="text-center py-20">
              <Heart className="w-16 h-16 text-navy/20 dark:text-ivory/20 mx-auto mb-4" />
              <h3 className="font-serif text-xl font-bold mb-2">Your wishlist is empty</h3>
              <p className="text-muted mb-6">Save items you love by clicking the heart icon.</p>
              <Button href="/new-arrivals" variant="gold">Explore Products</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {items.map((item) => <ProductCard key={item.id} product={item.product} />)}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
