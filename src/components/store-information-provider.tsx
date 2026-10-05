"use client";

import { createContext, useContext } from "react";
import { DEFAULT_STORE_INFORMATION, type StoreInformation } from "@/lib/store-information";

const StoreInformationContext = createContext<StoreInformation>(DEFAULT_STORE_INFORMATION);

export function StoreInformationProvider({ store, children }: { store: StoreInformation; children: React.ReactNode }) {
  return <StoreInformationContext.Provider value={store}>{children}</StoreInformationContext.Provider>;
}

export function useStoreInformation() {
  return useContext(StoreInformationContext);
}

// Display formatting only: stored product prices are never converted or changed.
export function useStorePrice() {
  const store = useStoreInformation();
  return (value: number) => {
    const amount = value.toLocaleString("en-BD", { maximumFractionDigits: 2 });
    return `${store.currencySymbol || `${store.currency} `}${amount}`;
  };
}
