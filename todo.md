# TODO — Audit Jobtrack

Légende : `[ ]` à faire · `[x]` fait · `[~]` en cours

---

## 🔴 P0 — Critique

- [x] **Supprimer tous les `console.log()`** — supprimés dans tous les fichiers src (`api.ts`, `auth.ts`, `companies/route.ts`, `LocationForm.tsx`, `company.service.ts`, `contacts/page.tsx`, `companies/page.tsx`)

- [x] **`contacts/page.tsx`** — ajout état `loading` (skeleton) + état `error` avec message affiché

- [x] **`companies/[id]/page.tsx`** — cast `as unknown as` simplifié + skeleton loading + état error affiché

- [x] **Code mort dans `company.service.ts`** — ligne `return data.items ?? []` unreachable supprimée, retour corrigé

---

## 🟠 P1 — Important

- [x] **`abstract-crus.service.ts`** — restauré `frontFetchJson` pour tous les methods (gestion `res.ok`, `Content-Type` auto, cookies SSR). Bug `PUT` → `PATCH` pour `update()` corrigé au passage. Types `any` → `unknown`.

- [x] **`abstract-crus.service.ts`** — `Content-Type: application/json` géré automatiquement par `frontFetchJson`

- [x] **`requireJson()`** — ajoutée dans tous les handlers POST/PATCH (12 routes). Signature changée de `NextRequest` → `Request` pour compatibilité.

- [x] **`locations/[id]/route.ts`** — DELETE handler corrigé : `jsonError()` → `handleRouteError()`. Import `jsonError` inutile supprimé.

- [x] **Race condition `EntretienForm.tsx`** — Remplacé `eslint-disable` + `.join(",")` inline par une variable `contactIdsKey` propre. Stale closure sur `contactChannelId` fixée via functional update. Reset du canal si plus de contacts sélectionnés.

- [x] **`error.details`** — masqué en production (`NODE_ENV !== "production"`) dans `response.ts`

- [x] **Messages d'erreur service layer** — Tous les `throw new Error("Not found")` remplacés par `throw NotFound(...)` / `throw BadRequest(...)` avec messages contextuels dans : `companies.ts`, `contacts.ts`, `locations.ts`, `channels.ts`, `entretiens.ts`, `entretien-contacts.ts`, `opportunities.ts`, `opportunity-actions.ts`

---

## 🟡 P2 — UX Frontend

- [x] **Loading states** — skeletons animés ajoutés dans `contacts/page.tsx`, `companies/[id]/page.tsx`, `opportunities/page.tsx`

- [x] **Error states** — messages d'erreur affichés dans `contacts/page.tsx`, `companies/[id]/page.tsx`, `opportunities/page.tsx`

- [x] **Empty states** — messages contextuels dans `CompaniesTable`, `ContactsTable`, `OpportunitiesTable`, `contacts/[id]/page.tsx`, `companies/[id]/page.tsx` (lieux + contacts)

- [x] **`confirm()` natif** — remplacé par `ConfirmDialog` dans `companies/[id]/page.tsx` : état `pendingDelete` unifié pour lieux et contacts, dialog avec nom de l'élément à supprimer

- [x] **Formulaires** — comportement déjà correct : reset uniquement sur succès, valeurs conservées sur erreur (vérifié `CompanyForm`, `LocationForm`)

- [x] **Pagination** — nouveau composant `Pagination.tsx` + câblé dans `contacts/page.tsx` et `opportunities/page.tsx`. Services `contact.service.ts` et `opportunity.service.ts` mis à jour pour retourner `{ items, total, page, pageSize }`

- [x] **Messages Zod** — `handleRouteError` intercepte les `ZodError` et les traduit en français via `translateZodIssue()`. P2002 traduit en "Cette valeur existe déjà".

- [x] **Accessibilité** — `aria-label` ajoutés sur tous les boutons Modifier/Supprimer dans `companies/[id]/page.tsx`. `type="button"` ajouté pour éviter les soumissions involontaires de formulaire.

---

## 🔵 P3 — Architecture / TypeScript

- [x] **`CrudServiceInterface`** — tous les types sont `any`, utiliser des génériques `<T>`

- [x] **Génériques `<T = any>`** dans `AbstractCrudService` — neutralisent TypeScript (déjà `<T = unknown>`)

- [x] **`fetch` directs** dans certains composants — remplacés par les services front dans tous les composants. Nouveaux services : `channel-type.service.ts`, `entretien.service.ts`. Services étendus : `company.service.ts` (locations), `contact.service.ts` (channels, listAll, listByCompany), `opportunity-action.service.ts` (listAll, createForOpportunity, createStandalone, updateStandalone, deleteAction), `opportunity.service.ts` (listAll)

- [x] **`force-dynamic`** sur la page dashboard — justifié : données utilisateur au moment de la requête

- [ ] **Pas de rate limiting** sur les endpoints (login, création de compte) — à traiter au niveau infrastructure (Vercel Edge / middleware), pas en application

---

## ✨ Nouvelles fonctionnalités

### Court terme
- [ ] **Statut/pipeline des opportunités** — "Candidaté", "Entretien", "Offre reçue", "Refus" + vue filtrée par statut
- [ ] **Recherche & filtres** sur les opportunités — titre, entreprise, statut, dates
- [ ] **Rappels de suivi** — "Relancer dans X jours" sur une opportunité ou contact

### Moyen terme
- [ ] **Export CSV** — opportunités, contacts, entreprises
- [ ] **Dashboard enrichi** — taux de réponse, temps moyen avant entretien, entonnoir candidature→offre
- [ ] **Soft deletes** — corbeille avec restauration
- [ ] **Actions en masse** — sélection multiple pour supprimer/archiver

### Long terme
- [ ] **Intégration email** — relance directement depuis une opportunité/contact
- [ ] **Chronologie globale** — toutes les actions récentes de l'utilisateur
- [ ] **Documentation API** — OpenAPI/Swagger auto-générée
