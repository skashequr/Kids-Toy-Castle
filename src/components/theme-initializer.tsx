"use client";

import { useEffect } from "react";
import { useUIStore } from "@/store/ui";

export function ThemeInitializer() {
  const isDarkMode = useUIStore((s) => s.isDarkMode);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  return null;
}
