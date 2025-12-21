"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  // Toujours initialiser à "dark" pour éviter l'erreur d'hydratation
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  // Initialiser le thème après l'hydratation
  useEffect(() => {
    const stored = window.localStorage.getItem("jobtrack-theme");
    const initialTheme = stored === "light" || stored === "dark" ? stored : "dark";
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
    // Différer les setState pour éviter l'avertissement ESLint
    queueMicrotask(() => {
      setTheme(initialTheme);
      setMounted(true);
    });
  }, []);

  // Synchroniser le thème avec le DOM et localStorage
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("jobtrack-theme", theme);
  }, [theme, mounted]);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Changer le thème"
      className="rounded-md border px-3 py-1 text-sm transition hover:bg-neutral-800 hover:text-white dark:border-neutral-700 dark:hover:bg-neutral-200 dark:hover:text-neutral-900"
      suppressHydrationWarning
    >
      {!mounted ? "Mode clair" : theme === "dark" ? "Mode clair" : "Mode sombre"}
    </button>
  );
}

