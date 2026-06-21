import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

interface Ctx {
  actions: ReactNode | null;
  setActions: (id: string, node: ReactNode | null) => void;
}

const LpRailActionsContext = createContext<Ctx | null>(null);

export function LpRailActionsProvider({ children }: { children: ReactNode }) {
  const [registry, setRegistry] = useState<Record<string, ReactNode>>({});

  const setActions = useCallback((id: string, node: ReactNode | null) => {
    setRegistry((prev) => {
      if (node == null) {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: node };
    });
  }, []);

  const actions = useMemo(() => {
    const entries = Object.entries(registry);
    if (entries.length === 0) return null;
    return (
      <>
        {entries.map(([id, node]) => (
          <div key={id} className="contents">
            {node}
          </div>
        ))}
      </>
    );
  }, [registry]);

  return (
    <LpRailActionsContext.Provider value={{ actions, setActions }}>
      {children}
    </LpRailActionsContext.Provider>
  );
}

export function useLpRailActions() {
  return useContext(LpRailActionsContext);
}

/** Register contextual rail actions for the lifetime of the calling component. */
export function useSetLpRailActions(id: string, node: ReactNode | null) {
  const ctx = useContext(LpRailActionsContext);
  useEffect(() => {
    ctx?.setActions(id, node);
    return () => ctx?.setActions(id, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, node]);
}