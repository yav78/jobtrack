# Jobboards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une page Jobboards dédiée (catégorie JOBBOARD des Links), lier les actions à un jobboard ("via"), lier les opportunités à un jobboard source ("vu sur"), et afficher les stats de candidatures par jobboard sur le tableau de bord.

**Architecture:** Deux nouveaux champs nullable FK sur `OpportunityAction.linkId` et `WorkOpportunity.sourceLinkId`, tous deux pointant vers la table `Link` (catégorie JOBBOARD). La page Jobboards réutilise l'API `/api/links` avec un filtre de catégorie. Les stats sont calculées dans l'API dashboard existante.

**Tech Stack:** Next.js 16 App Router, Prisma + PostgreSQL, Zod, TailwindCSS, TypeScript

---

## Fichiers créés ou modifiés

| Fichier | Action |
|---|---|
| `prisma/schema.prisma` | Modifier — ajouter `linkId` sur `OpportunityAction`, `sourceLinkId` sur `WorkOpportunity`, back-relations sur `Link` |
| `prisma/migrations/` | Créer — migration automatique |
| `src/lib/validators/link.ts` | Modifier — `linkListQuerySchema` supporte plusieurs catégories |
| `src/lib/validators/opportunity-action.ts` | Modifier — ajouter `linkId` |
| `src/lib/validators/opportunity.ts` | Modifier — ajouter `sourceLinkId` |
| `src/lib/dto/opportunity-action.ts` | Modifier — ajouter `linkId`, `link` |
| `src/lib/dto/opportunity.ts` | Modifier — ajouter `sourceLinkId`, `sourceLink` |
| `src/lib/services/back/links.ts` | Modifier — `getLinks` accepte `category[]` |
| `src/lib/services/back/opportunity-actions.ts` | Modifier — includes `link`, `linkId` dans create/update, ajouter `getApplicationsByJobboard` |
| `src/lib/services/back/opportunities.ts` | Modifier — includes `sourceLink`, `sourceLinkId` dans create/update |
| `src/lib/services/front/jobboard.service.ts` | Créer — service front filtrant par JOBBOARD |
| `src/app/api/links/route.ts` | Modifier — parser plusieurs catégories |
| `src/app/api/actions/route.ts` | Modifier — `actionToDto` inclut `link`, POST passe `linkId` |
| `src/app/api/actions/[actionId]/route.ts` | Modifier — PATCH passe `linkId` |
| `src/app/api/opportunities/route.ts` | Modifier — POST passe `sourceLinkId` |
| `src/app/api/opportunities/[id]/route.ts` | Modifier — PATCH passe `sourceLinkId` |
| `src/app/api/dashboard/overview/route.ts` | Modifier — ajouter stats jobboard |
| `src/app/(app)/jobboards/page.tsx` | Créer — page Jobboards (RSC) |
| `src/app/(app)/jobboards/JobboardsPageClient.tsx` | Créer — composant client Jobboards |
| `src/app/(app)/links/page.tsx` | Modifier — filtrer hors JOBBOARD |
| `src/app/(app)/links/LinksPageClient.tsx` | Modifier — retirer JOBBOARD des options |
| `src/components/layout/sidebar.tsx` | Modifier — ajouter entrée Jobboards |
| `src/components/actions/StandaloneActionForm.tsx` | Modifier — champ "Via" (linkId) |
| `src/components/opportunities/OpportunityForm.tsx` | Modifier — champ "Vu sur" (sourceLinkId) |
| `src/components/opportunities/OpportunityEditForm.tsx` | Modifier — champ "Vu sur" (sourceLinkId) |
| `src/components/actions/ActionsListClient.tsx` | Modifier — badge "Via" |
| `src/components/opportunities/OpportunitiesTable.tsx` | Modifier — badge "Vu sur" |
| `src/app/(app)/page.tsx` | Modifier — widget candidatures par jobboard |

---

## Task 1 : Prisma schema — nouveaux champs et migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Étape 1 : Modifier le schéma Prisma**

Dans `prisma/schema.prisma`, ajouter les champs suivants :

```prisma
// Dans model WorkOpportunity (après le champ companyId) :
sourceLinkId  String?         @db.Uuid

// Dans model WorkOpportunity (après la relation company) :
sourceLink    Link?           @relation("OpportunitySourceLink", fields: [sourceLinkId], references: [id])

// Dans model OpportunityAction (après le champ contactChannelId) :
linkId        String?         @db.Uuid

// Dans model OpportunityAction (après la relation contact) :
link          Link?           @relation("ActionJobboard", fields: [linkId], references: [id])

// Dans model Link (après la relation user) :
actionJobboards      OpportunityAction[]  @relation("ActionJobboard")
sourceOpportunities  WorkOpportunity[]    @relation("OpportunitySourceLink")

// Dans model WorkOpportunity : ajouter l'index
@@index([sourceLinkId])

// Dans model OpportunityAction : ajouter l'index
@@index([linkId])
```

- [ ] **Étape 2 : Générer et appliquer la migration**

```bash
cd /home/ycakir/jobtrack
npx prisma migrate dev --name add_jobboard_links
```

Résultat attendu : `The following migration(s) have been created and applied from new schema changes: migrations/…_add_jobboard_links`

- [ ] **Étape 3 : Vérifier que le client Prisma est régénéré**

```bash
npx prisma generate
```

Résultat attendu : `Generated Prisma Client`

- [ ] **Étape 4 : Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add linkId to OpportunityAction and sourceLinkId to WorkOpportunity"
```

---

## Task 2 : Validators et DTOs

**Files:**
- Modify: `src/lib/validators/link.ts`
- Modify: `src/lib/validators/opportunity-action.ts`
- Modify: `src/lib/validators/opportunity.ts`
- Modify: `src/lib/dto/opportunity-action.ts`
- Modify: `src/lib/dto/opportunity.ts`

- [ ] **Étape 1 : Mettre à jour `src/lib/validators/link.ts`**

```typescript
import { z } from "zod";

export const linkCategorySchema = z.enum(["JOBBOARD", "TOOL", "NETWORK", "OTHER"]);

export const linkCreateSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  category: linkCategorySchema.default("OTHER"),
  notes: z.string().optional(),
});

export const linkUpdateSchema = linkCreateSchema.partial();

export const linkListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().optional(),
  category: z.union([linkCategorySchema, z.array(linkCategorySchema)]).optional(),
});
```

- [ ] **Étape 2 : Mettre à jour `src/lib/validators/opportunity-action.ts`**

Ajouter `linkId` aux deux schémas :

```typescript
import { z } from "zod";

const opportunityActionTypeEnum = z.enum([
  "INTERVIEW",
  "APPLIED",
  "INBOUND_CONTACT",
  "OUTBOUND_CONTACT",
  "MESSAGE",
  "CALL",
  "FOLLOW_UP",
  "OFFER_RECEIVED",
  "OFFER_ACCEPTED",
  "REJECTED",
  "NOTE",
]);

export const opportunityActionCreateSchema = z.object({
  type: opportunityActionTypeEnum,
  occurredAt: z.coerce.date(),
  notes: z.string().optional(),
  workOpportunityId: z.string().uuid().nullable().optional(),
  companyId: z.string().uuid().nullable().optional(),
  contactId: z.string().uuid().nullable().optional(),
  contactChannelId: z.string().uuid().optional(),
  channelTypeCode: z.string().optional(),
  participantContactIds: z.array(z.string().uuid()).optional(),
  metadata: z.record(z.unknown()).optional(),
  linkId: z.string().uuid().nullable().optional(),
});

export const opportunityActionUpdateSchema = z.object({
  type: opportunityActionTypeEnum.optional(),
  occurredAt: z.coerce.date().optional(),
  notes: z.string().optional(),
  workOpportunityId: z.string().uuid().nullable().optional(),
  companyId: z.string().uuid().nullable().optional(),
  contactId: z.string().uuid().nullable().optional(),
  contactChannelId: z.string().uuid().optional().nullable(),
  channelTypeCode: z.string().optional().nullable(),
  participantContactIds: z.array(z.string().uuid()).optional(),
  metadata: z.record(z.unknown()).optional(),
  linkId: z.string().uuid().nullable().optional(),
});
```

- [ ] **Étape 3 : Mettre à jour `src/lib/validators/opportunity.ts`**

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
  sourceLinkId: z.string().uuid().nullable().optional(),
});

export const opportunityUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  sourceUrl: z.string().url().nullable().optional(),
  companyId: z.string().uuid().nullable().optional(),
  status: statusEnum.optional(),
  followUpAt: z.string().datetime().nullable().optional(),
  sourceLinkId: z.string().uuid().nullable().optional(),
});
```

- [ ] **Étape 4 : Mettre à jour `src/lib/dto/opportunity-action.ts`**

```typescript
import type { OpportunityActionType } from "@prisma/client";

export type ActionDocumentSummary = {
  id: string;
  title: string;
  originalName: string;
  mimeType: string;
  size: number;
};

export type OpportunityActionDTO = {
  id: string;
  occurredAt: string;
  type: OpportunityActionType;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  channelTypeCode: string | null;
  userId: string;
  workOpportunityId: string | null;
  companyId: string | null;
  contactId: string | null;
  contactChannelId: string | null;
  linkId: string | null;
  createdAt: string;
  updatedAt: string;
  contactChannel?: {
    id: string;
    value: string;
    label: string | null;
  };
  participants?: Array<{
    contactId: string;
    contact: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }>;
  workOpportunity?: {
    id: string;
    title: string;
    company?: {
      id: string;
      name: string;
    };
  } | null;
  company?: {
    id: string;
    name: string;
  } | null;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    company?: { id: string; name: string };
  } | null;
  documents?: Array<ActionDocumentSummary>;
  link?: { id: string; title: string } | null;
};
```

- [ ] **Étape 5 : Mettre à jour `src/lib/dto/opportunity.ts`**

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
  sourceLinkId?: string | null;
  sourceLink?: { id: string; title: string } | null;
};
```

- [ ] **Étape 6 : Commit**

```bash
git add src/lib/validators/ src/lib/dto/
git commit -m "feat: add linkId/sourceLinkId to validators and DTOs"
```

---

## Task 3 : Back service — Links (support multi-catégorie)

**Files:**
- Modify: `src/lib/services/back/links.ts`

- [ ] **Étape 1 : Écrire le test d'intégration**

Créer `src/tests/integration/api/links-category-filter.test.ts` :

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/links/route";
import { NextRequest } from "next/server";

const userId = "00000000-0000-0000-0000-000000000001";

function makeRequest(url: string) {
  return new NextRequest(url, {
    method: "GET",
    headers: { "x-user-id": userId },
  });
}

describe("GET /api/links — multi-category filter", () => {
  let jobboardId: string;
  let toolId: string;

  beforeAll(async () => {
    await prisma.link.deleteMany({ where: { userId } });
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, fullName: "Demo", email: "demo@example.com", password: "x" },
    });
    const jb = await prisma.link.create({
      data: { userId, title: "LinkedIn", url: "https://linkedin.com", category: "JOBBOARD" },
    });
    const tool = await prisma.link.create({
      data: { userId, title: "Notion", url: "https://notion.so", category: "TOOL" },
    });
    jobboardId = jb.id;
    toolId = tool.id;
  });

  afterAll(async () => {
    await prisma.link.deleteMany({ where: { userId } });
    await prisma.$disconnect();
  });

  it("filters by single category JOBBOARD", async () => {
    const res = await GET(makeRequest("http://localhost/api/links?category=JOBBOARD"));
    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].id).toBe(jobboardId);
  });

  it("filters by multiple categories TOOL+NETWORK+OTHER (excludes JOBBOARD)", async () => {
    const res = await GET(
      makeRequest("http://localhost/api/links?category=TOOL&category=NETWORK&category=OTHER")
    );
    const body = await res.json();
    expect(body.items.some((i: { id: string }) => i.id === jobboardId)).toBe(false);
    expect(body.items.some((i: { id: string }) => i.id === toolId)).toBe(true);
  });
});
```

- [ ] **Étape 2 : Vérifier que le test échoue**

```bash
npx vitest run src/tests/integration/api/links-category-filter.test.ts
```

Résultat attendu : FAIL (multi-category filter ne fonctionne pas encore)

- [ ] **Étape 3 : Mettre à jour `src/lib/services/back/links.ts`**

```typescript
import { prisma } from "@/lib/prisma";
import { linkCreateSchema, linkUpdateSchema } from "@/lib/validators/link";
import { NotFound } from "@/lib/errors";
import type { z } from "zod";
import type { Link, LinkCategory, Prisma } from "@prisma/client";

type LinkCreateInput = z.infer<typeof linkCreateSchema>;
type LinkUpdateInput = z.infer<typeof linkUpdateSchema>;

const ACTIVE = { deletedAt: null } as const;

export type LinkRecord = Link;

export async function getLinks(
  userId: string,
  options?: {
    page?: number;
    pageSize?: number;
    q?: string;
    category?: LinkCategory | LinkCategory[];
  }
) {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 20;
  const q = options?.q?.trim();

  const categoryFilter: Prisma.LinkWhereInput =
    options?.category === undefined
      ? {}
      : Array.isArray(options.category)
        ? { category: { in: options.category } }
        : { category: options.category };

  const where: Prisma.LinkWhereInput = {
    userId,
    ...ACTIVE,
    ...categoryFilter,
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { notes: { contains: q, mode: "insensitive" as const } },
            { url: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.link.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.link.count({ where }),
  ]);

  return { items, page, pageSize, total };
}

export async function getLink(id: string, userId: string): Promise<LinkRecord> {
  const link = await prisma.link.findFirst({
    where: { id, userId, ...ACTIVE },
  });
  if (!link) throw NotFound("Link not found");
  return link;
}

export async function createLink(userId: string, data: LinkCreateInput) {
  const validated = linkCreateSchema.parse(data);
  return prisma.link.create({
    data: {
      userId,
      title: validated.title,
      url: validated.url,
      category: validated.category,
      notes: validated.notes ?? null,
    },
  });
}

export async function updateLink(id: string, userId: string, data: LinkUpdateInput) {
  const validated = linkUpdateSchema.parse(data);
  const result = await prisma.link.updateMany({
    where: { id, userId, ...ACTIVE },
    data: {
      ...(validated.title !== undefined ? { title: validated.title } : {}),
      ...(validated.url !== undefined ? { url: validated.url } : {}),
      ...(validated.category !== undefined ? { category: validated.category } : {}),
      ...(validated.notes !== undefined ? { notes: validated.notes } : {}),
    },
  });
  if (result.count === 0) throw NotFound("Link not found");
  return prisma.link.findUniqueOrThrow({ where: { id } });
}

export async function deleteLink(id: string, userId: string) {
  const now = new Date();
  const result = await prisma.link.updateMany({
    where: { id, userId, ...ACTIVE },
    data: { deletedAt: now },
  });
  if (result.count === 0) throw NotFound("Link not found");
  return { success: true };
}
```

- [ ] **Étape 4 : Vérifier que le test passe**

```bash
npx vitest run src/tests/integration/api/links-category-filter.test.ts
```

Résultat attendu : PASS

- [ ] **Étape 5 : Commit**

```bash
git add src/lib/services/back/links.ts src/tests/integration/api/links-category-filter.test.ts
git commit -m "feat: getLinks supports multi-category filter"
```

---

## Task 4 : Back service — opportunity-actions (linkId + stats)

**Files:**
- Modify: `src/lib/services/back/opportunity-actions.ts`

- [ ] **Étape 1 : Ajouter `link` à la définition de type `OpportunityActionWithOpportunity`**

Au début de `src/lib/services/back/opportunity-actions.ts`, mettre à jour le type `OpportunityActionWithOpportunity` (lignes 29-94) pour inclure `link` :

```typescript
type OpportunityActionWithOpportunity = Prisma.OpportunityActionGetPayload<{
  include: {
    contactChannel: {
      select: { id: true; value: true; label: true };
    };
    participants: {
      include: {
        contact: {
          select: { id: true; firstName: true; lastName: true };
        };
      };
    };
    documents: {
      include: {
        document: {
          select: {
            id: true;
            title: true;
            originalName: true;
            mimeType: true;
            size: true;
          };
        };
      };
    };
    workOpportunity: {
      select: {
        id: true;
        title: true;
        company: { select: { id: true; name: true } };
      };
    };
    company: { select: { id: true; name: true } };
    contact: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
        company: { select: { id: true; name: true } };
      };
    };
    link: { select: { id: true; title: true } };
  };
}>;
```

- [ ] **Étape 2 : Créer un objet d'include partagé pour éviter la répétition**

Juste après les définitions de types, ajouter :

```typescript
const ACTION_FULL_INCLUDE = {
  contactChannel: { select: { id: true, value: true, label: true } },
  participants: {
    include: {
      contact: { select: { id: true, firstName: true, lastName: true } },
    },
  },
  documents: {
    include: {
      document: {
        select: { id: true, title: true, originalName: true, mimeType: true, size: true },
      },
    },
  },
  workOpportunity: {
    select: {
      id: true,
      title: true,
      company: { select: { id: true, name: true } },
    },
  },
  company: { select: { id: true, name: true } },
  contact: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      company: { select: { id: true, name: true } },
    },
  },
  link: { select: { id: true, title: true } },
} as const;
```

- [ ] **Étape 3 : Remplacer tous les blocs `include` répétés dans `getRecentOpportunityActions`, `getAllActions`, `getOpportunityActionById`, `createOpportunityAction`**

Pour chaque fonction, remplacer le bloc `include: { contactChannel: ..., participants: ..., documents: ..., ... }` par `include: ACTION_FULL_INCLUDE`.

Exemple pour `getRecentOpportunityActions` :
```typescript
const actions = await prisma.opportunityAction.findMany({
  where: { userId },
  include: ACTION_FULL_INCLUDE,
  orderBy: { occurredAt: "desc" },
  take: limit,
});
```

Même chose pour `getAllActions`, `getOpportunityActionById`.

Pour `createOpportunityAction`, remplacer le bloc `include` dans `prisma.opportunityAction.create` par `include: ACTION_FULL_INCLUDE`.

- [ ] **Étape 4 : Mettre à jour `createOpportunityAction` pour passer `linkId`**

Dans la fonction `createOpportunityAction`, extraire `linkId` des données :

```typescript
export async function createOpportunityAction(
  userId: string,
  data: OpportunityActionCreateInput & {
    workOpportunityId?: string;
    companyId?: string;
    contactId?: string;
  }
): Promise<OpportunityActionWithOpportunity> {
  const { participantContactIds, workOpportunityId, companyId, contactId, linkId, ...actionData } = data;

  const { metadata, ...restActionData } = actionData;
  const action = await prisma.opportunityAction.create({
    data: {
      ...restActionData,
      ...(metadata !== undefined ? { metadata: metadata as Prisma.InputJsonValue } : {}),
      userId,
      workOpportunityId: workOpportunityId ?? undefined,
      companyId: companyId ?? undefined,
      contactId: contactId ?? undefined,
      linkId: linkId ?? undefined,
      participants:
        participantContactIds && participantContactIds.length > 0
          ? { create: participantContactIds.map((id) => ({ contactId: id })) }
          : undefined,
    } as Prisma.OpportunityActionUncheckedCreateInput,
    include: ACTION_FULL_INCLUDE,
  });

  await markOpportunityApplied(userId, data.type, workOpportunityId);

  return action as OpportunityActionWithOpportunity;
}
```

- [ ] **Étape 5 : Mettre à jour `updateOpportunityAction` pour gérer `linkId`**

Dans `updateOpportunityAction`, extraire `linkId` et l'inclure dans `updateData` :

```typescript
const { metadata, workOpportunityId, companyId, contactId, linkId, ...restActionData } = actionData;
const updateData: Prisma.OpportunityActionUncheckedUpdateInput = {
  ...restActionData,
  ...(metadata !== undefined ? { metadata: metadata as Prisma.InputJsonValue } : {}),
  ...(workOpportunityId !== undefined ? { workOpportunityId } : {}),
  ...(companyId !== undefined ? { companyId } : {}),
  ...(contactId !== undefined ? { contactId } : {}),
  ...(linkId !== undefined ? { linkId } : {}),
};
```

- [ ] **Étape 6 : Ajouter la fonction `getApplicationsByJobboard`**

À la fin de `src/lib/services/back/opportunity-actions.ts`, ajouter :

```typescript
export type JobboardStat = {
  linkId: string | null;
  linkTitle: string | null;
  count: number;
};

export async function getApplicationsByJobboard(userId: string): Promise<JobboardStat[]> {
  const groups = await prisma.opportunityAction.groupBy({
    by: ["linkId"],
    _count: { _all: true },
    where: { userId, type: "APPLIED" },
  });

  const linkIds = groups
    .map((g) => g.linkId)
    .filter((id): id is string => id !== null);

  const links = linkIds.length > 0
    ? await prisma.link.findMany({
        where: { id: { in: linkIds } },
        select: { id: true, title: true },
      })
    : [];

  const linkMap = new Map(links.map((l) => [l.id, l.title]));

  return groups.map((g) => ({
    linkId: g.linkId,
    linkTitle: g.linkId ? (linkMap.get(g.linkId) ?? null) : null,
    count: g._count._all,
  }));
}
```

- [ ] **Étape 7 : Vérifier la compilation TypeScript**

```bash
cd /home/ycakir/jobtrack && npx tsc --noEmit 2>&1 | head -30
```

Résultat attendu : aucune erreur liée aux fichiers modifiés

- [ ] **Étape 8 : Commit**

```bash
git add src/lib/services/back/opportunity-actions.ts
git commit -m "feat: add linkId support and getApplicationsByJobboard to opportunity-actions service"
```

---

## Task 5 : Back service — opportunities (sourceLinkId)

**Files:**
- Modify: `src/lib/services/back/opportunities.ts`

- [ ] **Étape 1 : Mettre à jour le type `OpportunityWithRelations` et les includes**

Dans `src/lib/services/back/opportunities.ts`, mettre à jour `OpportunityWithRelations` :

```typescript
type OpportunityWithRelations = Prisma.WorkOpportunityGetPayload<{
  include: {
    company: true;
    entretiens: {
      include: { contacts: true; contactChannel: true };
    };
    sourceLink: { select: { id: true; title: true } };
  };
}>;
```

- [ ] **Étape 2 : Mettre à jour `getOpportunities` pour inclure `sourceLink`**

```typescript
export async function getOpportunities(
  userId: string,
  options?: { page?: number; pageSize?: number; q?: string; status?: string }
) {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 10;
  const where: Prisma.WorkOpportunityWhereInput = {
    userId,
    ...ACTIVE,
    ...(options?.q ? { title: { contains: options.q, mode: "insensitive" } } : {}),
    ...(options?.status ? { status: options.status as WorkOpportunityStatus } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.workOpportunity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        company: { select: { id: true, name: true } },
        sourceLink: { select: { id: true, title: true } },
      },
    }),
    prisma.workOpportunity.count({ where }),
  ]);
  return { items, page, pageSize, total };
}
```

- [ ] **Étape 3 : Mettre à jour `getAllOpportunitiesForExport`**

```typescript
export async function getAllOpportunitiesForExport(userId: string) {
  return prisma.workOpportunity.findMany({
    where: { userId, ...ACTIVE },
    include: {
      company: { select: { id: true, name: true } },
      sourceLink: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
```

- [ ] **Étape 4 : Mettre à jour `getOpportunity`**

```typescript
export async function getOpportunity(id: string, userId: string): Promise<OpportunityWithRelations | null> {
  const opp = await prisma.workOpportunity.findFirst({
    where: { id, userId, ...ACTIVE },
    include: {
      company: true,
      entretiens: {
        include: { contacts: true, contactChannel: true },
        orderBy: { date: "desc" },
      },
      sourceLink: { select: { id: true, title: true } },
    },
  });
  return opp ?? null;
}
```

- [ ] **Étape 5 : Mettre à jour `createOpportunity` pour passer `sourceLinkId`**

```typescript
export async function createOpportunity(userId: string, data: OpportunityCreateInput) {
  const validatedData = opportunityCreateSchema.parse(data);
  if (validatedData.companyId) {
    const company = await prisma.company.findFirst({
      where: { id: validatedData.companyId, userId, ...ACTIVE },
    });
    if (!company) throw NotFound("Company not found");
  }
  return prisma.workOpportunity.create({
    data: { ...validatedData, userId },
    include: {
      company: { select: { id: true, name: true } },
      sourceLink: { select: { id: true, title: true } },
    },
  });
}
```

- [ ] **Étape 6 : Mettre à jour `updateOpportunity` pour gérer `sourceLinkId`**

```typescript
export async function updateOpportunity(id: string, userId: string, data: OpportunityUpdateInput) {
  const validatedData = opportunityUpdateSchema.parse(data);
  if (validatedData.companyId) {
    const company = await prisma.company.findFirst({
      where: { id: validatedData.companyId, userId, ...ACTIVE },
    });
    if (!company) throw NotFound("Company not found");
  }
  return prisma.workOpportunity.update({
    where: { id, userId },
    data: validatedData,
    include: {
      company: { select: { id: true, name: true } },
      sourceLink: { select: { id: true, title: true } },
    },
  });
}
```

- [ ] **Étape 7 : Vérifier la compilation TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Étape 8 : Commit**

```bash
git add src/lib/services/back/opportunities.ts
git commit -m "feat: add sourceLinkId support and sourceLink include to opportunities service"
```

---

## Task 6 : API routes — links, actions, opportunities, dashboard

**Files:**
- Modify: `src/app/api/links/route.ts`
- Modify: `src/app/api/actions/route.ts`
- Modify: `src/app/api/actions/[actionId]/route.ts`
- Modify: `src/app/api/dashboard/overview/route.ts`

- [ ] **Étape 1 : Mettre à jour `src/app/api/links/route.ts`**

```typescript
import { jsonCreated, jsonOk } from "@/lib/errors/response";
import { handleRouteError, requireJson, requireUserId } from "@/lib/api-helpers";
import { linkListQuerySchema } from "@/lib/validators/link";
import { createLink, getLinks } from "@/lib/services/back/links";
import type { LinkCategory } from "@prisma/client";

function parseLinkListQuery(req: Request) {
  const { searchParams } = new URL(req.url);
  const categoryValues = searchParams.getAll("category") as LinkCategory[];
  const category =
    categoryValues.length === 1
      ? categoryValues[0]
      : categoryValues.length > 1
        ? categoryValues
        : undefined;
  return linkListQuerySchema.parse({
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    category,
  });
}

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const { page, pageSize, q, category } = parseLinkListQuery(req);
    const result = await getLinks(userId, { page, pageSize, q, category });
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
    const link = await createLink(userId, body);
    return jsonCreated(link);
  } catch (error) {
    return handleRouteError(error);
  }
}
```

- [ ] **Étape 2 : Mettre à jour `actionToDto` dans `src/app/api/actions/route.ts`**

Dans la fonction `actionToDto`, ajouter `linkId` au type d'entrée et au retour :

```typescript
export function actionToDto(action: {
  // ... tous les champs existants ...
  linkId?: string | null;
  link?: { id: string; title: string } | null;
  // ... autres champs existants ...
}) {
  return {
    // ... tous les champs existants ...
    linkId: action.linkId ?? null,
    link: action.link ? { id: action.link.id, title: action.link.title } : undefined,
  };
}
```

Plus précisément, modifier uniquement les parties concernées de la fonction existante. Ajouter `linkId?: string | null;` et `link?: { id: string; title: string } | null;` dans le type du paramètre, et dans le return ajouter :

```typescript
linkId: action.linkId ?? null,
link: action.link ? { id: action.link.id, title: action.link.title } : undefined,
```

- [ ] **Étape 3 : Mettre à jour le POST dans `src/app/api/actions/route.ts`**

Dans le handler POST, ajouter `linkId` au passage à `createOpportunityAction`. Remplacer uniquement le bloc de création (ligne 178-183) :

```typescript
    const action = await createOpportunityAction(userId, {
      ...validatedData,
      workOpportunityId: validatedData.workOpportunityId ?? undefined,
      companyId: validatedData.companyId ?? undefined,
      contactId: validatedData.contactId ?? undefined,
      linkId: validatedData.linkId ?? undefined,
    });
```

Les vérifications company/contact/contactChannel/participants en amont (lignes 136-176) restent identiques — ne pas les toucher.

- [ ] **Étape 4 : Mettre à jour le PATCH dans `src/app/api/actions/[actionId]/route.ts`**

Dans `updateOpportunityAction`, `linkId` est déjà géré via le spread de `validatedData` (Task 4, étape 5). Vérifier que `validatedData` inclut bien `linkId` (il l'a maintenant via le validator mis à jour). Aucune modification supplémentaire du PATCH handler n'est nécessaire.

- [ ] **Étape 5 : Ajouter les stats jobboard au dashboard**

Dans `src/app/api/dashboard/overview/route.ts`, ajouter l'import et la requête :

En haut du fichier, ajouter l'import :
```typescript
import { getRecentOpportunityActions, getApplicationsByJobboard } from "@/lib/services/back/opportunity-actions";
```

Dans le `Promise.all`, ajouter l'appel :
```typescript
const [
  [companies, contacts, opportunities, entretiens, actionsTotal, actionsLast30Days],
  actionsByType,
  recentActions,
  opportunitiesByStatus,
  upcomingFollowUps,
  applicationsByJobboard,
] = await Promise.all([
  prisma.$transaction([/* ... identique ... */]),
  prisma.opportunityAction.groupBy(/* ... identique ... */),
  getRecentOpportunityActions(userId, 20),
  prisma.workOpportunity.groupBy(/* ... identique ... */),
  prisma.workOpportunity.findMany(/* ... identique ... */),
  getApplicationsByJobboard(userId),
]);
```

Dans l'objet `stats` retourné, ajouter :
```typescript
const stats = {
  // ... champs existants ...
  applicationsByJobboard,
};
```

Et dans le return `jsonOk({ stats, recentActions: recent })`, `applicationsByJobboard` est maintenant inclus dans `stats`.

- [ ] **Étape 6 : Mettre à jour le type `DashboardStats` dans `src/lib/services/front/dashboard.service.ts`**

```typescript
type DashboardStats = {
  companies: number;
  contacts: number;
  opportunities: number;
  entretiens: number;
  actionsTotal: number;
  actionsLast30Days: number;
  actionsByType: Array<{ type: OpportunityActionType; count: number }>;
  opportunitiesByStatus: Array<{ status: WorkOpportunityStatus; count: number }>;
  upcomingFollowUps: Array<{
    id: string;
    title: string;
    status: WorkOpportunityStatus;
    followUpAt: string;
    isOverdue: boolean;
  }>;
  applicationsByJobboard: Array<{
    linkId: string | null;
    linkTitle: string | null;
    count: number;
  }>;
};
```

- [ ] **Étape 7 : Vérifier la compilation TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Étape 8 : Commit**

```bash
git add src/app/api/links/route.ts src/app/api/actions/route.ts src/app/api/actions/[actionId]/route.ts src/app/api/dashboard/overview/route.ts src/lib/services/front/dashboard.service.ts
git commit -m "feat: update API routes and dashboard to include jobboard data"
```

---

## Task 7 : Front service — jobboard.service.ts

**Files:**
- Create: `src/lib/services/front/jobboard.service.ts`

- [ ] **Étape 1 : Créer `src/lib/services/front/jobboard.service.ts`**

```typescript
import type { LinkDTO, LinkListDTO } from "@/lib/dto/link";
import { frontFetchJson } from "./abstract-crus.service";

export type JobboardOption = {
  id: string;
  title: string;
};

export async function listJobboards(): Promise<JobboardOption[]> {
  const result = await frontFetchJson<LinkListDTO>("/api/links?category=JOBBOARD&pageSize=100");
  return result.items.map((link: LinkDTO) => ({ id: link.id, title: link.title }));
}
```

- [ ] **Étape 2 : Commit**

```bash
git add src/lib/services/front/jobboard.service.ts
git commit -m "feat: add jobboard front service"
```

---

## Task 8 : Page Jobboards (nouvelle page)

**Files:**
- Create: `src/app/(app)/jobboards/page.tsx`
- Create: `src/app/(app)/jobboards/JobboardsPageClient.tsx`

- [ ] **Étape 1 : Créer `src/app/(app)/jobboards/page.tsx`**

```typescript
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getLinks } from "@/lib/services/back/links";
import { getApplicationsByJobboard } from "@/lib/services/back/opportunity-actions";
import { serializeLinkListFromDb } from "@/lib/mappers/link";
import JobboardsPageClient from "./JobboardsPageClient";

export const dynamic = "force-dynamic";

export default async function JobboardsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [listRaw, stats] = await Promise.all([
    getLinks(session.user.id, { page: 1, pageSize: 20, category: "JOBBOARD" }),
    getApplicationsByJobboard(session.user.id),
  ]);
  const initialList = serializeLinkListFromDb(listRaw);
  const applicationCounts = Object.fromEntries(
    stats.map((s) => [s.linkId ?? "", s.count])
  );

  return <JobboardsPageClient initialList={initialList} applicationCounts={applicationCounts} />;
}
```

- [ ] **Étape 2 : Créer `src/app/(app)/jobboards/JobboardsPageClient.tsx`**

Copier `src/app/(app)/links/LinksPageClient.tsx` et appliquer les modifications suivantes :

1. Retirer `CATEGORY_OPTIONS` — la catégorie est fixée à `JOBBOARD`
2. Retirer le sélecteur de catégorie dans le formulaire de création
3. Fixer `category: "JOBBOARD"` dans `emptyForm()` et dans les appels `linkService.list()`
4. Adapter les labels (titre de la page "Jobboards", bouton "Nouveau jobboard", etc.)
5. Retirer le filtre de catégorie dans la barre de recherche (les jobboards sont tous de catégorie JOBBOARD)

```typescript
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { pushToast } from "@/components/common/Toast";
import type { LinkDTO, LinkListDTO } from "@/lib/dto/link";
import linkService from "@/lib/services/front/link.service";

const PAGE_SIZE = 20;

type Props = {
  initialList: LinkListDTO;
  applicationCounts: Record<string, number>;
};

type FormState = {
  title: string;
  url: string;
  notes: string;
};

const emptyForm = (): FormState => ({
  title: "",
  url: "https://",
  notes: "",
});

export default function JobboardsPageClient({ initialList, applicationCounts }: Props) {
  const [list, setList] = useState<LinkListDTO>(initialList);
  const [page, setPage] = useState(initialList.page);
  const [loading, setLoading] = useState(false);
  const [qInput, setQInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LinkDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(qInput.trim()), 350);
    return () => clearTimeout(t);
  }, [qInput]);

  const load = useCallback(
    async (p: number, q: string) => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setLoading(true);
      try {
        const result = await linkService.list({ page: p, pageSize: PAGE_SIZE, q: q || undefined, category: "JOBBOARD" });
        setList(result);
        setPage(p);
      } catch {
        // ignore abort
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    load(1, debouncedQ);
  }, [debouncedQ, load]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setModalOpen(true);
  }

  function openEdit(link: LinkDTO) {
    setEditingId(link.id);
    setForm({ title: link.title, url: link.url, notes: link.notes ?? "" });
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { title: form.title, url: form.url, notes: form.notes || undefined, category: "JOBBOARD" };
      if (editingId) {
        await linkService.updateLink(editingId, payload);
        pushToast({ type: "success", title: "Jobboard mis à jour" });
      } else {
        await linkService.createLink(payload);
        pushToast({ type: "success", title: "Jobboard créé" });
      }
      setModalOpen(false);
      load(page, debouncedQ);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      pushToast({ type: "error", title: "Erreur", description: msg });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await linkService.remove(deleteTarget.id);
      pushToast({ type: "success", title: "Jobboard supprimé" });
      setDeleteTarget(null);
      load(page, debouncedQ);
    } catch {
      pushToast({ type: "error", title: "Erreur lors de la suppression" });
    } finally {
      setDeleting(false);
    }
  }

  const totalPages = Math.ceil(list.total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Jobboards</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Plateformes d&apos;emploi que vous utilisez.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          + Nouveau jobboard
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type="search"
          placeholder="Rechercher…"
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          className="w-full max-w-xs rounded border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>

      {loading ? (
        <p className="text-sm text-neutral-400">Chargement…</p>
      ) : list.items.length === 0 ? (
        <p className="text-sm text-neutral-400">Aucun jobboard. Cliquez sur « Nouveau jobboard » pour en ajouter un.</p>
      ) : (
        <div className="divide-y divide-neutral-200 rounded border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {list.items.map((link) => (
            <div key={link.id} className="flex items-center justify-between p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    {link.title}
                  </a>
                  {(applicationCounts[link.id] ?? 0) > 0 && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      {applicationCounts[link.id]} candidature{applicationCounts[link.id] > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-neutral-400">{link.url}</p>
                {link.notes && <p className="text-xs text-neutral-500">{link.notes}</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => openEdit(link)}
                  className="rounded px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Modifier
                </button>
                <button
                  onClick={() => setDeleteTarget(link)}
                  className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => load(page - 1, debouncedQ)}
            className="rounded border px-3 py-1 text-sm disabled:opacity-40"
          >
            Précédent
          </button>
          <span className="py-1 text-sm text-neutral-500">
            Page {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => load(page + 1, debouncedQ)}
            className="rounded border px-3 py-1 text-sm disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-900">
            <h2 className="mb-4 text-lg font-semibold">
              {editingId ? "Modifier le jobboard" : "Nouveau jobboard"}
            </h2>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Nom</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">URL</label>
                <input
                  type="url"
                  required
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Notes (optionnel)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Supprimer ce jobboard ?"
        description={`"${deleteTarget?.title}" sera supprimé définitivement.`}
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
```

- [ ] **Étape 3 : Vérifier que la page est accessible**

```bash
npm run dev &
# Ouvrir http://localhost:3000/jobboards dans le navigateur
```

- [ ] **Étape 4 : Commit**

```bash
git add src/app/(app)/jobboards/
git commit -m "feat: add Jobboards page"
```

---

## Task 9 : Cleanup page Liens + sidebar

**Files:**
- Modify: `src/app/(app)/links/LinksPageClient.tsx`
- Modify: `src/app/(app)/links/page.tsx`
- Modify: `src/components/layout/sidebar.tsx`

- [ ] **Étape 1 : Retirer JOBBOARD de `LinksPageClient`**

Dans `src/app/(app)/links/LinksPageClient.tsx` :

1. Retirer `{ value: "JOBBOARD" as const, label: "Jobboards" }` de `CATEGORY_OPTIONS`
2. Dans `emptyForm()`, changer `category: "OTHER"` (garder tel quel)
3. Changer le filtre initial par défaut : `CATEGORY_OPTIONS` ne contient plus que `ALL`, `TOOL`, `NETWORK`, `OTHER`

```typescript
const CATEGORY_OPTIONS = [
  { value: "ALL" as const, label: "Toutes" },
  { value: "TOOL" as const, label: "Outils" },
  { value: "NETWORK" as const, label: "Réseaux" },
  { value: "OTHER" as const, label: "Autres" },
] as const;
```

4. Dans la fonction `load`, quand `category === "ALL"`, passer les catégories non-JOBBOARD :

```typescript
const load = useCallback(
  async (p: number, q: string, cat: typeof category) => {
    // ...
    const categoryFilter =
      cat === "ALL"
        ? undefined
        : cat;
    // Appel uniquement sur les catégories non-JOBBOARD
    const result = await linkService.list({
      page: p,
      pageSize: PAGE_SIZE,
      q: q || undefined,
      category: categoryFilter,
    });
    // ...
  },
  []
);
```

Mais comme l'API reçoit maintenant plusieurs catégories, on peut aussi laisser le filtre `ALL` tel quel et se contenter de retirer JOBBOARD des options de création. Les links JOBBOARD existants n'apparaîtront plus dans les options car ils ont maintenant leur propre page — mais pourraient encore apparaître dans le listing `ALL`. Pour éviter ça, modifier le `load` quand `cat === "ALL"` pour exclure JOBBOARD :

Note : l'approche la plus propre est de créer un paramètre `excludeCategory` dans l'API, mais c'est de la complexité inutile. La meilleure approche simple : dans la page `/links`, toujours passer `category=TOOL&category=NETWORK&category=OTHER` quand `cat === "ALL"`, en utilisant l'API de plusieurs catégories.

Modifier la fonction `load` dans `LinksPageClient.tsx` :

```typescript
const load = useCallback(
  async (p: number, q: string, cat: (typeof CATEGORY_OPTIONS)[number]["value"]) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      // Quand "ALL", on liste TOOL+NETWORK+OTHER (pas JOBBOARD)
      const categoryParam =
        cat === "ALL"
          ? (["TOOL", "NETWORK", "OTHER"] as const)
          : cat;
      const url = buildLinksUrl(p, q, categoryParam);
      const result = await frontFetchJson<LinkListDTO>(url);
      setList(result);
      setPage(p);
    } catch {
      // ignore abort
    } finally {
      setLoading(false);
    }
  },
  []
);
```

Ajouter la fonction `buildLinksUrl` au début du fichier :

```typescript
function buildLinksUrl(
  page: number,
  q: string,
  category: "TOOL" | "NETWORK" | "OTHER" | readonly ["TOOL", "NETWORK", "OTHER"]
): string {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", String(PAGE_SIZE));
  if (q) params.set("q", q);
  if (Array.isArray(category)) {
    (category as string[]).forEach((c) => params.append("category", c));
  } else {
    params.set("category", category as string);
  }
  return `/api/links?${params.toString()}`;
}
```

Ajouter l'import `frontFetchJson` depuis le service. En fait, il vaut mieux utiliser directement `linkService.list` avec le bon type. Mettre à jour `link.service.ts` pour accepter un tableau de catégories :

Dans `src/lib/services/front/link.service.ts`, modifier `LinkListFilters` :

```typescript
export type LinkCategoryFilter = "JOBBOARD" | "TOOL" | "NETWORK" | "OTHER";

export type LinkListFilters = {
  page?: number;
  pageSize?: number;
  q?: string;
  category?: LinkCategoryFilter | LinkCategoryFilter[];
};

function buildListUrl(filters?: LinkListFilters): string {
  const params = new URLSearchParams();
  if (!filters) return "/api/links";
  if (filters.page != null) params.set("page", String(filters.page));
  if (filters.pageSize != null) params.set("pageSize", String(filters.pageSize));
  if (filters.q?.trim()) params.set("q", filters.q.trim());
  if (filters.category) {
    if (Array.isArray(filters.category)) {
      filters.category.forEach((c) => params.append("category", c));
    } else {
      params.set("category", filters.category);
    }
  }
  const qs = params.toString();
  return qs ? `/api/links?${qs}` : "/api/links";
}
```

Puis dans `LinksPageClient.tsx`, modifier l'appel `load` pour utiliser `linkService.list` :

```typescript
const result = await linkService.list({
  page: p,
  pageSize: PAGE_SIZE,
  q: q || undefined,
  category: cat === "ALL" ? (["TOOL", "NETWORK", "OTHER"] as LinkCategoryFilter[]) : cat,
});
```

Importer `type { LinkCategoryFilter }` depuis `link.service.ts`.

- [ ] **Étape 2 : Mettre à jour `src/app/(app)/links/page.tsx`**

Passer le filtre initial pour exclure JOBBOARD :

```typescript
const listRaw = await getLinks(session.user.id, {
  page: 1,
  pageSize: 20,
  category: ["TOOL", "NETWORK", "OTHER"],
});
```

- [ ] **Étape 3 : Mettre à jour la sidebar**

Dans `src/components/layout/sidebar.tsx`, ajouter "Jobboards" avant "Liens" et décommenter la ligne :

```typescript
const navItems = [
  { href: "/", label: "Tableau de bord" },
  { href: "/companies", label: "Entreprises" },
  { href: "/contacts", label: "Contacts" },
  { href: "/opportunities", label: "Opportunités" },
  { href: "/jobboards", label: "Jobboards" },
  { href: "/links", label: "Liens" },
  { href: "/actions", label: "Actions" },
  { href: "/documents", label: "Documents" },
  { href: "/trash", label: "Corbeille" },
];
```

(Garder la ligne `// { href: "/entretiens/new", ... }` commentée telle quelle.)

- [ ] **Étape 4 : Vérifier visuellement**

```bash
# Vérifier que /links ne montre plus les jobboards
# Vérifier que /jobboards n'affiche que les jobboards
# Vérifier que la sidebar affiche les deux liens
```

- [ ] **Étape 5 : Commit**

```bash
git add src/app/(app)/links/ src/components/layout/sidebar.tsx src/lib/services/front/link.service.ts
git commit -m "feat: split Links/Jobboards pages, update sidebar"
```

---

## Task 10 : StandaloneActionForm — champ "Via" (linkId)

**Files:**
- Modify: `src/components/actions/StandaloneActionForm.tsx`

- [ ] **Étape 1 : Ajouter l'état `linkId` et `jobboards` au formulaire**

Dans les états du composant, ajouter :

```typescript
const [jobboards, setJobboards] = useState<Array<{ id: string; title: string }>>([]);
```

Dans `form` state initial (objet dans `useState`), ajouter :

```typescript
linkId: "" as string,
```

- [ ] **Étape 2 : Charger les jobboards à l'ouverture**

Dans le `useEffect` qui gère `open`, après `fetchChannelTypes().then(setChannelTypes)` :

```typescript
listJobboards().then(setJobboards).catch(() => {});
```

Ajouter l'import en haut du fichier :

```typescript
import { listJobboards } from "@/lib/services/front/jobboard.service";
```

- [ ] **Étape 3 : Initialiser `linkId` depuis `initialData` (mode édition)**

Dans la branche `if (initialData)` du useEffect :

```typescript
setForm({
  type: initialData.type,
  occurredAt: occurredAtLocal,
  notes: initialData.notes ?? "",
  channelTypeCode: initialData.channelTypeCode ?? "",
  contactId: initialData.contactId ?? "",
  companyId: initialData.companyId ?? "",
  workOpportunityId: initialData.workOpportunityId ?? "",
  participantContactIds: initialData.participants?.map((p) => p.contactId) ?? [],
  linkId: initialData.linkId ?? "",
});
```

- [ ] **Étape 4 : Réinitialiser `linkId` après soumission**

Dans la fonction `submit`, dans le `setForm({...})` après succès :

```typescript
setForm({
  type: "OUTBOUND_CONTACT",
  occurredAt: new Date().toISOString().slice(0, 16),
  notes: "",
  channelTypeCode: "",
  contactId: "",
  companyId: "",
  workOpportunityId: "",
  participantContactIds: [],
  linkId: "",
});
```

- [ ] **Étape 5 : Inclure `linkId` dans le payload de soumission**

Dans la fonction `submit`, dans l'objet `payload` :

```typescript
const payload = {
  type: form.type,
  occurredAt: new Date(form.occurredAt).toISOString(),
  notes: form.notes || undefined,
  channelTypeCode: form.channelTypeCode || undefined,
  contactId: form.contactId || null,
  companyId: form.companyId || null,
  workOpportunityId: form.workOpportunityId || null,
  participantContactIds:
    form.participantContactIds.length > 0 ? form.participantContactIds : undefined,
  linkId: form.linkId || null,
};
```

- [ ] **Étape 6 : Ajouter le champ dans le JSX, après le sélecteur "Canal"**

Après la `<div className="space-y-1">` du "Type de canal", ajouter :

```tsx
<div className="space-y-1">
  <label className="text-sm font-medium">Via (jobboard, optionnel)</label>
  <select
    className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
    value={form.linkId}
    onChange={(e) => setForm({ ...form, linkId: e.target.value })}
  >
    <option value="">Aucun</option>
    {jobboards.map((jb) => (
      <option key={jb.id} value={jb.id}>
        {jb.title}
      </option>
    ))}
  </select>
  {jobboards.length === 0 && (
    <a
      href="/jobboards"
      target="_blank"
      className="text-xs text-emerald-600 hover:underline dark:text-emerald-400"
    >
      Ajouter un jobboard →
    </a>
  )}
</div>
```

- [ ] **Étape 7 : Tester visuellement**

```bash
# Ouvrir le formulaire de création d'action
# Vérifier que le champ "Via" apparaît avec les jobboards
# Créer une action avec un jobboard sélectionné
# Vérifier en base que linkId est bien renseigné
```

- [ ] **Étape 8 : Commit**

```bash
git add src/components/actions/StandaloneActionForm.tsx src/lib/services/front/jobboard.service.ts
git commit -m "feat: add jobboard picker to StandaloneActionForm"
```

---

## Task 11 : Formulaires opportunité — champ "Vu sur" (sourceLinkId)

**Files:**
- Modify: `src/components/opportunities/OpportunityForm.tsx`
- Modify: `src/components/opportunities/OpportunityEditForm.tsx`

- [ ] **Étape 1 : Mettre à jour `OpportunityForm.tsx`**

1. Ajouter l'import :
```typescript
import { listJobboards } from "@/lib/services/front/jobboard.service";
```

2. Ajouter l'état :
```typescript
const [jobboards, setJobboards] = useState<Array<{ id: string; title: string }>>([]);
```

3. Dans `useEffect`, après `loadCompanies()` :
```typescript
listJobboards().then(setJobboards).catch(() => {});
```

4. Ajouter `sourceLinkId: ""` dans `form` state :
```typescript
const [form, setForm] = useState({
  title: "",
  description: "",
  sourceUrl: "",
  companyId: "",
  sourceLinkId: "",
});
```

5. Dans `submit`, ajouter au payload :
```typescript
const created = await opportunityService.create<WorkOpportunityDTO>({
  title: form.title,
  description: form.description || undefined,
  sourceUrl: form.sourceUrl || undefined,
  companyId: form.companyId || undefined,
  sourceLinkId: form.sourceLinkId || undefined,
});
```

6. Réinitialiser après succès : `setForm({ title: "", description: "", sourceUrl: "", companyId: "", sourceLinkId: "" })`

7. Ajouter le champ dans le JSX après le champ `sourceUrl` :
```tsx
<div className="space-y-1">
  <label className="text-sm font-medium">Vu sur (optionnel)</label>
  <select
    className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
    value={form.sourceLinkId}
    onChange={(e) => setForm({ ...form, sourceLinkId: e.target.value })}
  >
    <option value="">Sélectionner (optionnel)</option>
    {jobboards.map((jb) => (
      <option key={jb.id} value={jb.id}>
        {jb.title}
      </option>
    ))}
  </select>
</div>
```

- [ ] **Étape 2 : Mettre à jour `OpportunityEditForm.tsx`**

Mêmes ajouts que pour `OpportunityForm`. Dans l'état initial du formulaire, lire `opportunity.sourceLinkId` :

```typescript
const [form, setForm] = useState({
  title: opportunity.title,
  description: opportunity.description || "",
  sourceUrl: opportunity.sourceUrl || "",
  companyId: opportunity.companyId || "",
  status: opportunity.status || "SOURCING",
  followUpAt: toDatetimeLocal(opportunity.followUpAt),
  sourceLinkId: opportunity.sourceLinkId || "",
});
```

Dans l'`useEffect` qui sync depuis `opportunity` :
```typescript
setForm({
  title: opportunity.title,
  description: opportunity.description || "",
  sourceUrl: opportunity.sourceUrl || "",
  companyId: opportunity.companyId || "",
  status: opportunity.status || "SOURCING",
  followUpAt: toDatetimeLocal(opportunity.followUpAt),
  sourceLinkId: opportunity.sourceLinkId || "",
});
```

Dans `submit` :
```typescript
const data = await opportunityService.update<WorkOpportunityDTO>(opportunity.id, {
  title: form.title,
  description: form.description || undefined,
  sourceUrl: form.sourceUrl ? form.sourceUrl : null,
  companyId: form.companyId || undefined,
  status: form.status,
  followUpAt: form.followUpAt ? new Date(form.followUpAt).toISOString() : null,
  sourceLinkId: form.sourceLinkId || null,
});
```

- [ ] **Étape 3 : Commit**

```bash
git add src/components/opportunities/OpportunityForm.tsx src/components/opportunities/OpportunityEditForm.tsx
git commit -m "feat: add sourceLinkId picker to opportunity forms"
```

---

## Task 12 : Listes et widget dashboard

**Files:**
- Modify: `src/components/actions/ActionsListClient.tsx`
- Modify: `src/components/opportunities/OpportunitiesTable.tsx`
- Modify: `src/app/(app)/page.tsx`

- [ ] **Étape 1 : Ajouter le badge "Via" dans `ActionsListClient.tsx`**

Dans le rendu de chaque action (après le badge `contactChannel`), ajouter :

```tsx
{action.link && (
  <span className="rounded bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800">
    Via : {action.link.title}
  </span>
)}
```

(Chercher le bloc `<div className="flex flex-wrap gap-3 text-xs text-neutral-600 dark:text-neutral-400">` qui contient les badges `contactChannel` et `participants`, et ajouter ce span à l'intérieur.)

- [ ] **Étape 2 : Ajouter le badge "Vu sur" dans `OpportunitiesTable.tsx`**

Dans le rendu de chaque ligne d'opportunité, ajouter après le titre ou la colonne entreprise :

```tsx
{opp.sourceLink && (
  <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
    Vu sur : {opp.sourceLink.title}
  </span>
)}
```

Le type `WorkOpportunityDTO` inclut maintenant `sourceLink`. Adapter la position du badge selon le layout existant de `OpportunitiesTable`.

- [ ] **Étape 3 : Ajouter le widget "Candidatures par plateforme" dans `src/app/(app)/page.tsx`**

Le dashboard appelle déjà `getDashboardOverview()`. `stats.applicationsByJobboard` est maintenant disponible.

Dans la section de droite (après "Relances à venir"), ajouter un nouveau bloc :

```tsx
{stats.applicationsByJobboard && stats.applicationsByJobboard.length > 0 && (
  <div className="card space-y-3">
    <div>
      <h3 className="text-lg font-semibold">Candidatures par plateforme</h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Actions « Candidature » groupées par jobboard.
      </p>
    </div>
    <div className="space-y-2">
      {stats.applicationsByJobboard.map((item) => (
        <div
          key={item.linkId ?? "none"}
          className="flex items-center justify-between text-sm"
        >
          <span className="text-neutral-700 dark:text-neutral-300">
            {item.linkTitle ?? "Sans plateforme"}
          </span>
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            {item.count}
          </span>
        </div>
      ))}
    </div>
  </div>
)}
```

- [ ] **Étape 4 : Vérifier visuellement**

```bash
# Ouvrir le tableau de bord → vérifier le widget "Candidatures par plateforme"
# Ouvrir la liste des actions → vérifier le badge "Via"
# Ouvrir la liste des opportunités → vérifier le badge "Vu sur"
```

- [ ] **Étape 5 : Vérifier la compilation TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Résultat attendu : aucune erreur

- [ ] **Étape 6 : Lancer les tests**

```bash
npm run test
```

Résultat attendu : tous les tests passent

- [ ] **Étape 7 : Commit final**

```bash
git add src/components/actions/ActionsListClient.tsx src/components/opportunities/OpportunitiesTable.tsx src/app/(app)/page.tsx
git commit -m "feat: add jobboard badges to lists and dashboard widget"
```
