import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type UiVariant = "adia" | "general" | "gp";

const STORAGE_KEY = "nvestiv.ui-variant";
const DEFAULT_VARIANT: UiVariant = "adia";

interface UiVariantContextValue {
  variant: UiVariant;
  setVariant: (v: UiVariant) => void;
}

const UiVariantContext = createContext<UiVariantContextValue | undefined>(undefined);

export function UiVariantProvider({ children }: { children: ReactNode }) {
  const [variant, setVariantState] = useState<UiVariant>(() => {
    if (typeof window === "undefined") return DEFAULT_VARIANT;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "general" || stored === "adia" || stored === "gp" ? stored : DEFAULT_VARIANT;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, variant);
    } catch {
      /* ignore */
    }
  }, [variant]);

  return (
    <UiVariantContext.Provider value={{ variant, setVariant: setVariantState }}>
      {children}
    </UiVariantContext.Provider>
  );
}

export function useUiVariant() {
  const ctx = useContext(UiVariantContext);
  if (!ctx) throw new Error("useUiVariant must be used within UiVariantProvider");
  return ctx;
}