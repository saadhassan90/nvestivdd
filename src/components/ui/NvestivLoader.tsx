import nvestivAssemble from "@/assets/nvestiv-assemble.svg";
import { cn } from "@/lib/utils";

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