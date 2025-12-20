"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = window.localStorage.getItem("jobtrack-theme");
    const initialTheme = stored === "light" || stored === "dark" ? stored : "dark";
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle("dark", theme === "dark");
      window.localStorage.setItem("jobtrack-theme", theme);
    }
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

