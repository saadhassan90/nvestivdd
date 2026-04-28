import { createContext, useContext, useEffect, useMemo, useState } from "react";

/**
 * PRD §7.1 — Meeting Mode
 *  - Toggle persisted per (user × deal) in localStorage.
 *  - When ON: +15% font, hidden Analysis Log + Sources + All Scores table,
 *    sub-scores expanded, comments rail wider (handled by consumers).
 */

interface MeetingModeCtx {
  enabled: boolean;
  toggle: () => void;
  setEnabled: (v: boolean) => void;
}

const Ctx = createContext<MeetingModeCtx | null>(null);

function storageKey(dealId: string | null | undefined): string {
  return `nvestiv:meeting-mode:${dealId ?? "global"}`;
}

export function MeetingModeProvider({
  dealId,
  children,
}: {
  dealId: string | null | undefined;
  children: React.ReactNode;
}) {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(storageKey(dealId)) === "1";
    } catch {
      return false;
    }
  });

  // Sync to localStorage whenever it changes
  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey(dealId), enabled ? "1" : "0");
    } catch { /* ignore */ }
  }, [enabled, dealId]);

  // Apply +15% root font scaling via a body class (CSS in index.css)
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle("meeting-mode", enabled);
    return () => document.body.classList.remove("meeting-mode");
  }, [enabled]);

  const value = useMemo<MeetingModeCtx>(
    () => ({ enabled, toggle: () => setEnabled((v) => !v), setEnabled }),
    [enabled],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMeetingMode(): MeetingModeCtx {
  const v = useContext(Ctx);
  if (!v) {
    // Safe fallback so non-wrapped routes don't crash
    return { enabled: false, toggle: () => {}, setEnabled: () => {} };
  }
  return v;
}