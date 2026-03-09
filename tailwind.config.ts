import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        score: {
          strong: "hsl(var(--score-strong))",
          advance: "hsl(var(--score-advance))",
          review: "hsl(var(--score-review))",
          decline: "hsl(var(--score-decline))",
        },
        severity: {
          critical: "hsl(var(--severity-critical))",
          elevated: "hsl(var(--severity-elevated))",
          monitor: "hsl(var(--severity-monitor))",
        },
        trend: {
          positive: "hsl(var(--trend-positive))",
          negative: "hsl(var(--trend-negative))",
        },
      },
      keyframes: {
        "number-tick": {
          from: { transform: "translateY(100%)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        shimmer: "shimmer 8s ease-in-out infinite",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    heroui({
      defaultTheme: "light",
      themes: {
        light: {
          colors: {
            background: "#FAFAFA",
            foreground: "#18181B",
            primary: {
              50: "#EEF2FF",
              100: "#E0E7FF",
              200: "#C7D2FE",
              300: "#A5B4FC",
              400: "#818CF8",
              500: "#6366F1",
              600: "#4F46E5",
              700: "#4338CA",
              800: "#3730A3",
              900: "#312E81",
              DEFAULT: "#6366F1",
              foreground: "#FFFFFF",
            },
            success: {
              DEFAULT: "#10B981",
              foreground: "#FFFFFF",
            },
            warning: {
              DEFAULT: "#F59E0B",
              foreground: "#FFFFFF",
            },
            danger: {
              DEFAULT: "#EF4444",
              foreground: "#FFFFFF",
            },
          },
        },
      },
    }),
  ],
} satisfies Config;
