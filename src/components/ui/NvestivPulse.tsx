import nvestivPulse from "@/assets/nvestiv-pulse.svg";
import { cn } from "@/lib/utils";

interface NvestivPulseProps {
  size?: number;
  className?: string;
  label?: string;
}

/**
 * Brand "working" indicator. Shown at the bottom of a chat thread once
 * while the assistant is producing a response (Claude-style).
 */
export function NvestivPulse({ size = 28, className, label = "Working" }: NvestivPulseProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn("flex items-center gap-2 pl-1", className)}
    >
      <img
        src={nvestivPulse}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="select-none"
        draggable={false}
      />
    </div>
  );
}