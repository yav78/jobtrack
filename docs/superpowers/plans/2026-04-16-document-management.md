# Document Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a document library (CVs, lettres de motivation, etc.) with upload, preview, and many-to-many linking to job actions.

**Architecture:** Documents stored in `uploads/<userId>/<uuid>.<ext>` on the local filesystem, metadata in PostgreSQL via a new `Document` model. Files served through an authenticated API route. Documents linked to `OpportunityAction` records via an `ActionDocument` join table. UI: a dedicated `/documents` library page + a document picker embedded in the action edit form.

**Tech Stack:** Next.js 16 App Router, Prisma, Node.js `fs/promises`, Zod, TailwindCSS, `marked` (markdown rendering), Vitest.

---

### Task 1: Project setup

**Files:**
- Modify: `.gitignore`
- Create: `uploads/.gitkeep`

- [ ] **Step 1: Add `uploads/` to .gitignore and create directory**

```bash
printf '\n# local file uploads\nuploads/*\n!uploads/.gitkeep\n' >> .gitignore
mkdir -p uploads
touch uploads/.gitkeep
```

- [ ] **Step 2: Install `marked` for markdown rendering**

```bash
npm install marked
```

Expected: `marked` appears in `package.json` dependencies.

- [ ] **Step 3: Commit**

```bash
git add .gitignore uploads/.gitkeep package.json package-lock.json
git commit -m "chore: setup uploads directory and install marked"
```

---

### Task 2: DB schema — Document + ActionDocument models

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add relations to existing models**

In `prisma/schema.prisma`, add `documents Document[]` to the `User` model (after the `actions` field):

```prisma
  documents     Document[]
```

Add `documents ActionDocument[]` to the `OpportunityAction` model (after the `participants` field):

```prisma
  documents     ActionDocument[]
```

- [ ] **Step 2: Add new models at the end of the file**

Append after the `OpportunityActionContact` model:

```prisma
model Document {
  id           String           @id @default(uuid()) @db.Uuid
  title        String
  description  String?
  filename     String
  originalName String
  mimeType     String
  size         Int
  userId       String           @db.Uuid
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt
  user         User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  actions      ActionDocument[]

  @@index([userId])
}

model ActionDocument {
  actionId   String            @db.Uuid
  documentId String            @db.Uuid
  action     OpportunityAction @relation(fields: [actionId], references: [id], onDelete: Cascade)
  document   Document          @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@id([actionId, documentId])
  @@index([documentId])
}
```

- [ ] **Step 3: Create and apply migration**

```bash
npx prisma migrate dev --name add_document_model
```

Expected: `✔ Your database is now in sync with your schema.` and Prisma client regenerated.

- [ ] **Step 4: Commit**

```bash
git add prisma/
git commit -m "feat: add Document and ActionDocument schema"
```

---

### Task 3: Document validator + DTO + unit tests

**Files:**
- Create: `src/lib/validators/document.ts`
- Create: `src/lib/dto/document.ts`
- Create: `src/tests/unit/validators/document.test.ts`

- [ ] **Step 1: Write the failing unit tests**

Create `src/tests/unit/validators/document.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { documentCreateSchema, documentUpdateSchema } from "@/lib/validators/document";

describe("documentCreateSchema", () => {
  it("accepts valid title only", () => {
    const result = documentCreateSchema.parse({ title: "Mon CV" });
    expect(result.title).toBe("Mon CV");
    expect(result.description).toBeUndefined();
  });

  it("accepts title + description", () => {
    const result = documentCreateSchema.parse({
      title: "CV Senior",
      description: "Version 2024",
    });
    expect(result.description).toBe("Version 2024");
  });

  it("rejects empty title", () => {
    expect(() => documentCreateSchema.parse({ title: "" })).toThrow();
  });

  it("rejects title over 255 chars", () => {
    expect(() => documentCreateSchema.parse({ title: "a".repeat(256) })).toThrow();
  });

  it("rejects description over 1000 chars", () => {
    expect(() =>
      documentCreateSchema.parse({ title: "CV", description: "x".repeat(1001) })
    ).toThrow();
  });
});

describe("documentUpdateSchema", () => {
  it("accepts title-only update", () => {
    const result = documentUpdateSchema.parse({ title: "Nouveau titre" });
    expect(result.title).toBe("Nouveau titre");
  });

  it("accepts description-only update", () => {
    const result = documentUpdateSchema.parse({ description: "updated" });
    expect(result.description).toBe("updated");
  });

  it("rejects empty object", () => {
    expect(() => documentUpdateSchema.parse({})).toThrow();
  });

  it("rejects empty title string", () => {
    expect(() => documentUpdateSchema.parse({ title: "" })).toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/tests/unit/validators/document.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/validators/document'`

- [ ] **Step 3: Create the Zod validator**

Create `src/lib/validators/document.ts`:

```ts
import { z } from "zod";

export const documentCreateSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
});

export const documentUpdateSchema = z
  .object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional(),
  })
  .refine((data) => data.title !== undefined || data.description !== undefined, {
    message: "Au moins un champ est requis",
  });

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "text/plain",
  "text/markdown",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
```

- [ ] **Step 4: Create the DTO type**

Create `src/lib/dto/document.ts`:

```ts
export type DocumentDTO = {
  id: string;
  title: string;
  description: string | null;
  originalName: string;
  mimeType: string;
  size: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
};
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/tests/unit/validators/document.test.ts
```

Expected: All PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/validators/document.ts src/lib/dto/document.ts src/tests/unit/validators/document.test.ts
git commit -m "feat: add document validator, DTO, and unit tests"
```

---

### Task 4: Document back service

**Files:**
- Create: `src/lib/services/back/documents.ts`

- [ ] **Step 1: Create the service**

Create `src/lib/services/back/documents.ts`:

```ts
import path from "path";
import { promises as fs } from "fs";
import { prisma } from "@/lib/prisma";
import { NotFound } from "@/lib/errors";
import type { Document } from "@prisma/client";

export function getUploadsBase(): string {
  return process.env.UPLOADS_DIR ?? path.join(process.cwd(), "uploads");
}

export function getFilePath(userId: string, filename: string): string {
  return path.join(getUploadsBase(), userId, filename);
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
  data: { title?: string; description?: string }
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/services/back/documents.ts
git commit -m "feat: add document back service"
```

---

### Task 5: Documents API routes — list, upload, metadata, update, delete

**Files:**
- Create: `src/app/api/documents/route.ts`
- Create: `src/app/api/documents/[id]/route.ts`

- [ ] **Step 1: Create list + upload route**

Create `src/app/api/documents/route.ts`:

```ts
import path from "path";
import crypto from "crypto";
import { promises as fs } from "fs";
import { jsonCreated, jsonOk } from "@/lib/errors/response";
import { handleRouteError, requireUserId } from "@/lib/api-helpers";
import { BadRequest } from "@/lib/errors";
import {
  documentCreateSchema,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
} from "@/lib/validators/document";
import {
  listDocuments,
  createDocument,
  documentToDto,
  getUploadsBase,
  ensureUserUploadsDir,
} from "@/lib/services/back/documents";

export async function GET() {
  try {
    const userId = await requireUserId();
    const documents = await listDocuments(userId);
    return jsonOk({ items: documents.map(documentToDto) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;

    if (!file || !(file instanceof File)) throw BadRequest("Fichier requis");
    if (file.size > MAX_FILE_SIZE) throw BadRequest("Le fichier dépasse 10 Mo");
    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
      throw BadRequest("Type de fichier non supporté");
    }

    const parsed = documentCreateSchema.parse({
      title: title ?? "",
      description: description || undefined,
    });

    const ext = path.extname(file.name);
    const filename = `${crypto.randomUUID()}${ext}`;

    await ensureUserUploadsDir(userId);
    const filePath = path.join(getUploadsBase(), userId, filename);
    const bytes = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(bytes));

    let document;
    try {
      document = await createDocument(userId, {
        ...parsed,
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
      });
    } catch (err) {
      await fs.unlink(filePath).catch(() => {});
      throw err;
    }

    return jsonCreated({ data: documentToDto(document) });
  } catch (error) {
    return handleRouteError(error);
  }
}
```

- [ ] **Step 2: Create metadata / update / delete route**

Create `src/app/api/documents/[id]/route.ts`:

```ts
import path from "path";
import { promises as fs } from "fs";
import { jsonOk } from "@/lib/errors/response";
import { handleRouteError, requireJson, requireUserId } from "@/lib/api-helpers";
import { documentUpdateSchema } from "@/lib/validators/document";
import {
  getDocumentById,
  updateDocument,
  deleteDocument,
  documentToDto,
  getUploadsBase,
} from "@/lib/services/back/documents";
import { NotFound } from "@/lib/errors";

type Params = { params: Promise<{ id: string }> | { id: string } };

async function resolveId(params: Params["params"]): Promise<string> {
  const resolved = params instanceof Promise ? await params : params;
  return resolved.id;
}

export async function GET(_: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const id = await resolveId(params);
    const doc = await getDocumentById(id, userId);
    if (!doc) throw NotFound("Document introuvable");
    return jsonOk({ data: documentToDto(doc) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    requireJson(req);
    const userId = await requireUserId();
    const id = await resolveId(params);
    const body = await req.json();
    const parsed = documentUpdateSchema.parse(body);
    const updated = await updateDocument(id, userId, parsed);
    return jsonOk({ data: documentToDto(updated) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const id = await resolveId(params);
    const { filename, userId: docUserId } = await deleteDocument(id, userId);
    const filePath = path.join(getUploadsBase(), docUserId, filename);
    await fs.unlink(filePath).catch((err) => {
      console.error(`Failed to delete file ${filePath}:`, err);
    });
    return jsonOk({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/documents/
git commit -m "feat: add document list, upload, metadata, update, delete routes"
```

---

### Task 6: Document file serve route

**Files:**
- Create: `src/app/api/documents/[id]/file/route.ts`

- [ ] **Step 1: Create file serve route**

Create `src/app/api/documents/[id]/file/route.ts`:

```ts
import path from "path";
import { promises as fs } from "fs";
import { handleRouteError, requireUserId } from "@/lib/api-helpers";
import { NotFound } from "@/lib/errors";
import { getDocumentById, getUploadsBase } from "@/lib/services/back/documents";

type Params = { params: Promise<{ id: string }> | { id: string } };

export async function GET(req: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const resolved = params instanceof Promise ? await params : params;
    const id = resolved.id;

    const doc = await getDocumentById(id, userId);
    if (!doc) throw NotFound("Document introuvable");

    const filePath = path.join(getUploadsBase(), userId, doc.filename);
    let buffer: Buffer;
    try {
      buffer = await fs.readFile(filePath);
    } catch {
      throw NotFound("Fichier introuvable sur le serveur");
    }

    const { searchParams } = new URL(req.url);
    const download = searchParams.get("download") !== "false";

    const disposition = download
      ? `attachment; filename*=UTF-8''${encodeURIComponent(doc.originalName)}`
      : `inline; filename*=UTF-8''${encodeURIComponent(doc.originalName)}`;

    return new Response(buffer, {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Length": buffer.length.toString(),
        "Content-Disposition": disposition,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/documents/[id]/file/
git commit -m "feat: add document file serve route"
```

---

### Task 7: Action-document linking API routes

**Files:**
- Create: `src/app/api/actions/[actionId]/documents/route.ts`
- Create: `src/app/api/actions/[actionId]/documents/[documentId]/route.ts`

- [ ] **Step 1: Create list + link route**

Create `src/app/api/actions/[actionId]/documents/route.ts`:

```ts
import { jsonCreated, jsonOk } from "@/lib/errors/response";
import { handleRouteError, requireUserId } from "@/lib/api-helpers";
import { BadRequest } from "@/lib/errors";
import {
  linkDocumentToAction,
  listDocumentsForAction,
  documentToDto,
} from "@/lib/services/back/documents";

type Params = { params: Promise<{ actionId: string }> | { actionId: string } };

async function resolveActionId(params: Params["params"]): Promise<string> {
  const resolved = params instanceof Promise ? await params : params;
  return resolved.actionId;
}

export async function GET(_: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const actionId = await resolveActionId(params);
    const documents = await listDocumentsForAction(actionId, userId);
    return jsonOk({ items: documents.map(documentToDto) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const actionId = await resolveActionId(params);
    let body: { documentId?: string };
    try {
      body = await req.json();
    } catch {
      throw BadRequest("Body JSON invalide");
    }
    if (!body.documentId) throw BadRequest("documentId requis");
    await linkDocumentToAction(actionId, body.documentId, userId);
    return jsonCreated({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
```

- [ ] **Step 2: Create unlink route**

Create `src/app/api/actions/[actionId]/documents/[documentId]/route.ts`:

```ts
import { jsonOk } from "@/lib/errors/response";
import { handleRouteError, requireUserId } from "@/lib/api-helpers";
import { unlinkDocumentFromAction } from "@/lib/services/back/documents";

type Params = {
  params:
    | Promise<{ actionId: string; documentId: string }>
    | { actionId: string; documentId: string };
};

export async function DELETE(_: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const resolved = params instanceof Promise ? await params : params;
    const { actionId, documentId } = resolved;
    await unlinkDocumentFromAction(actionId, documentId, userId);
    return jsonOk({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/actions/[actionId]/documents/
git commit -m "feat: add action-document link/unlink API routes"
```

---

### Task 8: Integration tests

**Files:**
- Create: `src/tests/integration/api/documents.test.ts`

- [ ] **Step 1: Write the integration tests**

Create `src/tests/integration/api/documents.test.ts`:

```ts
import { describe, expect, it, beforeAll, afterAll, vi } from "vitest";
import os from "os";
import path from "path";

// Point uploads to a temp dir and mock fs so no real files are written
process.env.UPLOADS_DIR = path.join(os.tmpdir(), "jobtrack-test-uploads");

vi.mock("fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs/promises")>();
  return {
    ...actual,
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    unlink: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue(Buffer.from("fake file content")),
  };
});

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
    const action = await prisma.opportunityAction.create({
      data: { userId, type: "NOTE", occurredAt: new Date() },
    });
    createdActionId = action.id;
  });

  afterAll(async () => {
    await prisma.actionDocument.deleteMany();
    await prisma.document.deleteMany();
    await prisma.opportunityAction.deleteMany();
    await prisma.$disconnect();
  });

  it("uploads a document", async () => {
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
    createdDocId = data.data.id;
  });

  it("lists documents", async () => {
    const res = await getDocs(makeRequest("http://localhost/api/documents", "GET"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.items.some((d: { id: string }) => d.id === createdDocId)).toBe(true);
  });

  it("gets document metadata", async () => {
    const res = await getDoc(
      makeRequest(`http://localhost/api/documents/${createdDocId}`, "GET"),
      { params: { id: createdDocId } }
    );
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.data.title).toBe("Mon CV");
  });

  it("serves document file inline", async () => {
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
    const res = await getDocFile(
      makeRequest(`http://localhost/api/documents/${createdDocId}/file`, "GET"),
      { params: { id: createdDocId } }
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Disposition")).toContain("attachment");
  });

  it("updates document title", async () => {
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

  it("rejects unsupported file type", async () => {
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
    const res = await deleteDoc(
      makeRequest(`http://localhost/api/documents/${createdDocId}`, "DELETE"),
      { params: { id: createdDocId } }
    );
    expect(res.status).toBe(200);
    const dbDoc = await prisma.document.findFirst({ where: { id: createdDocId } });
    expect(dbDoc).toBeNull();
  });

  it("returns 404 for unknown document", async () => {
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
```

- [ ] **Step 2: Run the tests**

```bash
npx vitest run src/tests/integration/api/documents.test.ts
```

Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/tests/integration/api/documents.test.ts
git commit -m "test: add document API integration tests"
```

---

### Task 9: Document front service

**Files:**
- Create: `src/lib/services/front/document.service.ts`

- [ ] **Step 1: Create the service**

Create `src/lib/services/front/document.service.ts`:

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/services/front/document.service.ts
git commit -m "feat: add document front service"
```

---

### Task 10: DocumentPreviewModal component

**Files:**
- Create: `src/components/documents/DocumentPreviewModal.tsx`

- [ ] **Step 1: Create preview modal**

Create `src/components/documents/DocumentPreviewModal.tsx`:

```tsx
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
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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
            const html = await marked.parse(text);
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/documents/DocumentPreviewModal.tsx
git commit -m "feat: add DocumentPreviewModal component"
```

---

### Task 11: DocumentUploadForm component

**Files:**
- Create: `src/components/documents/DocumentUploadForm.tsx`

- [ ] **Step 1: Create upload form**

Create `src/components/documents/DocumentUploadForm.tsx`:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/documents/DocumentUploadForm.tsx
git commit -m "feat: add DocumentUploadForm component"
```

---

### Task 12: DocumentLibrary + Documents page + Sidebar

**Files:**
- Create: `src/components/documents/DocumentLibrary.tsx`
- Create: `src/app/(app)/documents/page.tsx`
- Modify: `src/components/layout/sidebar.tsx`

- [ ] **Step 1: Create DocumentLibrary component**

Create `src/components/documents/DocumentLibrary.tsx`:

```tsx
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
```

- [ ] **Step 2: Create Documents page**

Create `src/app/(app)/documents/page.tsx`:

```tsx
import { DocumentLibrary } from "@/components/documents/DocumentLibrary";

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Documents</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Gérez vos CVs, lettres de motivation et autres documents.
        </p>
      </div>
      <div className="card">
        <DocumentLibrary />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add Documents to sidebar**

In `src/components/layout/sidebar.tsx`, replace the `navItems` array with:

```ts
const navItems = [
  { href: "/", label: "Tableau de bord" },
  { href: "/companies", label: "Entreprises" },
  { href: "/contacts", label: "Contacts" },
  { href: "/opportunities", label: "Opportunités" },
  { href: "/actions", label: "Actions" },
  { href: "/documents", label: "Documents" },
  { href: "/entretiens/new", label: "Nouvel entretien" },
  { href: "/trash", label: "Corbeille" },
];
```

- [ ] **Step 4: Commit**

```bash
git add src/components/documents/DocumentLibrary.tsx src/app/(app)/documents/page.tsx src/components/layout/sidebar.tsx
git commit -m "feat: add DocumentLibrary, Documents page, and sidebar nav entry"
```

---

### Task 13: ActionDocumentPicker component

**Files:**
- Create: `src/components/documents/ActionDocumentPicker.tsx`

- [ ] **Step 1: Create the picker**

Create `src/components/documents/ActionDocumentPicker.tsx`:

```tsx
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

  async function handleLink(docId: string) {
    setLinking(docId);
    try {
      await documentService.linkToAction(actionId, docId);
      const doc = library.find((d) => d.id === docId);
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
    handleLink(doc.id);
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/documents/ActionDocumentPicker.tsx
git commit -m "feat: add ActionDocumentPicker component"
```

---

### Task 14: Integrate ActionDocumentPicker into StandaloneActionForm

**Files:**
- Modify: `src/components/actions/StandaloneActionForm.tsx`

- [ ] **Step 1: Add import**

In `src/components/actions/StandaloneActionForm.tsx`, add the import after the last existing import:

```tsx
import { ActionDocumentPicker } from "@/components/documents/ActionDocumentPicker";
```

- [ ] **Step 2: Add Documents section in the form**

In the same file, locate the `<div className="flex justify-end gap-2">` buttons div (line ~322) and insert this block immediately before it:

```tsx
        {editActionId && (
          <div className="border-t border-neutral-200 pt-4 dark:border-neutral-700">
            <h3 className="mb-2 text-sm font-medium">Documents liés</h3>
            <ActionDocumentPicker actionId={editActionId} />
          </div>
        )}
```

- [ ] **Step 3: Verify dev server runs cleanly**

```bash
npm run dev
```

Navigate to `/documents` — verify the library loads. Open an existing action in edit mode — verify the "Documents liés" section appears with picker and upload options.

- [ ] **Step 4: Run all tests**

```bash
npm run test
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/actions/StandaloneActionForm.tsx
git commit -m "feat: integrate ActionDocumentPicker into action edit form"
```

---

*End of plan. 14 tasks, ~14 commits.*
