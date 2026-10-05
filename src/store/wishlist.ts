"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product, WishlistItem } from "@/types";

interface WishlistStore {
  items: WishlistItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  toggleItem: (product: Product) => void;
  isWishlisted: (productId: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        const { items } = get();
        if (items.some((i) => i.product.id === product.id)) return;
        set({
          items: [
            ...items,
            { id: `wish-${product.id}`, product, addedAt: new Date().toISOString() },
          ],
        });
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.product.id !== productId) });
      },

      toggleItem: (product) => {
        const { items, addItem, removeItem } = get();
        if (items.some((i) => i.product.id === product.id)) {
          removeItem(product.id);
        } else {
          addItem(product);
        }
      },

      isWishlisted: (productId) => get().items.some((i) => i.product.id === productId),

      clear: () => set({ items: [] }),
    }),
    { name: "luxen-wishlist" }
  )
);
