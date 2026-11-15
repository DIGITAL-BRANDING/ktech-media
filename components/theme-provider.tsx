"use client";

import { createContext, useContext, useEffect, useSyncExternalStore } from "react";

type Theme = "dark" | "light";
const themeListeners = new Set<() => void>();
const themeKey = "haske-media-theme";
function getThemeSnapshot(): Theme { return localStorage.getItem(themeKey) === "light" ? "light" : "dark"; }
function getServerThemeSnapshot(): Theme { return "dark"; }
function subscribeToTheme(listener: () => void) {
  themeListeners.add(listener);
  const onStorage = (event: StorageEvent) => { if (event.key === themeKey) listener(); };
  window.addEventListener("storage", onStorage);
  return () => { themeListeners.delete(listener); window.removeEventListener("storage", onStorage); };
}
const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void }>({
  theme: "dark",
  toggleTheme: () => undefined,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    localStorage.setItem(themeKey, next);
    document.documentElement.dataset.theme = next;
    themeListeners.forEach((listener) => listener());
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const nextLabel = theme === "dark" ? "Canza zuwa haske" : "Canza zuwa duhu";
  return (
    <button className={`theme-toggle${compact ? " theme-toggle-compact" : ""}`} type="button" onClick={toggleTheme} aria-label={nextLabel} title={nextLabel}>
      <i className={`bi ${theme === "dark" ? "bi-sun" : "bi-moon-stars"}`} aria-hidden="true" />
      {!compact && <span>{theme === "dark" ? "Haske" : "Duhu"}</span>}
    </button>
  );
}
