import { createContext, useContext, ReactNode } from "react";

/**
 * Provides the active section/tab key + project id to every SectionCard
 * underneath, so the per-card comment thread can self-wire without each tab
 * passing props through manually.
 */
interface SectionContextValue {
  projectId: string;
  sectionId: string;
}

const SectionContext = createContext<SectionContextValue | null>(null);

export function SectionProvider({
  projectId,
  sectionId,
  children,
}: SectionContextValue & { children: ReactNode }) {
  return (
    <SectionContext.Provider value={{ projectId, sectionId }}>
      {children}
    </SectionContext.Provider>
  );
}

export function useSectionContext(): SectionContextValue | null {
  return useContext(SectionContext);
}