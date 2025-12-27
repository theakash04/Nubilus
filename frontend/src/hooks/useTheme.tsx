import { useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark" | "system";
const THEME_KEY = "theme";

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === "light" || saved === "dark" || saved === "system"
      ? saved
      : "system";
  });

  const currentTheme = useMemo(() => {
    if (typeof window === "undefined") return "dark";
    return theme === "system" ? getSystemTheme() : theme;
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      document.documentElement.setAttribute("data-theme", getSystemTheme());
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [theme]);

  function setUserTheme(next: Theme) {
    setTheme(next);

    if (next === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, next);
  }

  return { currentTheme, setUserTheme, theme };
}
