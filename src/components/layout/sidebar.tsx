"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/companies", label: "Entreprises" },
  { href: "/contacts", label: "Contacts" },
  { href: "/opportunities", label: "Opportunités" },
  { href: "/entretiens/new", label: "Nouvel entretien" },
];

export function SideBar() {
  const pathname = usePathname();

  return (
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
  );
}

