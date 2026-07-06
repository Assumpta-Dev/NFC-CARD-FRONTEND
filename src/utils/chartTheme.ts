import type { ResolvedTheme } from "../contexts/ThemeContext";

export function getChartColors(theme: ResolvedTheme) {
  const isDark = theme === "dark";
  return {
    grid: isDark ? "#374151" : "#f3f4f6",
    tick: "#9ca3af",
    tooltip: {
      borderRadius: "8px",
      border: `1px solid ${isDark ? "#374151" : "#f3f4f6"}`,
      backgroundColor: isDark ? "#111827" : "#ffffff",
      color: isDark ? "#f3f4f6" : "#111827",
      fontSize: 11,
    },
    brand: "#f05535",
    blue: "#3b82f6",
  };
}
