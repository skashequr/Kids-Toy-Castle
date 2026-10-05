"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Cart, CartItem, Product, ProductVariant } from "@/types";
import { trackAnalyticsEvent } from "@/lib/analytics-client";

/** Validated coupon details kept in the store so totals can be recomputed. */
export interface CouponState {
  code: string;
  type: string; // "percentage" | "fixed"
  value: number;
  maxDiscount?: number;
}

interface CartStore extends Cart {
  isOpen: boolean;
  coupon?: CouponState;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  applyCoupon: (coupon: CouponState) => void;
  removeCoupon: () => void;
  setOrderNotes: (notes: string) => void;
  clearCart: () => void;
  getItemCount: () => number;
}

const FREE_SHIPPING_THRESHOLD = 2000;
const SHIPPING_COST = 120;

function computeTotals(
  items: CartItem[],
  coupon?: CouponState
): Pick<Cart, "subtotal" | "discount" | "shipping" | "total"> {
  if (items.length === 0) {
    return { subtotal: 0, discount: 0, shipping: 0, total: 0 };
  }

  const subtotal = items.reduce((sum, item) => {
    const price = Number(item.price ?? item.variant?.price ?? item.product.price ?? 0);
    const quantity = Number(item.quantity ?? 0);
    return sum + (Number.isFinite(price) ? price : 0) * (Number.isFinite(quantity) ? quantity : 0);
  }, 0);
  let discount = 0;

  if (coupon) {
    if (coupon.type === "percentage") {
      discount = Math.round(subtotal * (coupon.value / 100));
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else {
      discount = Math.min(coupon.value, subtotal);
    }
  }

  const shipping = subtotal - discount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal - discount + shipping;

  return { subtotal, discount, shipping, total };
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      subtotal: 0,
      discount: 0,
      shipping: 0,
      total: 0,
      isOpen: false,
      couponCode: undefined,
      coupon: undefined,
      giftWrap: false,
      orderNotes: "",

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      addItem: (product, quantity = 1, variant) => {
        if (product.variants?.length && !variant) { window.location.href = `/product/${product.slug}`; return; }
        if (quantity < 1 || quantity > (variant?.stock ?? product.stock)) return;
        const { items, coupon } = get();
        const existingIndex = items.findIndex(
          (i) => i.product.id === product.id && i.variant?.id === variant?.id
        );

        let newItems: CartItem[];
        if (existingIndex > -1) {
          newItems = items.map((item, idx) =>
            idx === existingIndex
              ? { ...item, quantity: Math.min(item.quantity + quantity, variant?.stock ?? product.stock) }
              : item
          );
        } else {
          const newItem: CartItem = {
            id: `${product.id}-${variant?.id ?? "default"}-${Date.now()}`,
            product,
            variant,
            quantity,
            price: variant?.price ?? product.price,
          };
          newItems = [...items, newItem];
        }

        set({ items: newItems, isOpen: true, ...computeTotals(newItems, coupon) });
        trackAnalyticsEvent("add_to_cart", { productId: product.id, productName: product.name, value: (variant?.price ?? product.price) * quantity, quantity });
      },

      removeItem: (itemId) => {
        const { items, coupon } = get();
        const newItems = items.filter((i) => i.id !== itemId);
        set({ items: newItems, ...computeTotals(newItems, coupon) });
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity < 1) return;
        const { items, coupon } = get();
        const newItems = items.map((i) => (i.id === itemId ? { ...i, quantity: Math.min(quantity, i.variant?.stock ?? i.product.stock) } : i));
        set({ items: newItems, ...computeTotals(newItems, coupon) });
      },

      applyCoupon: (coupon) => {
        const { items } = get();
        set({
          coupon,
          couponCode: coupon.code,
          ...computeTotals(items, coupon),
        });
      },

      removeCoupon: () => {
        const { items } = get();
        set({ coupon: undefined, couponCode: undefined, ...computeTotals(items) });
      },

      setOrderNotes: (notes) => set({ orderNotes: notes }),

      clearCart: () =>
        set({
          items: [],
          subtotal: 0,
          discount: 0,
          shipping: 0,
          total: 0,
          couponCode: undefined,
          coupon: undefined,
          giftWrap: false,
          orderNotes: "",
        }),

      getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: "luxen-cart",
      partialize: (state) => ({
        items: state.items,
        couponCode: state.couponCode,
        coupon: state.coupon,
        orderNotes: state.orderNotes,
      }),
      // Totals are derived values. Rebuild them from the persisted cart items
      // instead of accepting the initial 0 values after a browser refresh.
      merge: (persistedState, currentState) => {
        const persistedCart = persistedState as Partial<CartStore>;
        const items = Array.isArray(persistedCart.items) ? persistedCart.items : [];
        const coupon = persistedCart.coupon;

        return {
          ...currentState,
          ...persistedCart,
          items,
          coupon,
          // Ignore gift wrapping from carts saved before this option was removed.
          giftWrap: false,
          ...computeTotals(items, coupon),
        };
      },
    }
  )
);
