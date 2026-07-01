import { useState, useEffect, useCallback } from "react";

type Theme = "dark" | "light" | "darcula";

const THEME_KEY = "k8sdownloader-theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark" || stored === "darcula") return stored;
  // Respect OS preference; default to dark
  if (window.matchMedia("(prefers-color-scheme: light)").matches) return "light";
  return "dark";
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.remove("dark", "light", "darcula");
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "darcula") {
    root.classList.add("darcula");
  } else {
    root.classList.add("light");
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const themes: Theme[] = ["light", "dark", "darcula"];
      const currentIndex = themes.indexOf(prev);
      const nextIndex = (currentIndex + 1) % themes.length;
      const next = themes[nextIndex];
      localStorage.setItem(THEME_KEY, next);
      return next;
    });
  }, []);

  return { theme, toggle };
}
