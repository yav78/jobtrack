# concernedCompanyId — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un champ `concernedCompanyId` nullable sur `WorkOpportunity` pour lier une entreprise "client final" distincte de l'ESN qui poste l'offre.

**Architecture:** Nouveau champ FK nullable sur le modèle Prisma, propagé jusqu'au DTO, aux validators Zod, aux services back, puis aux deux formulaires (création/édition) et à l'affichage en mode lecture.

**Tech Stack:** Prisma (PostgreSQL), Zod, Next.js App Router, React, TailwindCSS, Vitest

---

## Fichiers modifiés

| Fichier | Rôle |
|---|---|
| `prisma/schema.prisma` | Ajout champ + relation |
| `src/lib/dto/opportunity.ts` | Ajout champs DTO |
| `src/lib/validators/opportunity.ts` | Ajout dans create/update schemas |
| `src/lib/services/back/opportunities.ts` | Include concernedCompany dans toutes les queries + validation |
| `src/components/opportunities/OpportunityForm.tsx` | Select concernedCompanyId (création) |
| `src/components/opportunities/OpportunityEditForm.tsx` | Select concernedCompanyId (édition) |
| `src/components/opportunities/OpportunityEditClient.tsx` | Affichage client final en lecture |
| `src/tests/integration/api/opportunities.test.ts` | Tests concernedCompanyId |

---

## Task 1 : Schéma Prisma + migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Ajouter le champ et la relation dans `prisma/schema.prisma`**

Dans `model WorkOpportunity`, après la ligne `sourceLinkId`:
```prisma
concernedCompanyId String?               @db.Uuid
```

Après la ligne `sourceLink   Link? ...`:
```prisma
concernedCompany   Company?              @relation("OpportunityConcernedCompany", fields: [concernedCompanyId], references: [id])
```

Après la ligne `@@index([sourceLinkId])`:
```prisma
@@index([concernedCompanyId])
```

Dans `model Company`, ajouter à la fin des relations (avant la fermeture `}`):
```prisma
concernedOpportunities WorkOpportunity[] @relation("OpportunityConcernedCompany")
```

- [ ] **Générer et appliquer la migration**

```bash
npx prisma migrate dev --name add_concerned_company_to_opportunity
```

Résultat attendu : `Your database is now in sync with your schema.`

- [ ] **Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add concernedCompanyId to WorkOpportunity schema"
```

---

## Task 2 : DTO + Validators

**Files:**
- Modify: `src/lib/dto/opportunity.ts`
- Modify: `src/lib/validators/opportunity.ts`

- [ ] **Mettre à jour `src/lib/dto/opportunity.ts`**

Ajouter après `companyId?: string | null;` :
```typescript
  concernedCompanyId?: string | null;
```

Ajouter après `company?: { id: string; name: string } | null;` :
```typescript
  concernedCompany?: { id: string; name: string } | null;
```

- [ ] **Mettre à jour `src/lib/validators/opportunity.ts`**

Dans `opportunityCreateSchema`, après `companyId: z.string().uuid().nullable().optional(),` :
```typescript
  concernedCompanyId: z.string().uuid().nullable().optional(),
```

Dans `opportunityUpdateSchema`, après `companyId: z.string().uuid().nullable().optional(),` :
```typescript
  concernedCompanyId: z.string().uuid().nullable().optional(),
```

- [ ] **Vérifier le typage**

```bash
npx tsc --noEmit
```

Résultat attendu : aucune erreur.

- [ ] **Commit**

```bash
git add src/lib/dto/opportunity.ts src/lib/validators/opportunity.ts
git commit -m "feat: add concernedCompanyId to opportunity DTO and validators"
```

---

## Task 3 : Service back

**Files:**
- Modify: `src/lib/services/back/opportunities.ts`

- [ ] **Ajouter `concernedCompany` dans tous les `include` Prisma**

Il y a 4 requêtes qui ont un `include` avec `company`. Pour chacune, ajouter `concernedCompany: { select: { id: true, name: true } }` à la suite de `company`.

Dans `getOpportunities` (le `findMany` et non le `count`) :
```typescript
include: {
  company: { select: { id: true, name: true } },
  concernedCompany: { select: { id: true, name: true } },
  sourceLink: { select: { id: true, title: true } },
},
```

Dans `getAllOpportunitiesForExport` :
```typescript
include: {
  company: { select: { id: true, name: true } },
  concernedCompany: { select: { id: true, name: true } },
  sourceLink: { select: { id: true, title: true } },
},
```

Dans `createOpportunity` :
```typescript
include: {
  company: { select: { id: true, name: true } },
  concernedCompany: { select: { id: true, name: true } },
  sourceLink: { select: { id: true, title: true } },
},
```

Dans `updateOpportunity` :
```typescript
include: {
  company: { select: { id: true, name: true } },
  concernedCompany: { select: { id: true, name: true } },
  sourceLink: { select: { id: true, title: true } },
},
```

- [ ] **Ajouter la validation de `concernedCompanyId` dans `createOpportunity`**

Après le bloc de validation de `companyId` dans `createOpportunity` :
```typescript
if (validatedData.concernedCompanyId) {
  const company = await prisma.company.findFirst({
    where: { id: validatedData.concernedCompanyId, userId, ...ACTIVE },
  });
  if (!company) throw NotFound("Concerned company not found");
}
```

- [ ] **Ajouter la validation de `concernedCompanyId` dans `updateOpportunity`**

Après le bloc de validation de `companyId` dans `updateOpportunity` :
```typescript
if (validatedData.concernedCompanyId) {
  const company = await prisma.company.findFirst({
    where: { id: validatedData.concernedCompanyId, userId, ...ACTIVE },
  });
  if (!company) throw NotFound("Concerned company not found");
}
```

- [ ] **Vérifier le typage**

```bash
npx tsc --noEmit
```

Résultat attendu : aucune erreur.

- [ ] **Commit**

```bash
git add src/lib/services/back/opportunities.ts
git commit -m "feat: include concernedCompany in opportunity queries and validate it"
```

---

## Task 4 : Tests d'intégration API

**Files:**
- Modify: `src/tests/integration/api/opportunities.test.ts`

- [ ] **Écrire un test de création avec `concernedCompanyId`**

Dans le fichier de test existant, ajouter un nouveau `describe` après les blocs existants :

```typescript
describe("concernedCompanyId", () => {
  let companyId: string;

  beforeAll(async () => {
    const company = await prisma.company.create({
      data: { name: "Client Final SA", userId },
    });
    companyId = company.id;
  });

  it("creates opportunity with concernedCompanyId and returns concernedCompany", async () => {
    const res = await postOpportunity(
      makeRequest("http://localhost/api/opportunities", "POST", {
        title: "Mission ESN",
        concernedCompanyId: companyId,
      })
    );
    expect(res.status).toBe(201);
    const opp = await res.json();
    expect(opp.concernedCompanyId).toBe(companyId);
    expect(opp.concernedCompany).toMatchObject({ id: companyId, name: "Client Final SA" });
  });

  it("updates concernedCompanyId via PATCH", async () => {
    const createRes = await postOpportunity(
      makeRequest("http://localhost/api/opportunities", "POST", { title: "Mission ESN 2" })
    );
    const opp = await createRes.json();

    const patchRes = await patchOpportunity(
      makeRequest(`http://localhost/api/opportunities/${opp.id}`, "PATCH", {
        concernedCompanyId: companyId,
      }),
      { params: Promise.resolve({ id: opp.id }) }
    );
    expect(patchRes.status).toBe(200);
    const updated = await patchRes.json();
    expect(updated.concernedCompany).toMatchObject({ id: companyId, name: "Client Final SA" });
  });

  it("clears concernedCompanyId by setting null", async () => {
    const createRes = await postOpportunity(
      makeRequest("http://localhost/api/opportunities", "POST", {
        title: "Mission ESN 3",
        concernedCompanyId: companyId,
      })
    );
    const opp = await createRes.json();

    const patchRes = await patchOpportunity(
      makeRequest(`http://localhost/api/opportunities/${opp.id}`, "PATCH", {
        concernedCompanyId: null,
      }),
      { params: Promise.resolve({ id: opp.id }) }
    );
    expect(patchRes.status).toBe(200);
    const updated = await patchRes.json();
    expect(updated.concernedCompanyId).toBeNull();
    expect(updated.concernedCompany).toBeFalsy();
  });
});
```

- [ ] **Lancer les tests**

```bash
npx vitest run src/tests/integration/api/opportunities.test.ts
```

Résultat attendu : tous les tests passent.

- [ ] **Commit**

```bash
git add src/tests/integration/api/opportunities.test.ts
git commit -m "test: add concernedCompanyId integration tests"
```

---

## Task 5 : Formulaire de création (`OpportunityForm`)

**Files:**
- Modify: `src/components/opportunities/OpportunityForm.tsx`

- [ ] **Ajouter `concernedCompanyId` dans l'état du formulaire**

Remplacer la définition de `form` :
```typescript
const [form, setForm] = useState({
  title: "",
  description: "",
  sourceUrl: "",
  companyId: "",
  concernedCompanyId: "",
  sourceLinkId: "",
});
```

Et dans le `setForm` du reset après création :
```typescript
setForm({ title: "", description: "", sourceUrl: "", companyId: "", concernedCompanyId: "", sourceLinkId: "" });
```

- [ ] **Passer `concernedCompanyId` dans le payload `create`**

Ajouter dans l'objet passé à `opportunityService.create` :
```typescript
concernedCompanyId: form.concernedCompanyId || undefined,
```

- [ ] **Ajouter le select dans le JSX, juste après le select `companyId`**

```tsx
<div className="space-y-1">
  <label className="text-sm font-medium">
    Client final <span className="text-neutral-400 font-normal">(optionnel)</span>
  </label>
  <select
    className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
    value={form.concernedCompanyId}
    onChange={(e) => setForm({ ...form, concernedCompanyId: e.target.value })}
  >
    <option value="">Sélectionner (optionnel)</option>
    {companies.map((c) => (
      <option key={c.id} value={c.id}>
        {c.name}
      </option>
    ))}
  </select>
</div>
```

- [ ] **Vérifier le typage**

```bash
npx tsc --noEmit
```

Résultat attendu : aucune erreur.

- [ ] **Commit**

```bash
git add src/components/opportunities/OpportunityForm.tsx
git commit -m "feat: add concernedCompanyId picker to OpportunityForm"
```

---

## Task 6 : Formulaire d'édition (`OpportunityEditForm`)

**Files:**
- Modify: `src/components/opportunities/OpportunityEditForm.tsx`

- [ ] **Ajouter `concernedCompanyId` dans l'état du formulaire**

Remplacer la définition de `form` dans `useState` :
```typescript
const [form, setForm] = useState({
  title: opportunity.title,
  description: opportunity.description || "",
  sourceUrl: opportunity.sourceUrl || "",
  companyId: opportunity.companyId || "",
  concernedCompanyId: opportunity.concernedCompanyId || "",
  status: opportunity.status || "SOURCING",
  followUpAt: toDatetimeLocal(opportunity.followUpAt),
  sourceLinkId: opportunity.sourceLinkId || "",
});
```

- [ ] **Synchroniser `concernedCompanyId` dans le `useEffect([opportunity])`**

Dans le `useEffect` qui re-synchronise le formulaire sur l'opportunité, ajouter :
```typescript
concernedCompanyId: opportunity.concernedCompanyId || "",
```

Le `useEffect` complet devient :
```typescript
useEffect(() => {
  setForm({
    title: opportunity.title,
    description: opportunity.description || "",
    sourceUrl: opportunity.sourceUrl || "",
    companyId: opportunity.companyId || "",
    concernedCompanyId: opportunity.concernedCompanyId || "",
    status: opportunity.status || "SOURCING",
    followUpAt: toDatetimeLocal(opportunity.followUpAt),
    sourceLinkId: opportunity.sourceLinkId || "",
  });
}, [opportunity]);
```

- [ ] **Passer `concernedCompanyId` dans le payload `update`**

Ajouter dans l'objet passé à `opportunityService.update` :
```typescript
concernedCompanyId: form.concernedCompanyId || null,
```

- [ ] **Ajouter le select dans le JSX, juste après le select `companyId`**

```tsx
<div className="space-y-1">
  <label className="text-sm font-medium">
    Client final <span className="text-neutral-400 font-normal">(optionnel)</span>
  </label>
  <select
    className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
    value={form.concernedCompanyId}
    onChange={(e) => setForm({ ...form, concernedCompanyId: e.target.value })}
  >
    <option value="">Sélectionner (optionnel)</option>
    {companies.map((c) => (
      <option key={c.id} value={c.id}>
        {c.name}
      </option>
    ))}
  </select>
</div>
```

- [ ] **Vérifier le typage**

```bash
npx tsc --noEmit
```

Résultat attendu : aucune erreur.

- [ ] **Commit**

```bash
git add src/components/opportunities/OpportunityEditForm.tsx
git commit -m "feat: add concernedCompanyId picker to OpportunityEditForm"
```

---

## Task 7 : Affichage en lecture (`OpportunityEditClient`)

**Files:**
- Modify: `src/components/opportunities/OpportunityEditClient.tsx`
- Modify: `src/app/(app)/opportunities/[id]/page.tsx`

- [ ] **Ajouter `concernedCompany` dans le DTO passé au composant dans la page**

Dans `src/app/(app)/opportunities/[id]/page.tsx`, dans la construction de `opportunityDTO`, ajouter après `company` :
```typescript
concernedCompanyId: opp.concernedCompanyId ?? null,
concernedCompany: opp.concernedCompany
  ? { id: opp.concernedCompany.id, name: opp.concernedCompany.name }
  : null,
```

- [ ] **Afficher le client final dans `OpportunityEditClient.tsx` en mode lecture**

Dans la section d'affichage (après le lien de l'entreprise ESN), ajouter sous la `<p>` de `opportunity.company` :

```tsx
{opportunity.concernedCompany && (
  <p className="text-sm text-neutral-600 dark:text-neutral-300">
    Client final :{" "}
    <Link
      href={`/companies/${opportunity.concernedCompany.id}`}
      className="text-emerald-600 hover:underline dark:text-emerald-400"
    >
      {opportunity.concernedCompany.name}
    </Link>
  </p>
)}
```

- [ ] **Vérifier le typage**

```bash
npx tsc --noEmit
```

Résultat attendu : aucune erreur.

- [ ] **Commit**

```bash
git add src/components/opportunities/OpportunityEditClient.tsx src/app/\(app\)/opportunities/\[id\]/page.tsx
git commit -m "feat: display concernedCompany (client final) on opportunity detail"
```

---

## Task 8 : Vérification finale

- [ ] **Lancer tous les tests**

```bash
npm run test
```

Résultat attendu : tous les tests passent.

- [ ] **Lancer le build de production**

```bash
npm run build
```

Résultat attendu : build réussi, aucune erreur TypeScript.
