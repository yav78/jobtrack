"use client";

import { frontFetchJson } from "./abstract-crus.service";
import type { DocumentDTO } from "@/lib/dto/document";

type DocumentListResponse = { items: DocumentDTO[] };
type DocumentResponse = { data: DocumentDTO };

async function uploadDocument(formData: FormData): Promise<DocumentDTO> {
  const url = "/api/documents";
  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    body: formData,
    // Do NOT set Content-Type — browser sets it with boundary for multipart
  });

  if (!response.ok) {
    let message = `Upload failed: ${response.status}`;
    try {
      const data = await response.json();
      message = (data as { error?: string }).error ?? message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const data = (await response.json()) as { data: DocumentDTO };
  return data.data;
}

async function listDocuments(): Promise<DocumentDTO[]> {
  const data = await frontFetchJson<DocumentListResponse>("/api/documents");
  return data.items;
}

async function updateDocument(
  id: string,
  data: { title?: string; description?: string }
): Promise<DocumentDTO> {
  const result = await frontFetchJson<DocumentResponse>(`/api/documents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return result.data;
}

async function deleteDocument(id: string): Promise<void> {
  await frontFetchJson<void>(`/api/documents/${id}`, { method: "DELETE" });
}

async function listDocumentsForAction(actionId: string): Promise<DocumentDTO[]> {
  const data = await frontFetchJson<DocumentListResponse>(
    `/api/actions/${actionId}/documents`
  );
  return data.items;
}

async function linkDocumentToAction(actionId: string, documentId: string): Promise<void> {
  await frontFetchJson<void>(`/api/actions/${actionId}/documents`, {
    method: "POST",
    body: JSON.stringify({ documentId }),
  });
}

async function unlinkDocumentFromAction(
  actionId: string,
  documentId: string
): Promise<void> {
  await frontFetchJson<void>(`/api/actions/${actionId}/documents/${documentId}`, {
    method: "DELETE",
  });
}

export const documentService = {
  upload: uploadDocument,
  list: listDocuments,
  update: updateDocument,
  delete: deleteDocument,
  listForAction: listDocumentsForAction,
  linkToAction: linkDocumentToAction,
  unlinkFromAction: unlinkDocumentFromAction,
};
