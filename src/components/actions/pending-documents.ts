import type { DocumentDTO } from "@/lib/dto/document";

export function addPendingDocument(
  documents: DocumentDTO[],
  document: DocumentDTO
): DocumentDTO[] {
  if (documents.some((item) => item.id === document.id)) return documents;
  return [document, ...documents];
}

export function removePendingDocument(
  documents: DocumentDTO[],
  documentId: string
): DocumentDTO[] {
  return documents.filter((document) => document.id !== documentId);
}
