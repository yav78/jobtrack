"use client";

import { useEffect, useState } from "react";
import { pushToast } from "@/components/common/Toast";
import { DocumentPreviewModal } from "@/components/documents/DocumentPreviewModal";
import { DocumentUploadForm } from "@/components/documents/DocumentUploadForm";
import { documentService } from "@/lib/services/front/document.service";
import type { DocumentDTO } from "@/lib/dto/document";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

type Props = { actionId: string };

export function ActionDocumentPicker({ actionId }: Props) {
  const [linked, setLinked] = useState<DocumentDTO[]>([]);
  const [library, setLibrary] = useState<DocumentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState("");
  const [previewDoc, setPreviewDoc] = useState<DocumentDTO | null>(null);
  const [linking, setLinking] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([documentService.listForAction(actionId), documentService.list()])
      .then(([linkedDocs, allDocs]) => {
        setLinked(linkedDocs);
        setLibrary(allDocs);
      })
      .catch(() => pushToast({ type: "error", title: "Erreur lors du chargement des documents" }))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionId]);

  async function handleLink(docId: string, resolvedDoc?: DocumentDTO) {
    setLinking(docId);
    try {
      await documentService.linkToAction(actionId, docId);
      const doc = resolvedDoc ?? library.find((d) => d.id === docId);
      if (doc) setLinked((prev) => [...prev, doc]);
      setShowPicker(false);
      setSearch("");
      pushToast({ type: "success", title: "Document lié à l'action" });
    } catch (err) {
      pushToast({
        type: "error",
        title: "Erreur",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLinking(null);
    }
  }

  async function handleUnlink(docId: string) {
    try {
      await documentService.unlinkFromAction(actionId, docId);
      setLinked((prev) => prev.filter((d) => d.id !== docId));
      pushToast({ type: "success", title: "Document délié" });
    } catch {
      pushToast({ type: "error", title: "Erreur lors du délien" });
    }
  }

  function handleUploaded(doc: DocumentDTO) {
    setLibrary((prev) => [doc, ...prev]);
    setShowUpload(false);
    handleLink(doc.id, doc);
  }

  const linkedIds = new Set(linked.map((d) => d.id));
  const filteredLibrary = library.filter(
    (d) =>
      !linkedIds.has(d.id) &&
      (search === "" ||
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        d.originalName.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <p className="text-sm text-neutral-500">Chargement…</p>;

  return (
    <div className="space-y-3">
      {linked.length === 0 && (
        <p className="text-sm text-neutral-400 dark:text-neutral-500">
          Aucun document lié à cette action.
        </p>
      )}

      {linked.length > 0 && (
        <div className="divide-y divide-neutral-100 rounded border border-neutral-200 dark:divide-neutral-700 dark:border-neutral-700">
          {linked.map((doc) => (
            <div key={doc.id} className="flex items-center gap-2 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{doc.title}</p>
                <p className="truncate text-xs text-neutral-400">
                  {doc.originalName} · {formatBytes(doc.size)}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(doc)}
                  className="rounded px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
                >
                  Aperçu
                </button>
                <a
                  href={`/api/documents/${doc.id}/file?download=true`}
                  className="rounded px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
                >
                  Télécharger
                </a>
                <button
                  type="button"
                  onClick={() => handleUnlink(doc.id)}
                  className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Délier
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!showPicker && !showUpload && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="rounded border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Lier un document
          </button>
          <button
            type="button"
            onClick={() => setShowUpload(true)}
            className="rounded border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Uploader et lier
          </button>
        </div>
      )}

      {showPicker && (
        <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Choisir dans la bibliothèque</span>
            <button
              type="button"
              onClick={() => { setShowPicker(false); setSearch(""); }}
              className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            >
              Fermer
            </button>
          </div>
          <input
            type="search"
            placeholder="Rechercher par titre…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-2 w-full rounded border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-800"
          />
          {filteredLibrary.length === 0 ? (
            <p className="py-3 text-center text-sm text-neutral-400">
              {library.filter((d) => !linkedIds.has(d.id)).length === 0
                ? "Tous les documents sont déjà liés."
                : "Aucun résultat."}
            </p>
          ) : (
            <div className="max-h-48 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-700">
              {filteredLibrary.map((doc) => (
                <div key={doc.id} className="flex items-center gap-2 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{doc.title}</p>
                    <p className="truncate text-xs text-neutral-400">{doc.originalName}</p>
                  </div>
                  <button
                    type="button"
                    disabled={linking === doc.id}
                    onClick={() => handleLink(doc.id)}
                    className="shrink-0 rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {linking === doc.id ? "…" : "Lier"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showUpload && (
        <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Uploader un nouveau document</span>
            <button
              type="button"
              onClick={() => setShowUpload(false)}
              className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            >
              Fermer
            </button>
          </div>
          <DocumentUploadForm onSuccess={handleUploaded} onCancel={() => setShowUpload(false)} />
        </div>
      )}

      <DocumentPreviewModal document={previewDoc} onClose={() => setPreviewDoc(null)} />
    </div>
  );
}
