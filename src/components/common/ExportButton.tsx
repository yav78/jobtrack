"use client";

type ExportButtonProps = {
  href: string;
  label?: string;
};

export function ExportButton({ href, label = "Exporter CSV" }: ExportButtonProps) {
  return (
    <a
      href={href}
      download
      className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
    >
      {label}
    </a>
  );
}
