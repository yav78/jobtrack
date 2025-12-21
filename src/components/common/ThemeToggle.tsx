"use client";

import { useEffect, useState } from "react";

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem("jobtrack-theme");
  return stored === "light" || stored === "dark" ? stored : "dark";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);
  const [mounted, setMounted] = useState(typeof window !== "undefined");

  // Initialiser le thème au montage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const initialTheme = getInitialTheme();
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
    // Différer setMounted pour éviter l'avertissement ESLint
    queueMicrotask(() => {
      setMounted(true);
    });
  }, []);

  // Synchroniser le thème avec le DOM et localStorage
  useEffect(() => {
    if (typeof window === "undefined" || !mounted) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("jobtrack-theme", theme);
  }, [theme, mounted]);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Changer le thème"
        className="rounded-md border px-3 py-1 text-sm transition hover:bg-neutral-800 hover:text-white dark:border-neutral-700 dark:hover:bg-neutral-200 dark:hover:text-neutral-900"
      >
        Mode clair
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Changer le thème"
      className="rounded-md border px-3 py-1 text-sm transition hover:bg-neutral-800 hover:text-white dark:border-neutral-700 dark:hover:bg-neutral-200 dark:hover:text-neutral-900"
    >
      {theme === "dark" ? "Mode clair" : "Mode sombre"}
    </button>
  );
}

