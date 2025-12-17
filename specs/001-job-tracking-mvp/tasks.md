# Tasks: Application MVP de Suivi de Recherche d'Emploi (Mini CRM)

**Input**: Design documents from `/specs/001-job-tracking-mvp/`  
**Prerequisites**: plan.md (completed), spec.md  
**Tests**: Inclure tests essentiels (validators/services/API clés) pour respecter TDD et la constitution. E2E smoke optionnel.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Peut être réalisé en parallèle (fichiers distincts, pas de dépendance)
- **[Story]**: US1, US2, US3, US4

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Initialiser projet Next.js (App Router) + TypeScript dans `./` (si absent)
- [x] T002 Ajouter TailwindCSS + config dark mode par défaut dans `tailwind.config.js` et `src/styles/globals.css`
- [x] T003 Ajouter ESLint/Prettier config alignée Next + scripts format/lint dans `package.json`
- [x] T004 Ajouter Docker Compose pour PostgreSQL (dev) dans `docker-compose.yml` + service db
- [x] T005 Créer gestion des variables env: `env.example` + validation zod dans `src/lib/env.ts`
- [x] T006 Ajouter Prisma : `prisma/schema.prisma` stub + `npx prisma init --datasource-provider postgresql`
- [x] T007 Créer singleton Prisma client dans `src/lib/prisma.ts`
- [x] T008 Ajouter auth mock: resolver `src/lib/auth.ts` (header `X-User-Id`, fallback user demo)
- [x] T009 Créer base layout AppShell (sidebar + topbar + theme toggle) dans `src/app/(app)/layout.tsx` + styles globaux
- [x] T010 Mettre en place dossiers `src/lib/validators`, `src/lib/dto`, `src/lib/errors`, `src/components`, `src/tests/{unit,integration,e2e}`

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T011 Définir schéma Prisma complet (User, Company, CompanyType, Location, Contact, ContactChannel, ChannelType, WorkOpportunity, Entretien, EntretienContact) dans `prisma/schema.prisma` (UUID, relations)
- [x] T012 Ajouter migrations Prisma : `npx prisma migrate dev` (init) dans `prisma/migrations/`
- [x] T013 Ajouter migration SQL custom pour uniques partielles (location primaire, channel primaire) dans `prisma/migrations/*/steps.sql`
- [x] T014 Générer Prisma Client `npx prisma generate`
- [x] T015 Script seed `prisma/seed.ts` (user demo, company_types, channel_types)
- [x] T016 Ajouter zod errors/HttpError mapping dans `src/lib/errors/index.ts`
- [x] T017 Ajouter DTO/types partagés (company, contact, channel, opportunity, entretien) dans `src/lib/dto/*`
- [x] T018 Ajouter validateurs zod (create/update) pour entités dans `src/lib/validators/*`
- [x] T019 Ajouter middleware utilitaire pour récupération userId depuis header dans `src/lib/auth.ts` (retourne demo si absent)
- [x] T020 Mettre en place réponses API standard (200/201/400/404/409/422) helpers dans `src/lib/errors/response.ts`
- [x] T021 Ajouter composants UI de base : `DataTable`, `Tabs`, `Modal/Drawer`, `Toast`, `ConfirmDialog` dans `src/components/` (stubs)

## Phase 3: User Story 1 - Gérer les Entreprises et leurs Lieux (Priority: P1) 🎯 MVP

**Goal**: CRUD entreprise + lieux avec primary unique, recherche/pagination.  
**Independent Test**: Créer entreprise + lieu principal, lister/rechercher, basculer le lieu principal, erreurs duplicat nom.

Tests (essentiels) :
- [x] T022 [P] [US1] Tests unitaires validateurs Company/Location dans `src/tests/unit/validators/company.test.ts`
- [x] T023 [P] [US1] Tests d'intégration API companies/locations dans `src/tests/integration/api/companies.test.ts`

Implémentation :
- [x] T024 [P] [US1] Implémenter endpoints GET/POST `/api/companies` (list/pagination/search + create) dans `src/app/api/companies/route.ts`
- [x] T025 [US1] Implémenter endpoints GET/PATCH/DELETE `/api/companies/[id]` avec 409 sur nom dupliqué (scope user) dans `src/app/api/companies/[id]/route.ts`
- [x] T026 [P] [US1] Implémenter POST `/api/companies/[id]/locations` (création + gestion isPrimary) dans `src/app/api/companies/[id]/locations/route.ts`
- [x] T027 [P] [US1] Implémenter PATCH/DELETE `/api/locations/[id]` avec bascule primaire dans `src/app/api/locations/[id]/route.ts`
- [x] T028 [US1] Page liste companies avec search/pagination dans `src/app/(app)/companies/page.tsx`
- [x] T029 [US1] Page détail company avec tabs Locations/Contacts dans `src/app/(app)/companies/[id]/page.tsx`
- [x] T030 [P] [US1] Form company create/edit (modal/drawer) dans `src/components/companies/CompanyForm.tsx`
- [x] T031 [P] [US1] Form location create/edit avec toggle primaire dans `src/components/companies/LocationForm.tsx`
- [x] T032 [US1] Gestion toasts/erreurs 409/422 sur forms company/location dans `src/components/companies/*`

## Phase 4: User Story 2 - Gérer les Contacts et leurs Canaux (Priority: P2)

**Goal**: CRUD contacts + canaux par entreprise, primary par channel type.  
**Independent Test**: Créer contact, ajouter canal email/tel, définir primaire par type, validation email/tel, lister.

Tests (essentiels) :
- [x] T033 [P] [US2] Tests unitaires validateurs Contact/ContactChannel dans `src/tests/unit/validators/contact.test.ts`
- [x] T034 [P] [US2] Tests d'intégration API contacts/channels dans `src/tests/integration/api/contacts.test.ts`

Implémentation :
- [x] T035 [P] [US2] Implémenter endpoints GET/POST `/api/contacts` avec filtre companyId, pagination, search dans `src/app/api/contacts/route.ts`
- [x] T036 [US2] Implémenter GET/PATCH/DELETE `/api/contacts/[id]` dans `src/app/api/contacts/[id]/route.ts`
- [x] T037 [P] [US2] Implémenter POST `/api/contacts/[id]/channels` (validation email/tel, primary par type) dans `src/app/api/contacts/[id]/channels/route.ts`
- [x] T038 [P] [US2] Implémenter PATCH/DELETE `/api/channels/[id]` dans `src/app/api/channels/[id]/route.ts`
- [x] T039 [US2] Page liste contacts (search/pagination) dans `src/app/(app)/contacts/page.tsx`
- [x] T040 [US2] Page détail contact avec canaux dans `src/app/(app)/contacts/[id]/page.tsx`
- [x] T041 [P] [US2] Form contact create/edit dans `src/components/contacts/ContactForm.tsx`
- [x] T042 [P] [US2] Form channel create/edit avec toggle primaire par type dans `src/components/contacts/ChannelForm.tsx`
- [x] T043 [US2] Toasts/erreurs 409/422 sur canaux (primary) dans `src/components/contacts/*`

## Phase 5: User Story 3 - Gérer les Opportunités (Priority: P3)

**Goal**: CRUD opportunités (scopées user), détail avec entretiens listés.  
**Independent Test**: Créer opportunité, lister, voir détail même sans entretiens.

Tests (essentiels) :
- [x] T044 [P] [US3] Tests unitaires validateurs Opportunity dans `src/tests/unit/validators/opportunity.test.ts`
- [x] T045 [P] [US3] Tests d'intégration API opportunities dans `src/tests/integration/api/opportunities.test.ts`

Implémentation :
- [x] T046 [P] [US3] Implémenter endpoints GET/POST `/api/opportunities` dans `src/app/api/opportunities/route.ts`
- [x] T047 [US3] Implémenter GET/PATCH/DELETE `/api/opportunities/[id]` dans `src/app/api/opportunities/[id]/route.ts`
- [x] T048 [US3] Page liste opportunities (search/pagination) dans `src/app/(app)/opportunities/page.tsx`
- [x] T049 [US3] Page détail opportunity avec liste des entretiens (include contacts + channel) dans `src/app/(app)/opportunities/[id]/page.tsx`
- [x] T050 [US3] Form opportunity create/edit dans `src/components/opportunities/OpportunityForm.tsx`

## Phase 6: User Story 4 - Gérer les Entretiens et Associations (Priority: P4)

**Goal**: CRUD entretiens, association multi-contacts, canal requis, erreurs 422 si pas de contact.  
**Independent Test**: Créer entretien (date + opportunity + 1+ contact + channel), voir historique dans opportunity detail.

Tests (essentiels) :
- [x] T051 [P] [US4] Tests unitaires validateurs Entretien (date/opportunity/contactIds/channel) dans `src/tests/unit/validators/entretien.test.ts`
- [x] T052 [P] [US4] Tests d'intégration API entretiens + contacts link dans `src/tests/integration/api/entretiens.test.ts`

Implémentation :
- [x] T053 [P] [US4] Implémenter endpoints GET/POST `/api/entretiens` (create with contactIds) dans `src/app/api/entretiens/route.ts`
- [x] T054 [US4] Implémenter GET/PATCH/DELETE `/api/entretiens/[id]` dans `src/app/api/entretiens/[id]/route.ts`
- [x] T055 [P] [US4] Implémenter POST `/api/entretiens/[id]/contacts` (add contactIds) dans `src/app/api/entretiens/[id]/contacts/route.ts`
- [x] T056 [P] [US4] Implémenter DELETE `/api/entretiens/[id]/contacts` (query contactId) dans `src/app/api/entretiens/[id]/contacts/route.ts`
- [x] T057 [US4] Page création entretien (form date, opportunity select, contacts multiselect, channel select filtré) dans `src/app/(app)/entretiens/new/page.tsx`
- [x] T058 [US4] Page détail entretien avec contacts et canal dans `src/app/(app)/entretiens/[id]/page.tsx`
- [x] T059 [US4] Adapter opportunity detail pour afficher historique entretiens (déjà en US3, compléter avec actions) dans `src/app/(app)/opportunities/[id]/page.tsx`
- [x] T060 [P] [US4] Components form: `src/components/entretiens/EntretienForm.tsx` (multiselect contacts, channel combo filtré)
- [x] T061 [US4] Toasts/erreurs 422 si aucun contact, 404 scope user, 409 conflits éventuels dans `src/components/entretiens/*`

## Phase 7: Polish & Cross-Cutting

- [x] T062 [P] Ajouter hooks/fetchers mutualisés pour API (utils `src/lib/api.ts`) + gestion de pagination/search
- [x] T063 [P] Ajouter loading/skeleton + empty states sur listes (companies, contacts, opportunities) dans `src/components/common/*`
- [x] T064 Ajouter documentation API (README section) avec exemples payloads pour endpoints principaux
- [x] T065 Ajouter script `npm run db:seed` et docs usage (dev)
- [x] T066 Ajouter vérifications accessibilité de base (labels, focus, contrastes) dans composants critiques
- [x] T067 Stabiliser erreurs 409/422 : mapping front (toasts) pour forms principaux
- [x] T068 [P] Tests E2E smoke (Playwright) parcours complet MVP dans `src/tests/e2e/smoke.spec.ts` (optionnel si temps)
- [x] T069 Mise à jour README (setup, env, scripts, seed, endpoints)

## Dependencies & Execution Order

- Phase 1 Setup → Phase 2 Foundational → US1 → US2 → US3 → US4 → Polish
- US dependencies : US4 dépend de US2 (contacts/channels) et US3 (opportunities) ; US1 indépendante et foundation pour contacts.

## Parallel Opportunities

- En Phase 1 : T002/T003/T004 en parallèle, T006/T007 après init
- En Phase 2 : T011/T013 en séquence (schema puis migration custom), T014/T015 en parallèle après migrations
- US1 : endpoints (T024-T027) en parallèle avec UI (T028-T032) après validators/tests (T022-T023)
- US2 : endpoints (T035-T038) en parallèle avec UI (T039-T043) après validators/tests (T033-T034)
- US3 : endpoints (T046-T047) en parallèle avec UI (T048-T050) après tests (T044-T045)
- US4 : endpoints (T053-T056) en parallèle avec UI (T057-T061) après tests (T051-T052)

## Implementation Strategy

- MVP d'abord : terminer US1 → US2 → US3 → US4, en validant chaque story indépendamment
- Tests unitaires/validators avant implémentation (TDD), intégration API pour flux critiques
- Polishing en fin (toasts, erreurs, docs, E2E smoke si temps)

