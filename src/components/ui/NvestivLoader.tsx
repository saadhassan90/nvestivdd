import nvestivAssemble from "@/assets/nvestiv-assemble.svg";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

/** Length of one full assemble→hold→fade cycle in the SVG (keep in sync with the SVG keyframes). */
export const NVESTIV_LOADER_CYCLE_MS = 2200;

/**
 * Keeps `loading` true until the next animation-cycle boundary, so the
 * loader never disappears mid-animation. Loops as many cycles as needed
 * while the underlying state is still loading.
 */
export function useNvestivLoaderGate(loading: boolean): boolean {
  const [shown, setShown] = useState(loading);
  const startRef = useRef<number>(typeof performance !== "undefined" ? performance.now() : 0);

  useEffect(() => {
    if (loading) {
      if (!shown) startRef.current = performance.now();
      setShown(true);
      return;
    }
    if (!shown) return;
    const elapsed = performance.now() - startRef.current;
    const remaining = NVESTIV_LOADER_CYCLE_MS - (elapsed % NVESTIV_LOADER_CYCLE_MS);
    const t = window.setTimeout(() => setShown(false), remaining);
    return () => window.clearTimeout(t);
  }, [loading, shown]);

  return shown;
}

interface NvestivLoaderProps {
  size?: number;
  className?: string;
  label?: string;
  fullscreen?: boolean;
}

/**
 * Animated brand loader. Use anywhere a loading/processing state is needed.
 * - `fullscreen`: centers in the parent flex/grid container with vertical spacing.
 */
export function NvestivLoader({
  size = 96,
  className,
  label,
  fullscreen = false,
}: NvestivLoaderProps) {
  const img = (
    <img
      src={nvestivAssemble}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="select-none"
      draggable={false}
    />
  );

  if (fullscreen) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={label ?? "Loading"}
        className={cn("flex flex-col items-center justify-center gap-3 py-10", className)}
      >
        {img}
        {label && <p className="text-xs text-muted-foreground">{label}</p>}
      </div>
    );
  }

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label ?? "Loading"}
      className={cn("inline-flex items-center gap-2", className)}
    >
      {img}
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </span>
  );
}