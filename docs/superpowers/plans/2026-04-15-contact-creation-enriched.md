# Contact Creation Enriched — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow creating contacts without a company, add communication channels inline at creation, support quick company creation via sub-modal, and enable linking/editing a contact's company after creation.

**Architecture:** Add `userId` to `Contact` (with DB backfill migration), make `companyId` nullable, update all queries to scope by `userId` directly. Extend the create API to accept inline channels. Add three new/updated UI components: `CompanyQuickCreateModal`, updated `ContactForm`/`ContactEditForm`, and `LinkContactForm`.

**Tech Stack:** Prisma (PostgreSQL), Next.js App Router, Zod, TailwindCSS, Vitest

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `prisma/schema.prisma` | Add `userId` to Contact, make `companyId` nullable |
| Create | `prisma/migrations/<timestamp>_contact_user_id_optional_company/migration.sql` | DB migration with backfill |
| Modify | `src/lib/validators/contact.ts` | `companyId` optional, add `channels` to create, explicit update schema |
| Modify | `src/lib/dto/contact.ts` | `companyId: string \| null`, add `userId` |
| Modify | `src/lib/services/back/contacts.ts` | Scope by `userId`, handle channels in create, `unlinked` filter |
| Modify | `src/app/api/contacts/route.ts` | Support `?unlinked=true` query param |
| Create | `src/components/companies/CompanyQuickCreateModal.tsx` | Lightweight modal: name + type → create company |
| Modify | `src/components/contacts/ContactForm.tsx` | Optional company, inline channels, sub-modal trigger |
| Modify | `src/components/companies/ContactEditForm.tsx` | Add company selector + sub-modal |
| Create | `src/components/contacts/ContactEditButton.tsx` | Client wrapper for edit modal on detail page |
| Modify | `src/components/contacts/ContactActionsSection.tsx` | Make `companyId` prop optional |
| Modify | `src/app/(app)/contacts/[id]/page.tsx` | Show company name + edit button |
| Create | `src/components/companies/LinkContactForm.tsx` | Select unlinked contact → PATCH companyId |
| Modify | `src/app/(app)/companies/[id]/page.tsx` | Add LinkContactForm section to contacts tab |
| Modify | `src/lib/services/front/contact.service.ts` | Add `listUnlinked()` |
| Modify | `src/tests/unit/validators/contact.test.ts` | Tests for new schema |
| Modify | `src/tests/integration/api/contacts.test.ts` | Tests for new API behavior |

---

## Task 1: Prisma schema — add `userId` to Contact, make `companyId` optional

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>/migration.sql` (via `prisma migrate dev`)

- [ ] **Step 1: Update `prisma/schema.prisma`**

Replace the `Contact` model and update the `User` model:

```prisma
model User {
  id            String              @id @default(uuid()) @db.Uuid
  fullName      String
  email         String              @unique
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt
  password      String
  companies     Company[]
  contacts      Contact[]           // NEW
  entretiens    Entretien[]
  actions       OpportunityAction[]
  opportunities WorkOpportunity[]
}

model Contact {
  id                String                     @id @default(uuid()) @db.Uuid
  userId            String                     @db.Uuid
  companyId         String?                    @db.Uuid
  firstName         String
  lastName          String
  roleTitle         String?
  notes             String?
  basedAtLocationId String?                    @db.Uuid
  deletedAt         DateTime?
  createdAt         DateTime                   @default(now())
  updatedAt         DateTime                   @updatedAt
  basedAt           Location?                  @relation("ContactLocation", fields: [basedAtLocationId], references: [id])
  user              User                       @relation(fields: [userId], references: [id], onDelete: Cascade)
  company           Company?                   @relation(fields: [companyId], references: [id], onDelete: SetNull)
  channels          ContactChannel[]
  entretienLinks    EntretienContact[]
  actionLinks       OpportunityActionContact[]
  actionsAsMainContact OpportunityAction[]

  @@index([userId])
  @@index([companyId])
}
```

- [ ] **Step 2: Generate the migration (create-only, do NOT apply yet)**

```bash
npx prisma migrate dev --name contact_user_id_optional_company --create-only
```

Prisma creates a file at `prisma/migrations/<timestamp>_contact_user_id_optional_company/migration.sql`.

- [ ] **Step 3: Edit the generated migration SQL**

Open the generated file. Replace its contents entirely with:

```sql
-- Add userId as nullable first (required to backfill existing rows)
ALTER TABLE "Contact" ADD COLUMN "userId" UUID;

-- Backfill userId from related Company
UPDATE "Contact" SET "userId" = c."userId"
FROM "Company" c
WHERE "Contact"."companyId" = c.id;

-- Now enforce NOT NULL
ALTER TABLE "Contact" ALTER COLUMN "userId" SET NOT NULL;

-- Make companyId nullable
ALTER TABLE "Contact" ALTER COLUMN "companyId" DROP NOT NULL;

-- Drop old FK on companyId (was ON DELETE CASCADE)
ALTER TABLE "Contact" DROP CONSTRAINT "Contact_companyId_fkey";

-- Re-add FK on companyId with ON DELETE SET NULL
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Add FK on userId → User
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Add index on userId
CREATE INDEX "Contact_userId_idx" ON "Contact"("userId");
```

- [ ] **Step 4: Apply the migration**

```bash
npx prisma migrate dev
```

Expected: `1 migration applied` with no errors.

- [ ] **Step 5: Verify the schema**

```bash
npx prisma db pull --force
```

Check that `prisma/schema.prisma` still matches what you wrote in Step 1 (Prisma may reformat but semantics must match). Then revert if needed:

```bash
git checkout prisma/schema.prisma
```

- [ ] **Step 6: Regenerate the Prisma client**

```bash
npx prisma generate
```

Expected: `Generated Prisma Client`.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add userId to Contact, make companyId optional (migration with backfill)"
```

---

## Task 2: Update Zod validators

**Files:**
- Modify: `src/lib/validators/contact.ts`
- Modify: `src/tests/unit/validators/contact.test.ts`

- [ ] **Step 1: Write failing tests**

Replace `src/tests/unit/validators/contact.test.ts` with:

```typescript
import { describe, expect, it } from "vitest";
import { contactCreateSchema, contactUpdateSchema, contactChannelCreateSchema } from "@/lib/validators/contact";

describe("contactCreateSchema", () => {
  it("accepts contact with companyId", () => {
    const result = contactCreateSchema.parse({
      companyId: "00000000-0000-0000-0000-000000000001",
      firstName: "Alice",
      lastName: "Martin",
    });
    expect(result.firstName).toBe("Alice");
    expect(result.companyId).toBe("00000000-0000-0000-0000-000000000001");
  });

  it("accepts contact without companyId", () => {
    const result = contactCreateSchema.parse({
      firstName: "Alice",
      lastName: "Martin",
    });
    expect(result.firstName).toBe("Alice");
    expect(result.companyId).toBeUndefined();
  });

  it("defaults channels to empty array", () => {
    const result = contactCreateSchema.parse({ firstName: "Alice", lastName: "Martin" });
    expect(result.channels).toEqual([]);
  });

  it("accepts channels", () => {
    const result = contactCreateSchema.parse({
      firstName: "Alice",
      lastName: "Martin",
      channels: [
        { channelTypeCode: "EMAIL", value: "alice@example.com" },
        { channelTypeCode: "LINKEDIN", value: "https://linkedin.com/in/alice" },
      ],
    });
    expect(result.channels).toHaveLength(2);
    expect(result.channels[0].channelTypeCode).toBe("EMAIL");
  });

  it("rejects missing firstName", () => {
    expect(() =>
      contactCreateSchema.parse({ lastName: "Martin" })
    ).toThrow();
  });
});

describe("contactUpdateSchema", () => {
  it("accepts partial update", () => {
    const result = contactUpdateSchema.parse({ firstName: "Bob" });
    expect(result.firstName).toBe("Bob");
  });

  it("accepts companyId: null to delink", () => {
    const result = contactUpdateSchema.parse({ companyId: null });
    expect(result.companyId).toBeNull();
  });

  it("accepts valid companyId uuid", () => {
    const result = contactUpdateSchema.parse({
      companyId: "00000000-0000-0000-0000-000000000002",
    });
    expect(result.companyId).toBe("00000000-0000-0000-0000-000000000002");
  });

  it("does not accept channels (channels are managed separately)", () => {
    // channels key should be stripped/ignored by the schema
    const result = contactUpdateSchema.parse({
      firstName: "Alice",
      channels: [{ channelTypeCode: "EMAIL", value: "x@y.com" }],
    });
    expect((result as Record<string, unknown>).channels).toBeUndefined();
  });
});

describe("contactChannelCreateSchema", () => {
  it("valid channel", () => {
    const result = contactChannelCreateSchema.parse({
      channelTypeCode: "EMAIL",
      value: "a@example.com",
      isPrimary: true,
    });
    expect(result.isPrimary).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests — expect failures**

```bash
npx vitest run src/tests/unit/validators/contact.test.ts
```

Expected: several tests fail (contactUpdateSchema doesn't exist yet with the right shape, channels not in create schema).

- [ ] **Step 3: Update `src/lib/validators/contact.ts`**

```typescript
import { z } from "zod";

export const contactCreateSchema = z.object({
  companyId: z.string().uuid().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  roleTitle: z.string().optional(),
  notes: z.string().optional(),
  basedAtLocationId: z.string().uuid().nullable().optional(),
  channels: z
    .array(
      z.object({
        channelTypeCode: z.string().min(1),
        value: z.string().min(1),
      })
    )
    .optional()
    .default([]),
});

export const contactUpdateSchema = z.object({
  companyId: z.string().uuid().nullable().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  roleTitle: z.string().optional(),
  notes: z.string().optional(),
  basedAtLocationId: z.string().uuid().nullable().optional(),
});

export const contactChannelCreateSchema = z.object({
  channelTypeCode: z.string().min(1),
  value: z.string().min(1),
  label: z.string().optional(),
  isPrimary: z.boolean().optional().default(false),
});

export const contactChannelUpdateSchema = contactChannelCreateSchema.partial();
```

- [ ] **Step 4: Run tests — expect all to pass**

```bash
npx vitest run src/tests/unit/validators/contact.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/validators/contact.ts src/tests/unit/validators/contact.test.ts
git commit -m "feat: make companyId optional, add channels to contactCreateSchema, explicit contactUpdateSchema"
```

---

## Task 3: Update DTO

**Files:**
- Modify: `src/lib/dto/contact.ts`

- [ ] **Step 1: Update `src/lib/dto/contact.ts`**

```typescript
import { CompanyDTO } from "./company";

export type ContactChannelDTO = {
  id: string;
  contactId: string;
  channelTypeCode: string;
  value: string;
  label?: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ContactDTO = {
  id: string;
  userId: string;
  companyId: string | null;
  firstName: string;
  lastName: string;
  roleTitle?: string | null;
  notes?: string | null;
  basedAtLocationId?: string | null;
  createdAt: string;
  updatedAt: string;
  channels?: ContactChannelDTO[];
  company?: CompanyDTO | null;
};
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/dto/contact.ts
git commit -m "feat: update ContactDTO — userId, nullable companyId, nullable company"
```

---

## Task 4: Update back service

**Files:**
- Modify: `src/lib/services/back/contacts.ts`
- Modify: `src/tests/integration/api/contacts.test.ts`

- [ ] **Step 1: Write new/updated integration tests**

Replace `src/tests/integration/api/contacts.test.ts` with:

```typescript
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { POST as postContact, GET as getContacts } from "@/app/api/contacts/route";
import { PATCH as patchContact } from "@/app/api/contacts/[id]/route";
import { POST as postChannel } from "@/app/api/contacts/[id]/channels/route";
import { PATCH as patchChannel } from "@/app/api/channels/[id]/route";
import { NextRequest } from "next/server";

const userId = "00000000-0000-0000-0000-000000000001";

function makeRequest(url: string, method: string, body?: unknown) {
  return new NextRequest(url, {
    method,
    headers: {
      "content-type": "application/json",
      "x-user-id": userId,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("API contacts/channels", () => {
  let companyId: string;

  beforeAll(async () => {
    await prisma.entretienContact.deleteMany();
    await prisma.entretien.deleteMany();
    await prisma.workOpportunity.deleteMany();
    await prisma.contactChannel.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.location.deleteMany();
    await prisma.company.deleteMany();
    await prisma.companyType.createMany({
      data: [
        { code: "CLIENT_FINAL", label: "Client final" },
        { code: "ESN", label: "ESN" },
      ],
      skipDuplicates: true,
    });
    await prisma.user.upsert({
      where: { id: userId },
      update: { fullName: "Demo", email: "demo@example.com" },
      create: { id: userId, fullName: "Demo", email: "demo@example.com", password: "x" },
    });
    const company = await prisma.company.create({
      data: { name: "ContactCo", typeCode: "CLIENT_FINAL", userId },
    });
    companyId = company.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates contact with company then lists", async () => {
    const res = await postContact(
      makeRequest("http://localhost/api/contacts", "POST", {
        companyId,
        firstName: "Alice",
        lastName: "Martin",
      })
    );
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.firstName).toBe("Alice");
    expect(data.companyId).toBe(companyId);

    const listRes = await getContacts(makeRequest("http://localhost/api/contacts", "GET"));
    const list = await listRes.json();
    expect(list.items.length).toBeGreaterThan(0);
  });

  it("creates contact without company", async () => {
    const res = await postContact(
      makeRequest("http://localhost/api/contacts", "POST", {
        firstName: "Bob",
        lastName: "Dupont",
      })
    );
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.firstName).toBe("Bob");
    expect(data.companyId).toBeNull();
  });

  it("creates contact with inline channels", async () => {
    const res = await postContact(
      makeRequest("http://localhost/api/contacts", "POST", {
        firstName: "Clara",
        lastName: "Durand",
        channels: [
          { channelTypeCode: "EMAIL", value: "clara@example.com" },
          { channelTypeCode: "LINKEDIN", value: "https://linkedin.com/in/clara" },
        ],
      })
    );
    const data = await res.json();
    expect(res.status).toBe(201);
    const channels = await prisma.contactChannel.findMany({ where: { contactId: data.id } });
    expect(channels).toHaveLength(2);
    expect(channels.some((c) => c.channelTypeCode === "EMAIL")).toBe(true);
    expect(channels.some((c) => c.channelTypeCode === "LINKEDIN")).toBe(true);
  });

  it("GET ?unlinked=true returns only contacts without company", async () => {
    const res = await getContacts(
      makeRequest("http://localhost/api/contacts?unlinked=true", "GET")
    );
    const list = await res.json();
    expect(list.items.every((c: { companyId: string | null }) => c.companyId === null)).toBe(true);
    expect(list.items.length).toBeGreaterThanOrEqual(2); // Bob + Clara
  });

  it("PATCH links a contact to a company", async () => {
    const unlinked = await prisma.contact.findFirst({ where: { userId, companyId: null } });
    expect(unlinked).toBeTruthy();

    const res = await patchContact(
      makeRequest(`http://localhost/api/contacts/${unlinked!.id}`, "PATCH", { companyId }),
      { params: Promise.resolve({ id: unlinked!.id }) }
    );
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.companyId).toBe(companyId);
  });

  it("PATCH with companyId: null delinks a contact", async () => {
    const linked = await prisma.contact.findFirst({ where: { userId, companyId } });
    expect(linked).toBeTruthy();

    const res = await patchContact(
      makeRequest(`http://localhost/api/contacts/${linked!.id}`, "PATCH", { companyId: null }),
      { params: Promise.resolve({ id: linked!.id }) }
    );
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.companyId).toBeNull();
  });

  it("sets primary per channel type", async () => {
    const contact = await prisma.contact.findFirst({ where: { userId } });
    expect(contact).toBeTruthy();
    const cid = contact!.id;

    const resCh1 = await postChannel(
      makeRequest(`http://localhost/api/contacts/${cid}/channels`, "POST", {
        channelTypeCode: "EMAIL",
        value: "a@example.com",
        isPrimary: true,
      }),
      { params: { id: cid } as { id: string } }
    );
    expect(resCh1.status).toBe(201);
    const ch1 = await resCh1.json();

    await postChannel(
      makeRequest(`http://localhost/api/contacts/${cid}/channels`, "POST", {
        channelTypeCode: "EMAIL",
        value: "b@example.com",
        isPrimary: true,
      }),
      { params: { id: cid } as { id: string } }
    );

    const channels = await prisma.contactChannel.findMany({
      where: { contactId: cid, channelTypeCode: "EMAIL" },
    });
    expect(channels.filter((c) => c.isPrimary).length).toBe(1);

    await patchChannel(
      makeRequest(`http://localhost/api/channels/${ch1.id}`, "PATCH", { isPrimary: true }),
      { params: { id: ch1.id } as { id: string } }
    );
    const after = await prisma.contactChannel.findMany({
      where: { contactId: cid, channelTypeCode: "EMAIL" },
    });
    expect(after.filter((c) => c.isPrimary).length).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests — expect failures**

```bash
npx vitest run src/tests/integration/api/contacts.test.ts
```

Expected: new tests fail (service hasn't been updated yet).

- [ ] **Step 3: Update `src/lib/services/back/contacts.ts`**

```typescript
import { requireUserId } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { contactCreateSchema, contactUpdateSchema } from "@/lib/validators/contact";
import { NotFound } from "@/lib/errors";
import type { z } from "zod";

type ContactCreateInput = z.infer<typeof contactCreateSchema>;
type ContactUpdateInput = z.infer<typeof contactUpdateSchema>;

const ACTIVE = { deletedAt: null } as const;

export async function getContacts(
  userId: string,
  options?: { page?: number; pageSize?: number; q?: string; companyId?: string; unlinked?: boolean }
) {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 10;
  const where = {
    userId,
    ...ACTIVE,
    ...(options?.companyId ? { companyId: options.companyId } : {}),
    ...(options?.unlinked ? { companyId: null } : {}),
    ...(options?.q
      ? {
          OR: [
            { firstName: { contains: options.q, mode: "insensitive" as const } },
            { lastName: { contains: options.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      include: { company: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.contact.count({ where }),
  ]);
  return { items, page, pageSize, total };
}

export async function getAllContacts() {
  const userId = await requireUserId();
  return prisma.contact.findMany({ where: { ...ACTIVE, userId } });
}

export async function getAllContactsForExport(userId: string) {
  return prisma.contact.findMany({
    where: { ...ACTIVE, userId },
    include: { company: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createContact(userId: string, data: ContactCreateInput) {
  const { channels = [], ...contactData } = contactCreateSchema.parse(data);

  if (contactData.companyId) {
    const company = await prisma.company.findFirst({
      where: { id: contactData.companyId, userId, ...ACTIVE },
    });
    if (!company) throw NotFound("Company not found");
  }

  return prisma.$transaction(async (tx) => {
    const contact = await tx.contact.create({ data: { ...contactData, userId } });
    if (channels.length > 0) {
      await tx.contactChannel.createMany({
        data: channels.map((ch) => ({
          contactId: contact.id,
          channelTypeCode: ch.channelTypeCode,
          value: ch.value,
          isPrimary: false,
        })),
      });
    }
    return contact;
  });
}

export async function getContact(id: string, userId: string) {
  const contact = await prisma.contact.findFirst({
    where: { id, ...ACTIVE, userId },
    include: {
      channels: true,
      company: { select: { id: true, name: true } },
    },
  });
  if (!contact) throw NotFound("Contact not found");
  return contact;
}

export async function updateContact(id: string, userId: string, data: ContactUpdateInput) {
  const validatedData = contactUpdateSchema.parse(data);

  if (validatedData.companyId) {
    const company = await prisma.company.findFirst({
      where: { id: validatedData.companyId, userId, ...ACTIVE },
    });
    if (!company) throw NotFound("Company not found");
  }

  return prisma.contact.update({ where: { id, userId }, data: validatedData });
}

export async function deleteContact(id: string, userId: string) {
  const contact = await prisma.contact.findFirst({ where: { id, userId, ...ACTIVE } });
  if (!contact) throw NotFound("Contact not found");
  await prisma.contact.update({ where: { id }, data: { deletedAt: new Date() } });
  return { success: true };
}

export async function deleteManyContacts(ids: string[], userId: string) {
  await prisma.contact.updateMany({
    where: { id: { in: ids }, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return { success: true };
}
```

- [ ] **Step 4: Update `src/app/api/contacts/route.ts`**

```typescript
import { jsonCreated, jsonOk } from "@/lib/errors/response";
import { handleRouteError, parsePagination, requireJson, requireUserId } from "@/lib/api-helpers";
import { getContacts, createContact } from "@/lib/services/back/contacts";

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const { page, pageSize, q } = parsePagination(req);
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId") ?? undefined;
    const unlinked = searchParams.get("unlinked") === "true";
    const result = await getContacts(userId, { page, pageSize, q, companyId, unlinked });
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(req: Request) {
  try {
    requireJson(req);
    const userId = await requireUserId();
    const body = await req.json();
    const contact = await createContact(userId, body);
    return jsonCreated(contact);
  } catch (error) {
    return handleRouteError(error);
  }
}
```

- [ ] **Step 5: Run tests — expect all to pass**

```bash
npx vitest run src/tests/integration/api/contacts.test.ts
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/services/back/contacts.ts src/app/api/contacts/route.ts src/tests/integration/api/contacts.test.ts
git commit -m "feat: scope contacts by userId, support optional company, inline channels, unlinked filter"
```

---

## Task 5: Create `CompanyQuickCreateModal`

**Files:**
- Create: `src/components/companies/CompanyQuickCreateModal.tsx`

- [ ] **Step 1: Create `src/components/companies/CompanyQuickCreateModal.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { pushToast } from "@/components/common/Toast";
import companyService from "@/lib/services/front/company.service";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: (company: { id: string; name: string }) => void;
};

export function CompanyQuickCreateModal({ open, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", typeCode: "CLIENT_FINAL" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await companyService.create<{ id: string; name: string }>(form);
      pushToast({ type: "success", title: "Entreprise créée" });
      onSuccess(data);
      setForm({ name: "", typeCode: "CLIENT_FINAL" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      pushToast({ type: "error", title: "Erreur création", description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Créer une entreprise">
      <form className="space-y-3" onSubmit={submit}>
        <div className="space-y-1">
          <label className="text-sm font-medium">Nom</label>
          <input
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            autoFocus
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Type</label>
          <select
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            value={form.typeCode}
            onChange={(e) => setForm({ ...form, typeCode: e.target.value })}
          >
            <option value="CLIENT_FINAL">Client final</option>
            <option value="ESN">ESN</option>
            <option value="PORTAGE">Portage</option>
            <option value="OTHER">Autre</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "En cours..." : "Créer"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 disabled:opacity-50"
          >
            Annuler
          </button>
        </div>
      </form>
    </Modal>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/companies/CompanyQuickCreateModal.tsx
git commit -m "feat: add CompanyQuickCreateModal component"
```

---

## Task 6: Update `ContactForm` (contacts list page)

**Files:**
- Modify: `src/components/contacts/ContactForm.tsx`

- [ ] **Step 1: Replace `src/components/contacts/ContactForm.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { pushToast } from "@/components/common/Toast";
import type { ContactDTO } from "@/lib/dto/contact";
import contactService from "@/lib/services/front/contact.service";
import companyService from "@/lib/services/front/company.service";
import { CompanyQuickCreateModal } from "@/components/companies/CompanyQuickCreateModal";

type CompanyOption = { id: string; name: string };
type ChannelRow = { channelTypeCode: string; value: string };

const CHANNEL_TYPES = [
  { code: "EMAIL", label: "Email" },
  { code: "PHONE", label: "Téléphone" },
  { code: "LINKEDIN", label: "LinkedIn" },
  { code: "OTHER", label: "Autre" },
];

type Props = {
  onSuccess?: (data: ContactDTO) => void;
};

export function ContactForm({ onSuccess }: Props) {
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [channels, setChannels] = useState<ChannelRow[]>([]);
  const [form, setForm] = useState({
    companyId: "",
    firstName: "",
    lastName: "",
    roleTitle: "",
    notes: "",
  });

  useEffect(() => {
    companyService.list().then(setCompanies);
  }, []);

  const addChannel = () =>
    setChannels((prev) => [...prev, { channelTypeCode: "EMAIL", value: "" }]);

  const removeChannel = (i: number) =>
    setChannels((prev) => prev.filter((_, idx) => idx !== i));

  const updateChannel = (i: number, field: keyof ChannelRow, value: string) =>
    setChannels((prev) => prev.map((ch, idx) => (idx === i ? { ...ch, [field]: value } : ch)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await contactService.create<ContactDTO>({
        ...(form.companyId ? { companyId: form.companyId } : {}),
        firstName: form.firstName,
        lastName: form.lastName,
        roleTitle: form.roleTitle || undefined,
        notes: form.notes || undefined,
        channels: channels.filter((ch) => ch.value.trim()),
      });
      pushToast({ type: "success", title: "Contact créé" });
      onSuccess?.(data);
      setForm({ companyId: "", firstName: "", lastName: "", roleTitle: "", notes: "" });
      setChannels([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      pushToast({ type: "error", title: "Erreur contact", description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CompanyQuickCreateModal
        open={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        onSuccess={(company) => {
          setCompanies((prev) => [...prev, company]);
          setForm((f) => ({ ...f, companyId: company.id }));
          setQuickCreateOpen(false);
        }}
      />
      <form className="space-y-3" onSubmit={submit}>
        <div className="space-y-1">
          <label className="text-sm font-medium">
            Entreprise <span className="font-normal text-neutral-400">(optionnel)</span>
          </label>
          <div className="flex gap-2">
            <select
              className="flex-1 rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              value={form.companyId}
              onChange={(e) => setForm({ ...form, companyId: e.target.value })}
            >
              <option value="">Aucune</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setQuickCreateOpen(true)}
              className="whitespace-nowrap rounded border border-emerald-600 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
            >
              + Créer
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Prénom</label>
            <input
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Nom</label>
            <input
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Rôle</label>
          <input
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            value={form.roleTitle}
            onChange={(e) => setForm({ ...form, roleTitle: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Canaux de communication</label>
          {channels.map((ch, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                className="rounded border border-neutral-300 px-2 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                value={ch.channelTypeCode}
                onChange={(e) => updateChannel(i, "channelTypeCode", e.target.value)}
              >
                {CHANNEL_TYPES.map((t) => (
                  <option key={t.code} value={t.code}>{t.label}</option>
                ))}
              </select>
              <input
                className="flex-1 rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                value={ch.value}
                onChange={(e) => updateChannel(i, "value", e.target.value)}
                placeholder="Valeur"
              />
              <button
                type="button"
                onClick={() => removeChannel(i)}
                aria-label="Supprimer ce canal"
                className="text-lg leading-none text-neutral-400 hover:text-red-500"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addChannel}
            className="rounded border border-dashed border-emerald-600 px-3 py-1 text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
          >
            + Ajouter un canal
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Notes</label>
          <textarea
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "En cours..." : "Créer"}
        </button>
      </form>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/contacts/ContactForm.tsx
git commit -m "feat: ContactForm — optional company, inline channels, quick-create sub-modal"
```

---

## Task 7: Update `ContactEditForm`

**Files:**
- Modify: `src/components/companies/ContactEditForm.tsx`

- [ ] **Step 1: Replace `src/components/companies/ContactEditForm.tsx`**

```tsx
"use client";

import { useState, useEffect } from "react";
import { pushToast } from "@/components/common/Toast";
import type { ContactDTO } from "@/lib/dto/contact";
import contactService from "@/lib/services/front/contact.service";
import companyService from "@/lib/services/front/company.service";
import { CompanyQuickCreateModal } from "@/components/companies/CompanyQuickCreateModal";

type CompanyOption = { id: string; name: string };

type Props = {
  contact: ContactDTO;
  onSuccess?: (data: ContactDTO) => void;
  onCancel?: () => void;
};

export function ContactEditForm({ contact, onSuccess, onCancel }: Props) {
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [form, setForm] = useState({
    companyId: contact.companyId ?? "",
    firstName: contact.firstName,
    lastName: contact.lastName,
    roleTitle: contact.roleTitle || "",
    notes: contact.notes || "",
  });

  useEffect(() => {
    companyService.list().then(setCompanies);
  }, []);

  useEffect(() => {
    setForm({
      companyId: contact.companyId ?? "",
      firstName: contact.firstName,
      lastName: contact.lastName,
      roleTitle: contact.roleTitle || "",
      notes: contact.notes || "",
    });
  }, [contact]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await contactService.update<ContactDTO>(contact.id, {
        companyId: form.companyId || null,
        firstName: form.firstName,
        lastName: form.lastName,
        roleTitle: form.roleTitle || undefined,
        notes: form.notes || undefined,
      });
      pushToast({ type: "success", title: "Contact mis à jour" });
      onSuccess?.(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      pushToast({ type: "error", title: "Erreur mise à jour", description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CompanyQuickCreateModal
        open={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        onSuccess={(company) => {
          setCompanies((prev) => [...prev, company]);
          setForm((f) => ({ ...f, companyId: company.id }));
          setQuickCreateOpen(false);
        }}
      />
      <form className="space-y-3" onSubmit={submit}>
        <div className="space-y-1">
          <label className="text-sm font-medium">
            Entreprise <span className="font-normal text-neutral-400">(optionnel)</span>
          </label>
          <div className="flex gap-2">
            <select
              className="flex-1 rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              value={form.companyId}
              onChange={(e) => setForm({ ...form, companyId: e.target.value })}
            >
              <option value="">Aucune</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setQuickCreateOpen(true)}
              className="whitespace-nowrap rounded border border-emerald-600 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
            >
              + Créer
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Prénom</label>
            <input
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Nom</label>
            <input
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Rôle</label>
          <input
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            value={form.roleTitle}
            onChange={(e) => setForm({ ...form, roleTitle: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Notes</label>
          <textarea
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "En cours..." : "Enregistrer"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 disabled:opacity-50"
            >
              Annuler
            </button>
          )}
        </div>
      </form>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/companies/ContactEditForm.tsx
git commit -m "feat: ContactEditForm — add company selector with quick-create sub-modal"
```

---

## Task 8: Update contact detail page

**Files:**
- Create: `src/components/contacts/ContactEditButton.tsx`
- Modify: `src/components/contacts/ContactActionsSection.tsx`
- Modify: `src/app/(app)/contacts/[id]/page.tsx`

- [ ] **Step 1: Create `src/components/contacts/ContactEditButton.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/common/Modal";
import { ContactEditForm } from "@/components/companies/ContactEditForm";
import type { ContactDTO } from "@/lib/dto/contact";

type Props = {
  contact: ContactDTO;
};

export function ContactEditButton({ contact }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        Modifier
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Modifier le contact">
        <ContactEditForm
          contact={contact}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
          onCancel={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
```

- [ ] **Step 2: Make `companyId` optional in `ContactActionsSection`**

In `src/components/contacts/ContactActionsSection.tsx`, update the Props type:

```tsx
type Props = {
  contactId: string;
  companyId?: string;  // was: companyId: string
};
```

- [ ] **Step 3: Update `src/app/(app)/contacts/[id]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { AddChannelButton } from "@/components/contacts/AddChannelButton";
import { ContactActionsSection } from "@/components/contacts/ContactActionsSection";
import { ContactEditButton } from "@/components/contacts/ContactEditButton";
import { SendEmailModal } from "@/components/common/SendEmailModal";
import { getContact } from "@/lib/services/back/contacts";
import { requireUserId } from "@/lib/api-helpers";
import type { ContactDTO } from "@/lib/dto/contact";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const { id } = await params;
  const userId = await requireUserId();
  const contact = await getContact(id, userId);
  if (!contact) return notFound();

  const emailChannel = contact.channels?.find(
    (ch) => ch.channelTypeCode === "EMAIL" || ch.value.includes("@")
  );

  // Cast for client components — dates are serialized by Next.js RSC serialization
  const contactDto = contact as unknown as ContactDTO;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {contact.firstName} {contact.lastName}
          </h1>
          {contact.roleTitle && (
            <p className="text-sm text-neutral-600 dark:text-neutral-300">{contact.roleTitle}</p>
          )}
          {contact.company ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{contact.company.name}</p>
          ) : (
            <p className="text-sm italic text-neutral-400 dark:text-neutral-500">Sans entreprise</p>
          )}
        </div>
        <div className="flex gap-2">
          <ContactEditButton contact={contactDto} />
          <SendEmailModal
            defaultTo={emailChannel?.value ?? ""}
            defaultSubject={`Relance — ${contact.firstName} ${contact.lastName}`}
            defaultText={`Bonjour ${contact.firstName},\n\nJe me permets de vous recontacter suite à nos échanges.\n\nCordialement,`}
            triggerLabel="Envoyer un email"
          />
        </div>
      </div>

      <ContactActionsSection
        contactId={contact.id}
        companyId={contact.companyId ?? undefined}
      />

      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Canaux</h3>
          <AddChannelButton contactId={contact.id} />
        </div>
        <ul className="space-y-2 text-sm">
          {contact.channels?.length ? (
            contact.channels.map((ch) => (
              <li key={ch.id} className="rounded border border-neutral-200 p-2 dark:border-neutral-800">
                <div className="font-medium">
                  {ch.channelTypeCode} {ch.isPrimary ? "(principal)" : ""}
                </div>
                <div className="text-neutral-700 dark:text-neutral-300">
                  {ch.value} {ch.label ? `(${ch.label})` : ""}
                </div>
              </li>
            ))
          ) : (
            <div className="text-sm text-neutral-500">Aucun canal de contact.</div>
          )}
        </ul>
      </div>

      {contact.notes && (
        <div className="card">
          <h3 className="text-sm font-semibold">Notes</h3>
          <p className="whitespace-pre-line text-sm text-neutral-700 dark:text-neutral-300">
            {contact.notes}
          </p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/contacts/ContactEditButton.tsx src/components/contacts/ContactActionsSection.tsx src/app/(app)/contacts/[id]/page.tsx
git commit -m "feat: contact detail page — show company, add edit modal with company selector"
```

---

## Task 9: Add `listUnlinked` to contact service

**Files:**
- Modify: `src/lib/services/front/contact.service.ts`

- [ ] **Step 1: Add `listUnlinked` method**

Add after the `listByCompany` method in `src/lib/services/front/contact.service.ts`:

```typescript
async listUnlinked(): Promise<ContactDTO[]> {
  const data = await frontFetchJson<ContactListResponse>(
    `${this.basePath}?unlinked=true&pageSize=300`
  );
  return data.items ?? [];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/services/front/contact.service.ts
git commit -m "feat: add listUnlinked() to contact service"
```

---

## Task 10: Create `LinkContactForm` and update company detail page

**Files:**
- Create: `src/components/companies/LinkContactForm.tsx`
- Modify: `src/app/(app)/companies/[id]/page.tsx`

- [ ] **Step 1: Create `src/components/companies/LinkContactForm.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { pushToast } from "@/components/common/Toast";
import type { ContactDTO } from "@/lib/dto/contact";
import contactService from "@/lib/services/front/contact.service";

type Props = {
  companyId: string;
  onSuccess: (contact: ContactDTO) => void;
};

export function LinkContactForm({ companyId, onSuccess }: Props) {
  const [unlinked, setUnlinked] = useState<ContactDTO[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    contactService.listUnlinked().then(setUnlinked);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setLoading(true);
    try {
      const data = await contactService.update<ContactDTO>(selectedId, { companyId });
      pushToast({ type: "success", title: "Contact lié" });
      setUnlinked((prev) => prev.filter((c) => c.id !== selectedId));
      setSelectedId("");
      onSuccess(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      pushToast({ type: "error", title: "Erreur liaison", description: message });
    } finally {
      setLoading(false);
    }
  };

  if (unlinked.length === 0) {
    return (
      <p className="text-sm text-neutral-500">Aucun contact sans entreprise à lier.</p>
    );
  }

  return (
    <form className="space-y-3" onSubmit={submit}>
      <div className="space-y-1">
        <select
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          <option value="">Sélectionner un contact...</option>
          {unlinked.map((c) => (
            <option key={c.id} value={c.id}>
              {c.firstName} {c.lastName}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={loading || !selectedId}
        className="rounded bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? "En cours..." : "Lier"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Update the contacts tab in `src/app/(app)/companies/[id]/page.tsx`**

Add `LinkContactForm` import at the top:

```typescript
import { LinkContactForm } from "@/components/companies/LinkContactForm";
```

Replace the contacts tab right column (find the block starting with `<div className="space-y-2">` that wraps `<h3 className="text-sm font-semibold">Ajouter un contact</h3>`):

```tsx
<div className="space-y-4">
  <div className="space-y-2">
    <h3 className="text-sm font-semibold">Nouveau contact</h3>
    <ContactForm
      companyId={company.id}
      onSuccess={(contact: ContactDTO) => {
        setCompany({ ...company, contacts: [...(company.contacts ?? []), contact] });
      }}
    />
  </div>
  <div className="space-y-2">
    <h3 className="text-sm font-semibold">Lier un contact existant</h3>
    <LinkContactForm
      companyId={company.id}
      onSuccess={(contact: ContactDTO) => {
        setCompany({ ...company, contacts: [...(company.contacts ?? []), contact] });
      }}
    />
  </div>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/companies/LinkContactForm.tsx src/app/(app)/companies/[id]/page.tsx
git commit -m "feat: add LinkContactForm and wire it into company detail contacts tab"
```

---

## Task 11: Full test run + build check

- [ ] **Step 1: Run all tests**

```bash
npm run test
```

Expected: all tests pass with no failures.

- [ ] **Step 2: TypeScript + lint check**

```bash
npm run build
```

Expected: build succeeds with no type errors.

- [ ] **Step 3: Smoke test in browser**

Start dev server:
```bash
npm run dev
```

Verify the following manually:
1. `/contacts` → "Nouveau contact" → create without company → success
2. `/contacts` → "Nouveau contact" → add 2 channels inline → create → verify channels appear on detail page
3. `/contacts` → "Nouveau contact" → click "+ Créer" next to company → sub-modal opens → create → company auto-selected
4. `/contacts/[id]` → "Modifier" → change or add company → save → company name shows in header
5. `/companies/[id]` → Contacts tab → "Lier un contact existant" → select unlinked contact → "Lier" → contact appears in list
