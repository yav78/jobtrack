"use client";

import { useEffect, useState } from "react";
import { marked } from "marked";
import type { DocumentDTO } from "@/lib/dto/document";

type Props = {
  document: DocumentDTO | null;
  onClose: () => void;
};

function isImage(mimeType: string) {
  return mimeType.startsWith("image/");
}
function isPdf(mimeType: string) {
  return mimeType === "application/pdf";
}
function isText(mimeType: string) {
  return mimeType === "text/plain";
}
function isMarkdown(mimeType: string) {
  return mimeType === "text/markdown";
}
function isWord(mimeType: string) {
  return (
    mimeType === "application/msword" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
}
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function DocumentPreviewModal({ document, onClose }: Props) {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [markdownHtml, setMarkdownHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!document) {
      setTextContent(null);
      setMarkdownHtml(null);
      return;
    }
    if (isText(document.mimeType) || isMarkdown(document.mimeType)) {
      setLoading(true);
      fetch(`/api/documents/${document.id}/file?download=false`, {
        credentials: "include",
      })
        .then((res) => res.text())
        .then(async (text) => {
          if (isMarkdown(document.mimeType)) {
            const html = String(await marked.parse(text));
            setMarkdownHtml(html);
          } else {
            setTextContent(text);
          }
        })
        .catch(() => setTextContent("Erreur lors du chargement du fichier."))
        .finally(() => setLoading(false));
    }
  }, [document]);

  if (!document) return null;

  const fileUrl = `/api/documents/${document.id}/file`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex w-full max-w-4xl flex-col rounded-lg bg-white shadow-xl dark:bg-neutral-900 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-neutral-200 p-4 dark:border-neutral-700">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold">{document.title}</h2>
            {document.description && (
              <p className="mt-0.5 truncate text-sm text-neutral-500 dark:text-neutral-400">
                {document.description}
              </p>
            )}
            <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
              {document.originalName} · {formatBytes(document.size)}
            </p>
          </div>
          <div className="ml-4 flex shrink-0 items-center gap-2">
            <a
              href={`${fileUrl}?download=true`}
              className="rounded bg-neutral-100 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
            >
              Télécharger
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Fermer
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-4">
          {isPdf(document.mimeType) && (
            <iframe
              src={`${fileUrl}?download=false`}
              className="h-[65vh] w-full rounded border border-neutral-200 dark:border-neutral-700"
              title={document.title}
            />
          )}

          {isImage(document.mimeType) && (
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${fileUrl}?download=false`}
                alt={document.title}
                className="max-h-[65vh] max-w-full rounded object-contain"
              />
            </div>
          )}

          {isText(document.mimeType) && (
            <pre className="whitespace-pre-wrap break-words rounded bg-neutral-50 p-4 font-mono text-sm text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
              {loading ? "Chargement…" : textContent}
            </pre>
          )}

          {isMarkdown(document.mimeType) && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {loading ? (
                <p className="text-neutral-500">Chargement…</p>
              ) : markdownHtml ? (
                <div dangerouslySetInnerHTML={{ __html: markdownHtml }} />
              ) : null}
            </div>
          )}

          {isWord(document.mimeType) && (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <p className="text-neutral-500 dark:text-neutral-400">
                La prévisualisation n&apos;est pas disponible pour les fichiers Word.
              </p>
              <a
                href={`${fileUrl}?download=true`}
                className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Télécharger le fichier
              </a>
            </div>
          )}

          {!isPdf(document.mimeType) &&
            !isImage(document.mimeType) &&
            !isText(document.mimeType) &&
            !isMarkdown(document.mimeType) &&
            !isWord(document.mimeType) && (
              <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <p className="text-neutral-500 dark:text-neutral-400">
                  Aperçu non disponible pour ce type de fichier.
                </p>
                <a
                  href={`${fileUrl}?download=true`}
                  className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Télécharger le fichier
                </a>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
