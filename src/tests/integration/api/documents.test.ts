import { describe, expect, it, beforeAll, afterAll, vi } from "vitest";
import os from "os";
import path from "path";

// Point uploads to a temp dir and mock fs so no real files are written
process.env.UPLOADS_DIR = path.join(os.tmpdir(), "jobtrack-test-uploads");

// Hoisted mocks so they are available in vi.mock factories (which are hoisted)
const { mockWriteFile, mockMkdir, mockUnlink, mockReadFile } = vi.hoisted(() => ({
  mockWriteFile: vi.fn().mockResolvedValue(undefined),
  mockMkdir: vi.fn().mockResolvedValue(undefined),
  mockUnlink: vi.fn().mockResolvedValue(undefined),
  mockReadFile: vi.fn().mockResolvedValue(Buffer.from("fake file content")),
}));

vi.mock("fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs/promises")>();
  return {
    ...actual,
    mkdir: mockMkdir,
    writeFile: mockWriteFile,
    unlink: mockUnlink,
    readFile: mockReadFile,
  };
});

vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs")>();
  return {
    ...actual,
    promises: {
      ...actual.promises,
      mkdir: mockMkdir,
      writeFile: mockWriteFile,
      unlink: mockUnlink,
      readFile: mockReadFile,
    },
  };
});

// Auth mock — currentTestUserId is mutated per-test to simulate different users
let currentTestUserId = "00000000-0000-0000-0000-000000000001";

vi.mock("@/lib/auth", () => ({
  resolveUser: vi.fn(async () => ({ userId: currentTestUserId })),
}));

import { prisma } from "@/lib/prisma";
import { GET as getDocs, POST as postDoc } from "@/app/api/documents/route";
import {
  GET as getDoc,
  PATCH as patchDoc,
  DELETE as deleteDoc,
} from "@/app/api/documents/[id]/route";
import { GET as getDocFile } from "@/app/api/documents/[id]/file/route";
import {
  GET as getActionDocs,
  POST as linkDoc,
} from "@/app/api/actions/[actionId]/documents/route";
import { DELETE as unlinkDoc } from "@/app/api/actions/[actionId]/documents/[documentId]/route";
import { NextRequest } from "next/server";

const userId = "00000000-0000-0000-0000-000000000001";
const userId2 = "00000000-0000-0000-0000-000000000002";

function makeRequest(url: string, method: string, body?: unknown) {
  return new NextRequest(url, {
    method,
    headers: { "content-type": "application/json", "x-user-id": userId },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function makeFormRequest(url: string, formData: FormData) {
  return new NextRequest(url, {
    method: "POST",
    headers: { "x-user-id": userId },
    body: formData,
  });
}

describe("Documents API", () => {
  let createdDocId: string;
  let createdActionId: string;
  let otherUserId2DocId: string;

  beforeAll(async () => {
    await prisma.actionDocument.deleteMany();
    await prisma.document.deleteMany();
    await prisma.opportunityAction.deleteMany();
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        fullName: "Test User",
        email: "test-doc@example.com",
        password: "x",
      },
    });
    await prisma.user.upsert({
      where: { id: userId2 },
      update: {},
      create: {
        id: userId2,
        fullName: "Other User",
        email: "test-doc-other@example.com",
        password: "x",
      },
    });
    const action = await prisma.opportunityAction.create({
      data: { userId, type: "NOTE", occurredAt: new Date() },
    });
    createdActionId = action.id;

    const doc = await prisma.document.create({
      data: {
        userId,
        title: "Mon CV",
        description: "Version 2024",
        filename: "test-uuid.pdf",
        originalName: "mon-cv.pdf",
        mimeType: "application/pdf",
        size: 12,
      },
    });
    createdDocId = doc.id;

    // Create a document belonging to userId2 for scoping tests
    const otherDoc = await prisma.document.create({
      data: {
        userId: userId2,
        title: "Other User Doc",
        originalName: "other.pdf",
        filename: "other-stored.pdf",
        mimeType: "application/pdf",
        size: 100,
      },
    });
    otherUserId2DocId = otherDoc.id;

    // Ensure auth uses userId by default
    currentTestUserId = userId;
  });

  afterAll(async () => {
    await prisma.actionDocument.deleteMany();
    await prisma.document.deleteMany();
    await prisma.opportunityAction.deleteMany();
    await prisma.$disconnect();
  });

  it("uploads a document", async () => {
    currentTestUserId = userId;
    mockWriteFile.mockClear();

    const file = new File(["test content"], "mon-cv.pdf", { type: "application/pdf" });
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", "Mon CV");
    formData.append("description", "Version 2024");

    const res = await postDoc(makeFormRequest("http://localhost/api/documents", formData));
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.data.title).toBe("Mon CV");
    expect(data.data.originalName).toBe("mon-cv.pdf");
    expect(data.data.mimeType).toBe("application/pdf");

    // Fix #3: assert writeFile was called
    expect(mockWriteFile).toHaveBeenCalled();
  });

  it("lists documents", async () => {
    currentTestUserId = userId;
    const res = await getDocs(makeRequest("http://localhost/api/documents", "GET"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.items.some((d: { id: string }) => d.id === createdDocId)).toBe(true);

    // Fix #5: negative assertion — other user's doc must not appear
    expect(data.items.every((d: { userId: string }) => d.userId === userId)).toBe(true);
    expect(data.items.some((d: { id: string }) => d.id === otherUserId2DocId)).toBe(false);
  });

  it("gets document metadata", async () => {
    currentTestUserId = userId;
    const res = await getDoc(
      makeRequest(`http://localhost/api/documents/${createdDocId}`, "GET"),
      { params: { id: createdDocId } }
    );
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.data.title).toBe("Mon CV");
  });

  // Fix #2: cross-user 404 on metadata GET
  it("returns 404 when different user tries to GET another user's document metadata", async () => {
    currentTestUserId = userId2;
    const res = await getDoc(
      makeRequest(`http://localhost/api/documents/${createdDocId}`, "GET"),
      { params: { id: createdDocId } }
    );
    currentTestUserId = userId;
    expect(res.status).toBe(404);
  });

  // Fix #6: cross-user 404 on file GET
  it("returns 404 when different user tries to GET another user's document file", async () => {
    currentTestUserId = userId2;
    const res = await getDocFile(
      makeRequest(`http://localhost/api/documents/${createdDocId}/file`, "GET"),
      { params: { id: createdDocId } }
    );
    currentTestUserId = userId;
    expect(res.status).toBe(404);
  });

  it("serves document file inline", async () => {
    currentTestUserId = userId;
    const res = await getDocFile(
      makeRequest(
        `http://localhost/api/documents/${createdDocId}/file?download=false`,
        "GET"
      ),
      { params: { id: createdDocId } }
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Disposition")).toContain("inline");
  });

  it("serves document file as attachment", async () => {
    currentTestUserId = userId;
    const res = await getDocFile(
      makeRequest(`http://localhost/api/documents/${createdDocId}/file`, "GET"),
      { params: { id: createdDocId } }
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Disposition")).toContain("attachment");
  });

  it("updates document title", async () => {
    currentTestUserId = userId;
    const res = await patchDoc(
      makeRequest(`http://localhost/api/documents/${createdDocId}`, "PATCH", {
        title: "CV Mis à jour",
      }),
      { params: { id: createdDocId } }
    );
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.data.title).toBe("CV Mis à jour");
  });

  // Fix #1: empty body rejection on PATCH
  it("rejects PATCH with empty body", async () => {
    currentTestUserId = userId;
    const res = await patchDoc(
      makeRequest(`http://localhost/api/documents/${createdDocId}`, "PATCH", {}),
      { params: { id: createdDocId } }
    );
    expect(res.status).toBe(400);
  });

  it("rejects unsupported file type", async () => {
    currentTestUserId = userId;
    const file = new File(["content"], "script.exe", {
      type: "application/octet-stream",
    });
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", "Mauvais fichier");
    const res = await postDoc(makeFormRequest("http://localhost/api/documents", formData));
    expect(res.status).toBe(400);
  });

  it("links document to action", async () => {
    currentTestUserId = userId;
    const res = await linkDoc(
      makeRequest(
        `http://localhost/api/actions/${createdActionId}/documents`,
        "POST",
        { documentId: createdDocId }
      ),
      { params: { actionId: createdActionId } }
    );
    expect(res.status).toBe(201);
  });

  it("lists documents for action", async () => {
    currentTestUserId = userId;
    const res = await getActionDocs(
      makeRequest(
        `http://localhost/api/actions/${createdActionId}/documents`,
        "GET"
      ),
      { params: { actionId: createdActionId } }
    );
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.items.some((d: { id: string }) => d.id === createdDocId)).toBe(true);
  });

  it("unlinks document from action", async () => {
    currentTestUserId = userId;
    const res = await unlinkDoc(
      makeRequest(
        `http://localhost/api/actions/${createdActionId}/documents/${createdDocId}`,
        "DELETE"
      ),
      { params: { actionId: createdActionId, documentId: createdDocId } }
    );
    expect(res.status).toBe(200);
  });

  it("deletes document", async () => {
    currentTestUserId = userId;
    mockUnlink.mockClear();

    const res = await deleteDoc(
      makeRequest(`http://localhost/api/documents/${createdDocId}`, "DELETE"),
      { params: { id: createdDocId } }
    );
    expect(res.status).toBe(200);
    const dbDoc = await prisma.document.findFirst({ where: { id: createdDocId } });
    expect(dbDoc).toBeNull();

    // Fix #4: assert unlink was called
    expect(mockUnlink).toHaveBeenCalled();
  });

  it("returns 404 for unknown document", async () => {
    currentTestUserId = userId;
    const res = await getDoc(
      makeRequest(
        `http://localhost/api/documents/00000000-0000-0000-0000-000000000099`,
        "GET"
      ),
      { params: { id: "00000000-0000-0000-0000-000000000099" } }
    );
    expect(res.status).toBe(404);
  });
});
