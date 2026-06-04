"use client";

import { useTheme } from "next-themes";

export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  return {
    grid: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    axis: isDark ? "#a1a1aa" : "#71717a",
    tooltipBg: isDark ? "#18181b" : "#ffffff",
    tooltipBorder: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
    tooltipText: isDark ? "#fafafa" : "#18181b",
  };
}
