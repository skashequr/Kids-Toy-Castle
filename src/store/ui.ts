"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIStore {
  isDarkMode: boolean;
  language: "en" | "bn";
  isSearchOpen: boolean;
  isMobileMenuOpen: boolean;
  toggleDarkMode: () => void;
  setLanguage: (lang: "en" | "bn") => void;
  openSearch: () => void;
  closeSearch: () => void;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      isDarkMode: false,
      language: "en",
      isSearchOpen: false,
      isMobileMenuOpen: false,

      toggleDarkMode: () =>
        set((state) => {
          const next = !state.isDarkMode;
          if (typeof document !== "undefined") {
            document.documentElement.classList.toggle("dark", next);
          }
          return { isDarkMode: next };
        }),

      setLanguage: (language) => set({ language }),
      openSearch: () => set({ isSearchOpen: true }),
      closeSearch: () => set({ isSearchOpen: false }),
      openMobileMenu: () => set({ isMobileMenuOpen: true }),
      closeMobileMenu: () => set({ isMobileMenuOpen: false }),
    }),
    {
      name: "luxen-ui",
      partialize: (state) => ({ isDarkMode: state.isDarkMode, language: state.language }),
    }
  )
);
