"use client";

import { useRef, useState } from "react";
import { pushToast } from "@/components/common/Toast";
import { documentService } from "@/lib/services/front/document.service";
import type { DocumentDTO } from "@/lib/dto/document";

const ACCEPT = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "text/plain",
  "text/markdown",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
].join(",");

type Props = {
  onSuccess: (document: DocumentDTO) => void;
  onCancel?: () => void;
};

export function DocumentUploadForm({ onSuccess, onCancel }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title.trim()) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title.trim());
    if (description.trim()) formData.append("description", description.trim());

    setUploading(true);
    try {
      const doc = await documentService.upload(formData);
      pushToast({ type: "success", title: "Document uploadé avec succès" });
      onSuccess(doc);
      setTitle("");
      setDescription("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      pushToast({
        type: "error",
        title: "Erreur lors de l'upload",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">
          Titre <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={255}
          placeholder="Ex : CV Développeur Senior 2024"
          className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
          rows={2}
          placeholder="Optionnel — note sur ce document"
          className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Fichier <span className="text-red-500">*</span>
        </label>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          required
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-neutral-600 dark:text-neutral-300"
        />
        <p className="mt-1 text-xs text-neutral-400">
          PDF, image, texte, Markdown ou Word — max 10 Mo
        </p>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={uploading || !file || !title.trim()}
          className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {uploading ? "Upload en cours…" : "Uploader"}
        </button>
      </div>
    </form>
  );
}
