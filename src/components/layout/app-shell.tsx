"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/companies", label: "Entreprises" },
  { href: "/contacts", label: "Contacts" },
  { href: "/opportunities", label: "Opportunités" },
  { href: "/entretiens/new", label: "Nouvel entretien" },
];

function ThemeToggle() {
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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-64 border-r border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900 lg:block">
        <div className="mb-6 text-lg font-semibold">Jobtrack</div>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-3 py-2 text-sm transition ${
                  active
                    ? "bg-neutral-200 font-medium dark:bg-neutral-800"
                    : "hover:bg-neutral-200 dark:hover:bg-neutral-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="text-base font-semibold">Mini CRM Recherche d&apos;emploi</div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 bg-white px-4 py-6 dark:bg-neutral-950">{children}</main>
      </div>
    </div>
  );
}

