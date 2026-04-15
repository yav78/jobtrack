# Opportunity Source URL Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional `sourceUrl` field to opportunities, displayed as a clickable icon in the list that opens an iframe modal, and editable on the creation form, edit form, and detail page.

**Architecture:** Add `sourceUrl` at every layer — Prisma schema → Zod validator → DTO → back service (automatic via Zod parse) → front forms → table icon → new `SourceModal` component. The iframe modal handles load errors gracefully since many sites block iframes via X-Frame-Options.

**Tech Stack:** Prisma (PostgreSQL), Zod, Next.js App Router, React, TailwindCSS (dark mode)

---

## File Map

| Action | File |
|--------|------|
| Modify | `prisma/schema.prisma` |
| Create | `prisma/migrations/<timestamp>_add_source_url_to_work_opportunity/migration.sql` (via CLI) |
| Modify | `src/lib/dto/opportunity.ts` |
| Modify | `src/lib/validators/opportunity.ts` |
| Modify | `src/components/opportunities/OpportunityForm.tsx` |
| Modify | `src/components/opportunities/OpportunityEditForm.tsx` |
| Modify | `src/app/(app)/opportunities/[id]/page.tsx` |
| Create | `src/components/opportunities/SourceModal.tsx` |
| Modify | `src/components/opportunities/OpportunitiesTable.tsx` |

---

### Task 1: Add `sourceUrl` to Prisma schema and migrate

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add the field to the schema**

In `prisma/schema.prisma`, inside `model WorkOpportunity`, add `sourceUrl` after `followUpAt`:

```prisma
model WorkOpportunity {
  id          String                  @id @default(uuid()) @db.Uuid
  title       String
  description String?
  sourceUrl   String?
  status      WorkOpportunityStatus   @default(SOURCING)
  followUpAt  DateTime?
  deletedAt   DateTime?
  companyId   String?                 @db.Uuid
  userId      String                  @db.Uuid
  createdAt   DateTime                @default(now())
  updatedAt   DateTime                @updatedAt
  entretiens  Entretien[]
  actions     OpportunityAction[]
  company     Company?                @relation(fields: [companyId], references: [id])
  user        User                    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([companyId])
  @@index([status])
  @@index([followUpAt])
}
```

- [ ] **Step 2: Run migration**

```bash
cd /home/ycakir/jobtrack && npx prisma migrate dev --name add_source_url_to_work_opportunity
```

Expected: `✔ Generated Prisma Client` with no errors.

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add sourceUrl field to WorkOpportunity schema"
```

---

### Task 2: Update DTO and Zod validators

**Files:**
- Modify: `src/lib/dto/opportunity.ts`
- Modify: `src/lib/validators/opportunity.ts`

- [ ] **Step 1: Add `sourceUrl` to the DTO**

Replace the contents of `src/lib/dto/opportunity.ts`:

```typescript
export type WorkOpportunityDTO = {
  id: string;
  title: string;
  description?: string | null;
  sourceUrl?: string | null;
  status: string;
  followUpAt?: string | null;
  companyId?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  company?: { id: string; name: string } | null;
};
```

- [ ] **Step 2: Add `sourceUrl` to both Zod schemas**

Replace the contents of `src/lib/validators/opportunity.ts`:

```typescript
import { z } from "zod";
import { WorkOpportunityStatus } from "@prisma/client";

const statusEnum = z.nativeEnum(WorkOpportunityStatus);

export const opportunityCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  sourceUrl: z.string().url().nullable().optional(),
  companyId: z.string().uuid().nullable().optional(),
  status: statusEnum.optional(),
});

export const opportunityUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  sourceUrl: z.string().url().nullable().optional(),
  companyId: z.string().uuid().nullable().optional(),
  status: statusEnum.optional(),
  followUpAt: z.string().datetime().nullable().optional(),
});
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/dto/opportunity.ts src/lib/validators/opportunity.ts
git commit -m "feat: add sourceUrl to opportunity DTO and validators"
```

---

### Task 3: Update `OpportunityForm` (création)

**Files:**
- Modify: `src/components/opportunities/OpportunityForm.tsx`

- [ ] **Step 1: Add `sourceUrl` to form state and submit**

In `OpportunityForm.tsx`, update the `form` state initial value, the submit call, and the reset — then add a field in JSX.

Replace the file with:

```typescript
"use client";

import { useState, useEffect } from "react";
import { pushToast } from "@/components/common/Toast";
import { Modal } from "@/components/common/Modal";
import { CompanyForm } from "@/components/companies/CompanyForm";
import type { CompanyDTO } from "@/lib/dto/company";
import companyService from "@/lib/services/front/company.service";
import opportunityService from "@/lib/services/front/opportunity.service";

type Props = {
  onSuccess?: () => void;
};

export function OpportunityForm({ onSuccess }: Props) {
  const [companies, setCompanies] = useState<CompanyDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    sourceUrl: "",
    companyId: "",
  });

  const loadCompanies = async () => {
    const items = await companyService.list();
    setCompanies(items);
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await opportunityService.create({
        title: form.title,
        description: form.description || undefined,
        sourceUrl: form.sourceUrl || undefined,
        companyId: form.companyId || undefined,
      });
      pushToast({ type: "success", title: "Opportunité créée" });
      setForm({ title: "", description: "", sourceUrl: "", companyId: "" });
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      pushToast({ type: "error", title: "Erreur opportunité", description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form className="space-y-3" onSubmit={submit}>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Entreprise</label>
            <button
              type="button"
              onClick={() => setShowCompanyModal(true)}
              className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              + Créer une entreprise
            </button>
          </div>
          <select
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            value={form.companyId}
            onChange={(e) => setForm({ ...form, companyId: e.target.value })}
          >
            <option value="">Sélectionner (optionnel)</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Titre</label>
          <input
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Source URL <span className="text-neutral-400 font-normal">(optionnel)</span></label>
          <input
            type="url"
            placeholder="https://..."
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            value={form.sourceUrl}
            onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Description</label>
          <textarea
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
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
      <Modal open={showCompanyModal} title="Créer une entreprise" onClose={() => setShowCompanyModal(false)}>
        <CompanyForm
          onSuccess={async () => {
            const items = await companyService.list();
            setCompanies(items);
            if (items.length > 0) {
              setForm((f) => ({ ...f, companyId: items[0].id }));
            }
            setShowCompanyModal(false);
          }}
        />
      </Modal>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/opportunities/OpportunityForm.tsx
git commit -m "feat: add sourceUrl field to OpportunityForm"
```

---

### Task 4: Update `OpportunityEditForm` (édition)

**Files:**
- Modify: `src/components/opportunities/OpportunityEditForm.tsx`

- [ ] **Step 1: Add `sourceUrl` to form state, useEffect reset, and submit**

In `OpportunityEditForm.tsx`:
- Add `sourceUrl: opportunity.sourceUrl || ""` to the initial `form` state
- Add `sourceUrl: opportunity.sourceUrl || ""` in the `useEffect` that resets the form when `opportunity` changes
- Pass `sourceUrl: form.sourceUrl || undefined` in the `opportunityService.update()` call
- Add the URL input field in JSX after the "Titre" field

The updated `form` state:
```typescript
const [form, setForm] = useState({
  title: opportunity.title,
  description: opportunity.description || "",
  sourceUrl: opportunity.sourceUrl || "",
  companyId: opportunity.companyId || "",
  status: opportunity.status || "SOURCING",
  followUpAt: toDatetimeLocal(opportunity.followUpAt),
});
```

The updated `useEffect`:
```typescript
useEffect(() => {
  setForm({
    title: opportunity.title,
    description: opportunity.description || "",
    sourceUrl: opportunity.sourceUrl || "",
    companyId: opportunity.companyId || "",
    status: opportunity.status || "SOURCING",
    followUpAt: toDatetimeLocal(opportunity.followUpAt),
  });
}, [opportunity]);
```

The updated submit call (add `sourceUrl` line):
```typescript
const data = await opportunityService.update<WorkOpportunityDTO>(opportunity.id, {
  title: form.title,
  description: form.description || undefined,
  sourceUrl: form.sourceUrl || undefined,
  companyId: form.companyId || undefined,
  status: form.status,
  followUpAt: form.followUpAt ? new Date(form.followUpAt).toISOString() : null,
});
```

The new JSX field — add it after the closing `</div>` of the "Titre" field block:
```tsx
<div className="space-y-1">
  <label className="text-sm font-medium">
    Source URL <span className="text-neutral-400 font-normal">(optionnel)</span>
  </label>
  <input
    type="url"
    placeholder="https://..."
    className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
    value={form.sourceUrl}
    onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
  />
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/opportunities/OpportunityEditForm.tsx
git commit -m "feat: add sourceUrl field to OpportunityEditForm"
```

---

### Task 5: Map `sourceUrl` in the detail page

**Files:**
- Modify: `src/app/(app)/opportunities/[id]/page.tsx`

- [ ] **Step 1: Add `sourceUrl` to `opportunityDTO` mapping**

In the detail page, find the `opportunityDTO` object literal and add `sourceUrl`:

```typescript
const opportunityDTO = {
  id: opp.id,
  title: opp.title,
  description: opp.description,
  sourceUrl: opp.sourceUrl ?? null,
  status: opp.status,
  followUpAt: opp.followUpAt?.toISOString() ?? null,
  companyId: opp.companyId,
  userId: opp.userId,
  createdAt: opp.createdAt.toISOString(),
  updatedAt: opp.updatedAt.toISOString(),
  company: opp.company
    ? { id: opp.company.id, name: opp.company.name }
    : null,
};
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(app)/opportunities/[id]/page.tsx
git commit -m "feat: map sourceUrl in opportunity detail page DTO"
```

---

### Task 6: Create `SourceModal` component

**Files:**
- Create: `src/components/opportunities/SourceModal.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

import { useState, useEffect } from "react";

type Props = {
  url: string;
  onClose: () => void;
};

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function SourceModal({ url, onClose }: Props) {
  const [blocked, setBlocked] = useState(false);

  // Reset blocked state when URL changes
  useEffect(() => {
    setBlocked(false);
  }, [url]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const domain = extractDomain(url);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex h-[80vh] w-[90vw] max-w-5xl flex-col rounded-lg bg-white shadow-xl dark:bg-neutral-900">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-700">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate">
              {domain}
            </span>
            <span className="hidden text-xs text-neutral-400 truncate sm:block">
              {url}
            </span>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2 ml-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded border border-neutral-300 px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Ouvrir dans un onglet ↗
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded px-2 py-1 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Fermer
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="relative flex-1 overflow-hidden">
          {blocked ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
              <p className="text-neutral-500 dark:text-neutral-400">
                Ce site refuse d&apos;être affiché dans une fenêtre intégrée.
              </p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700"
              >
                Ouvrir dans un nouvel onglet ↗
              </a>
            </div>
          ) : (
            <iframe
              src={url}
              className="h-full w-full border-0"
              title={domain}
              onError={() => setBlocked(true)}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/opportunities/SourceModal.tsx
git commit -m "feat: add SourceModal component with iframe and fallback"
```

---

### Task 7: Add source icon to `OpportunitiesTable`

**Files:**
- Modify: `src/components/opportunities/OpportunitiesTable.tsx`

- [ ] **Step 1: Import `SourceModal` and add state + icon**

The table needs local state for the currently-previewed URL. Since `OpportunitiesTable` is already a client component, add `useState`, import `SourceModal`, and update the "Titre" column.

Replace the file with:

```typescript
"use client";

import { useState } from "react";
import Link from "next/link";
import { DataTable } from "@/components/common/DataTable";
import { SourceModal } from "@/components/opportunities/SourceModal";
import type { WorkOpportunityDTO } from "@/lib/dto/opportunity";
import {
  OPPORTUNITY_STATUS_LABELS,
  OPPORTUNITY_STATUS_COLORS,
} from "@/constants/opportunityStatus";

type Props = {
  data: WorkOpportunityDTO[];
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
};

function StatusBadge({ status }: { status: string }) {
  const label = OPPORTUNITY_STATUS_LABELS[status] ?? status;
  const color =
    OPPORTUNITY_STATUS_COLORS[status] ??
    "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

function FollowUpCell({ followUpAt }: { followUpAt?: string | null }) {
  if (!followUpAt) return <span className="text-neutral-400">—</span>;
  const date = new Date(followUpAt);
  const isOverdue = date < new Date();
  const formatted = date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return (
    <span
      className={
        isOverdue
          ? "font-medium text-red-600 dark:text-red-400"
          : "text-neutral-700 dark:text-neutral-300"
      }
      title={isOverdue ? "Rappel en retard" : undefined}
    >
      {isOverdue ? "⚠ " : ""}
      {formatted}
    </span>
  );
}

export function OpportunitiesTable({ data, selectable, selectedIds, onSelectionChange }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  return (
    <>
      <DataTable
        data={data}
        empty="Aucune opportunité. Cliquez sur « Nouvelle opportunité » pour en créer une."
        selectable={selectable}
        selectedIds={selectedIds}
        onSelectionChange={onSelectionChange}
        columns={[
          {
            header: "Titre",
            render: (row) => (
              <div className="flex items-center gap-2">
                <Link href={`/opportunities/${row.id}`} className="hover:underline">
                  {row.title}
                </Link>
                {row.sourceUrl && (
                  <button
                    type="button"
                    title="Aperçu de la source"
                    onClick={() => setPreviewUrl(row.sourceUrl!)}
                    className="text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-3.5 w-3.5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z"
                        clipRule="evenodd"
                      />
                      <path
                        fillRule="evenodd"
                        d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
              </div>
            ),
          },
          {
            header: "Statut",
            render: (row) => <StatusBadge status={row.status} />,
          },
          {
            header: "Entreprise",
            render: (row) =>
              row.company ? (
                <Link href={`/companies/${row.company.id}`} className="text-emerald-600 hover:underline">
                  {row.company.name}
                </Link>
              ) : (
                <span className="text-neutral-400">—</span>
              ),
          },
          {
            header: "Relance",
            render: (row) => <FollowUpCell followUpAt={row.followUpAt} />,
          },
          {
            header: "Ajouté le",
            render: (row) => (
              <span className="text-neutral-500 dark:text-neutral-400 text-xs">
                {new Date(row.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            ),
          },
        ]}
      />

      {previewUrl && (
        <SourceModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
      )}
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/opportunities/OpportunitiesTable.tsx
git commit -m "feat: add source URL preview icon to opportunities table"
```

---

### Task 8: Verify build

- [ ] **Step 1: Run lint**

```bash
cd /home/ycakir/jobtrack && npm run lint
```

Expected: no errors.

- [ ] **Step 2: Run build**

```bash
cd /home/ycakir/jobtrack && npm run build
```

Expected: build completes with no TypeScript errors.

- [ ] **Step 3: Smoke test manually**

1. Start dev server: `npm run dev`
2. Navigate to `/opportunities`
3. Click "Nouvelle opportunité" — the modal should show the Source URL field
4. Create an opportunity with a URL (e.g. `https://example.com`)
5. Verify the link icon appears next to the title in the table
6. Click the icon — the SourceModal should open with the iframe
7. Navigate to the opportunity detail page — the Source URL field should appear in the edit form and be pre-filled
8. Edit and save the URL — verify it persists
