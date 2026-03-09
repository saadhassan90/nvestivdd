import { cn } from "@/lib/utils";
import { CSSProperties } from "react";

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  shimmerColor?: string;
  background?: string;
}

export function ShimmerButton({ children, className, shimmerColor, background, style, ...props }: ShimmerButtonProps) {
  const customStyle: CSSProperties = {
    ...style,
    ...(background ? { backgroundColor: background } : {}),
    ...(shimmerColor ? { "--shimmer-color": shimmerColor } as CSSProperties : {}),
  };

  return (
    <button
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50",
        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-[var(--shimmer-color,rgba(255,255,255,0.1))] before:to-transparent before:animate-shimmer before:bg-[length:200%_100%]",
        className
      )}
      style={customStyle}
      {...props}
    >
      {children}
    </button>
  );
}
