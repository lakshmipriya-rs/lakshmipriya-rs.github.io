import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "portfolio-theme";

const readStoredTheme = (): Theme | null => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
};

// Dark-first: a terminal portfolio reads best dark. Light stays one click away
// and the visitor's choice is remembered.
const DEFAULT_THEME: Theme = "dark";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(
    () => readStoredTheme() ?? DEFAULT_THEME,
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* storage unavailable: theme still applies for this visit */
      }
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
