"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Tableau de bord" },
  { href: "/companies", label: "Entreprises" },
  { href: "/contacts", label: "Contacts" },
  { href: "/opportunities", label: "Opportunités" },
  { href: "/actions", label: "Actions" },
  { href: "/entretiens/new", label: "Nouvel entretien" },
];

export function SideBar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Bouton hamburger pour mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-4 z-50 rounded-md border border-neutral-300 bg-white p-2 text-neutral-700 shadow-md dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 lg:hidden"
        aria-label="Toggle menu"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isOpen ? (
            <path d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Overlay pour mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-full w-64 border-r border-neutral-200 bg-neutral-50 p-4 text-neutral-900 transition-transform duration-300 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="mb-6 text-lg font-semibold">Jobtrack</div>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`block rounded-md px-3 py-2 text-sm transition ${
                  active
                    ? "bg-neutral-200 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                    : "text-neutral-700 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
