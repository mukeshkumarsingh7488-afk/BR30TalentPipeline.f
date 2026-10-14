import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);

const STORAGE_KEY = "br30-talent-pipeline-theme";
const VALID_THEMES = ["light", "dark", "device"];

function getSavedTheme() {
  try {
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    return VALID_THEMES.includes(savedTheme) ? savedTheme : "device";
  } catch {
    return "device";
  }
}

function getDeviceTheme() {
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
}

function applyTheme(resolvedTheme) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  root.dataset.theme = resolvedTheme;
  root.style.colorScheme = resolvedTheme;
  root.classList.toggle("dark", resolvedTheme === "dark");
  root.classList.toggle("light", resolvedTheme === "light");
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getSavedTheme);
  const [systemTheme, setSystemTheme] = useState(getDeviceTheme);

  const resolvedTheme = theme === "device" ? systemTheme : theme;

  const setTheme = useCallback((nextTheme) => {
    if (!VALID_THEMES.includes(nextTheme)) {
      console.warn(`Invalid theme "${nextTheme}". Use light, dark, or device.`);
      return;
    }

    setThemeState(nextTheme);

    try {
      localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // Theme still works if browser storage is unavailable.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = (event) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    setSystemTheme(mediaQuery.matches ? "dark" : "light");
    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, []);

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      resolvedTheme,
      systemTheme,
      isDark: resolvedTheme === "dark",
      isLight: resolvedTheme === "light",
      toggleTheme,
    }),
    [theme, setTheme, resolvedTheme, systemTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider.");
  }

  return context;
}

export default ThemeContext;
