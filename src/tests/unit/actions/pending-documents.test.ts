import { describe, expect, it } from "vitest";
import {
  addPendingDocument,
  removePendingDocument,
} from "@/components/actions/pending-documents";
import type { DocumentDTO } from "@/lib/dto/document";

const cv: DocumentDTO = {
  id: "00000000-0000-0000-0000-000000000101",
  title: "CV Senior",
  description: null,
  originalName: "cv-senior.pdf",
  mimeType: "application/pdf",
  size: 42,
  userId: "00000000-0000-0000-0000-000000000001",
  createdAt: "2026-04-27T10:00:00.000Z",
  updatedAt: "2026-04-27T10:00:00.000Z",
};

const coverLetter: DocumentDTO = {
  id: "00000000-0000-0000-0000-000000000102",
  title: "Lettre",
  description: null,
  originalName: "lettre.pdf",
  mimeType: "application/pdf",
  size: 84,
  userId: "00000000-0000-0000-0000-000000000001",
  createdAt: "2026-04-27T10:00:00.000Z",
  updatedAt: "2026-04-27T10:00:00.000Z",
};

describe("pending action documents", () => {
  it("adds an existing document once before action creation", () => {
    const pending = addPendingDocument([cv], cv);

    expect(pending).toEqual([cv]);
  });

  it("adds a new existing document before already selected documents", () => {
    const pending = addPendingDocument([cv], coverLetter);

    expect(pending).toEqual([coverLetter, cv]);
  });

  it("removes a pending document before action creation", () => {
    const pending = removePendingDocument([coverLetter, cv], cv.id);

    expect(pending).toEqual([coverLetter]);
  });
});
