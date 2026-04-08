"use client";

import { useState, useEffect } from "react";

type Props = {
  url: string;
  onClose: () => void;
};

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function SourceModal({ url, onClose }: Props) {
  // Track which URL is blocked rather than a plain boolean,
  // so the state auto-clears whenever the URL prop changes.
  const [blockedUrl, setBlockedUrl] = useState<string | null>(null);
  const blocked = blockedUrl === url;

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const domain = extractDomain(url);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex h-[80vh] w-[90vw] max-w-5xl flex-col rounded-lg bg-white shadow-xl dark:bg-neutral-900">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-700">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate">
              {domain}
            </span>
            <span className="hidden text-xs text-neutral-400 truncate sm:block">
              {url}
            </span>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2 ml-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded border border-neutral-300 px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Ouvrir dans un onglet ↗
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded px-2 py-1 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Fermer
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="relative flex-1 overflow-hidden">
          {blocked ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
              <p className="text-neutral-500 dark:text-neutral-400">
                Ce site refuse d&apos;être affiché dans une fenêtre intégrée.
              </p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700"
              >
                Ouvrir dans un nouvel onglet ↗
              </a>
            </div>
          ) : (
            <iframe
              key={url}
              src={url}
              className="h-full w-full border-0"
              title={domain}
              onError={() => setBlockedUrl(url)}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          )}
        </div>
      </div>
    </div>
  );
}
