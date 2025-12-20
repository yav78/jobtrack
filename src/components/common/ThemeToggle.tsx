"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "dark";
    const stored = window.localStorage.getItem("jobtrack-theme");
    return stored === "light" || stored === "dark" ? stored : "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    if (typeof window !== "undefined") {
      window.localStorage.setItem("jobtrack-theme", theme);
    }
  }, [theme]);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    window.localStorage.setItem("jobtrack-theme", next);
  };

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

