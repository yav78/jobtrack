"use client";

import { useEffect, useState } from "react";
import { pushToast } from "@/components/common/Toast";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Modal } from "@/components/common/Modal";
import { DocumentPreviewModal } from "@/components/documents/DocumentPreviewModal";
import { DocumentUploadForm } from "@/components/documents/DocumentUploadForm";
import { documentService } from "@/lib/services/front/document.service";
import type { DocumentDTO } from "@/lib/dto/document";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function DocumentLibrary() {
  const [documents, setDocuments] = useState<DocumentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentDTO | null>(null);
  const [editingDoc, setEditingDoc] = useState<DocumentDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentDTO | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    documentService
      .list()
      .then(setDocuments)
      .catch(() => pushToast({ type: "error", title: "Erreur lors du chargement" }))
      .finally(() => setLoading(false));
  }, []);

  function handleUploaded(doc: DocumentDTO) {
    setDocuments((prev) => [doc, ...prev]);
    setShowUpload(false);
  }

  function openEdit(doc: DocumentDTO) {
    setEditingDoc(doc);
    setEditTitle(doc.title);
    setEditDescription(doc.description ?? "");
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingDoc) return;
    if (!editTitle.trim()) return;
    setSaving(true);
    try {
      const updated = await documentService.update(editingDoc.id, {
        title: editTitle.trim() || undefined,
        description: editDescription.trim() || undefined,
      });
      setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setEditingDoc(null);
      pushToast({ type: "success", title: "Document mis à jour" });
    } catch (err) {
      pushToast({
        type: "error",
        title: "Erreur",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await documentService.delete(deleteTarget.id);
      setDocuments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      pushToast({ type: "success", title: "Document supprimé" });
    } catch {
      pushToast({ type: "error", title: "Erreur lors de la suppression" });
    } finally {
      setDeleteTarget(null);
    }
  }

  if (loading) return <p className="text-sm text-neutral-500">Chargement…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {documents.length} document{documents.length !== 1 ? "s" : ""}
        </p>
        <button
          type="button"
          onClick={() => setShowUpload(true)}
          className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Nouveau document
        </button>
      </div>

      {showUpload && (
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
          <h3 className="mb-3 text-sm font-medium">Uploader un document</h3>
          <DocumentUploadForm onSuccess={handleUploaded} onCancel={() => setShowUpload(false)} />
        </div>
      )}

      {documents.length === 0 && !showUpload && (
        <p className="py-10 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Aucun document. Cliquez sur &quot;Nouveau document&quot; pour commencer.
        </p>
      )}

      {documents.length > 0 && (
        <div className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-700 dark:border-neutral-700">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-start gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{doc.title}</p>
                {doc.description && (
                  <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                    {doc.description}
                  </p>
                )}
                <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                  {doc.originalName} · {formatBytes(doc.size)} · {formatDate(doc.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(doc)}
                  className="rounded px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  Aperçu
                </button>
                <a
                  href={`/api/documents/${doc.id}/file?download=true`}
                  className="rounded px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  Télécharger
                </a>
                <button
                  type="button"
                  onClick={() => openEdit(doc)}
                  className="rounded px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(doc)}
                  className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DocumentPreviewModal document={previewDoc} onClose={() => setPreviewDoc(null)} />

      <Modal open={!!editingDoc} title="Modifier le document" onClose={() => setEditingDoc(null)}>
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Titre</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              maxLength={255}
              required
              className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              maxLength={1000}
              rows={2}
              className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditingDoc(null)}
              className="rounded px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer le document"
        description={`Supprimer "${deleteTarget?.title}" ? Cette action est irréversible et déliera le document de toutes les actions associées.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
