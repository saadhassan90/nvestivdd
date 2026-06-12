import { useSyncExternalStore } from "react";
import type { ClaimCategory, Disposition } from "@/types/renderContract";

export interface LedgerFilters {
  disposition: Disposition | "ALL";
  category: ClaimCategory | "ALL";
}

let state: LedgerFilters = { disposition: "ALL", category: "ALL" };
const listeners = new Set<() => void>();

function emit() { listeners.forEach((l) => l()); }

export function setLedgerFilters(next: Partial<LedgerFilters>) {
  state = { ...state, ...next };
  emit();
}

export function useLedgerFilters(): LedgerFilters {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => state,
    () => state,
  );
}

export const LEDGER_SECTION_ID = "l1-claims";