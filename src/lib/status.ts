export type Status = "good" | "warning" | "serious" | "critical";

/** Status always ships with an icon and a label — never colour alone. */
export const STATUS_META: Record<Status, { icon: string; label: string }> = {
  good: { icon: "✓", label: "healthy" },
  warning: { icon: "!", label: "degraded" },
  serious: { icon: "!!", label: "serious" },
  critical: { icon: "✕", label: "failing" },
};
