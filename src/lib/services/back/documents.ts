import path from "path";
import { promises as fs } from "fs";
import { prisma } from "@/lib/prisma";
import { NotFound } from "@/lib/errors";
import type { Document } from "@prisma/client";

export function getUploadsBase(): string {
  return process.env.UPLOADS_DIR ?? path.join(process.cwd(), "uploads");
}


export async function ensureUserUploadsDir(userId: string): Promise<void> {
  const dir = path.join(getUploadsBase(), userId);
  await fs.mkdir(dir, { recursive: true });
}

export async function listDocuments(userId: string): Promise<Document[]> {
  return prisma.document.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDocumentById(id: string, userId: string): Promise<Document | null> {
  return prisma.document.findFirst({ where: { id, userId } });
}

export async function createDocument(
  userId: string,
  data: {
    title: string;
    description?: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
  }
): Promise<Document> {
  return prisma.document.create({ data: { ...data, userId } });
}

export async function updateDocument(
  id: string,
  userId: string,
  data: { title?: string; description?: string | null }
): Promise<Document> {
  const existing = await prisma.document.findFirst({ where: { id, userId } });
  if (!existing) throw NotFound("Document introuvable");
  return prisma.document.update({ where: { id }, data });
}

export async function deleteDocument(
  id: string,
  userId: string
): Promise<{ filename: string; userId: string }> {
  const existing = await prisma.document.findFirst({ where: { id, userId } });
  if (!existing) throw NotFound("Document introuvable");
  await prisma.document.delete({ where: { id } });
  return { filename: existing.filename, userId: existing.userId };
}

export async function linkDocumentToAction(
  actionId: string,
  documentId: string,
  userId: string
): Promise<void> {
  const [action, document] = await Promise.all([
    prisma.opportunityAction.findFirst({ where: { id: actionId, userId } }),
    prisma.document.findFirst({ where: { id: documentId, userId } }),
  ]);
  if (!action) throw NotFound("Action introuvable");
  if (!document) throw NotFound("Document introuvable");

  await prisma.actionDocument.upsert({
    where: { actionId_documentId: { actionId, documentId } },
    create: { actionId, documentId },
    update: {},
  });
}

export async function unlinkDocumentFromAction(
  actionId: string,
  documentId: string,
  userId: string
): Promise<void> {
  const action = await prisma.opportunityAction.findFirst({ where: { id: actionId, userId } });
  if (!action) throw NotFound("Action introuvable");
  await prisma.actionDocument.deleteMany({ where: { actionId, documentId } });
}

export async function listDocumentsForAction(
  actionId: string,
  userId: string
): Promise<Document[]> {
  const action = await prisma.opportunityAction.findFirst({ where: { id: actionId, userId } });
  if (!action) throw NotFound("Action introuvable");
  const links = await prisma.actionDocument.findMany({
    where: { actionId },
    include: { document: true },
  });
  return links.map((l) => l.document);
}

export function documentToDto(doc: Document) {
  return {
    id: doc.id,
    title: doc.title,
    description: doc.description,
    originalName: doc.originalName,
    mimeType: doc.mimeType,
    size: doc.size,
    userId: doc.userId,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
