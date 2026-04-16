# Document Management — Design Spec

**Date:** 2026-04-16  
**Status:** Approved

## Overview

A document library feature for Jobtrack allowing users to upload, manage, preview, and link documents (CVs, cover letters, etc.) to job actions. Documents are stored locally with UUID-based filenames, original names preserved for download, and linked to actions via a many-to-many join table.

---

## 1. Data Model

Two new Prisma models added to `schema.prisma`:

```prisma
model Document {
  id           String           @id @default(uuid()) @db.Uuid
  title        String           // required, max 255 chars
  description  String?          // optional, max 1000 chars
  filename     String           // UUID-based name on disk (e.g. "a1b2c3-uuid.pdf")
  originalName String           // original filename for download header
  mimeType     String
  size         Int              // in bytes
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

**File storage:** `uploads/<userId>/<uuid>.<ext>` at the project root (outside `public/`).  
**Download:** Served with `Content-Disposition: attachment; filename="<originalName>"` so the user always gets the original filename.

---

## 2. API Routes

All routes call `requireUserId()` and scope all queries to the authenticated user.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/documents` | Upload new document (multipart/form-data: file, title, description?) |
| `GET` | `/api/documents` | List user's documents |
| `GET` | `/api/documents/[id]` | Get document metadata |
| `PATCH` | `/api/documents/[id]` | Update title and/or description |
| `DELETE` | `/api/documents/[id]` | Delete document record + file on disk |
| `GET` | `/api/documents/[id]/file` | Stream file (`?download=true` → attachment, `?download=false` → inline for preview) |
| `POST` | `/api/actions/[id]/documents/[docId]` | Link a document to an action |
| `DELETE` | `/api/actions/[id]/documents/[docId]` | Unlink a document from an action |

---

## 3. User Interface

### Page `/documents` (new nav entry)

- List of all user documents: title, description, original filename, size, upload date
- "Nouveau document" button → upload form (title, description, file picker)
- Per-document actions: Preview, Download, Edit (title/description), Delete
- **Preview modal:**
  - PDF → `<iframe>` with `/api/documents/[id]/file?download=false`
  - Images (jpg, png, gif, webp) → `<img>`
  - Plain text (.txt) → rendered as `<pre>`
  - Markdown (.md) → rendered as HTML
  - Word (.doc, .docx) → "Aperçu non disponible" + Download button
  - Others → "Aperçu non disponible" + Download button

### Action form — Documents section

- List of documents already linked to the action
- "Lier un document" button → slide-over panel:
  - Search/filter library by title
  - Select from list to link
  - "Uploader un nouveau" inline sub-form (title, description, file)
- Preview button on each linked document (same modal as Documents page)
- "Délier" button per linked document
- Navigation: "Documents" entry added to the existing sidebar

---

## 4. Validation & Error Handling

### Zod schemas (`src/lib/validators/document.ts`)

- **Upload:** `title` required (max 255), `description` optional (max 1000), file required, max size **10 MB**, allowed MIME types: `application/pdf`, `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `text/plain`, `text/markdown`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- **Patch:** `title` optional (max 255), `description` optional (max 1000), at least one field required

### Error responses

| Situation | Status | Message |
|-----------|--------|---------|
| File too large | 400 | `"Le fichier dépasse 10 Mo"` |
| Unsupported file type | 400 | `"Type de fichier non supporté"` |
| Document not found / wrong user | 404 | `"Document introuvable"` |
| Link already exists | 409 | (silently ignored client-side) |
| Disk write failure | 500 | `"Erreur lors de l'enregistrement du fichier"` |

### Write ordering (no orphans)

- **Upload:** validate → write file to disk → create DB record. If DB write fails, delete the file.
- **Delete:** delete DB record → delete file from disk. If disk delete fails, log the error but keep the DB deletion (orphan file preferred over orphan DB record).

---

## 5. Testing

### Unit tests (`src/tests/unit/validators/`)

- `document.test.ts`: Zod schema validation — title required, description optional, size limit, MIME type whitelist

### Integration tests (`src/tests/integration/api/`)

- `documents.test.ts`:
  - Upload: DB record created, file written to disk (mocked `fs`)
  - GET list: scoped to user, returns correct fields
  - GET file: auth check, correct `Content-Disposition` for download vs inline
  - PATCH: updates title/description, rejects empty body
  - DELETE: removes DB record, triggers file deletion
  - Link/unlink document to action
  - 404 on cross-user access attempt

---

## Out of Scope

- Word-to-PDF server-side conversion (rejected: no LibreOffice dependency)
- Cloud storage (S3, R2, etc.) — local filesystem only for now
- Versioning / document history
- Sharing documents with other users
