import { cn } from "@/lib/utils";

interface DotPatternProps {
  className?: string;
  style?: React.CSSProperties;
  width?: number;
  height?: number;
  cx?: number;
  cy?: number;
  cr?: number;
}

export function DotPattern({
  className,
  width = 16,
  height = 16,
  cx = 1,
  cy = 1,
  cr = 1,
}: DotPatternProps) {
  const id = `dot-pattern-${Math.random().toString(36).slice(2)}`;

  return (
    <svg
      className={cn("pointer-events-none absolute inset-0 h-full w-full fill-muted-foreground/20", className)}
      aria-hidden="true"
    >
      <defs>
        <pattern id={id} width={width} height={height} patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse">
          <circle cx={cx} cy={cy} r={cr} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} strokeWidth={0} />
    </svg>
  );
}
