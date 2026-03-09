import { useEffect, useRef, useState } from "react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";

interface NumberTickerProps {
  value: number;
  direction?: "up" | "down";
  delay?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
}

export function NumberTicker({
  value,
  direction = "up",
  delay = 0,
  className = "",
  suffix = "",
  prefix = "",
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const spring = useSpring(direction === "down" ? value : 0, {
    bounce: 0,
    duration: 2000,
  });
  const display = useTransform(spring, (current) => Math.round(current));
  const [displayValue, setDisplayValue] = useState(direction === "down" ? value : 0);

  useEffect(() => {
    if (isInView) {
      setTimeout(() => {
        spring.set(direction === "down" ? 0 : value);
      }, delay * 1000);
    }
  }, [isInView, spring, value, direction, delay]);

  useEffect(() => {
    const unsubscribe = display.on("change", (v) => setDisplayValue(v));
    return unsubscribe;
  }, [display]);

  return (
    <span ref={ref} className={className}>
      {prefix}{displayValue}{suffix}
    </span>
  );
}
