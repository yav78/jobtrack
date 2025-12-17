# Implementation Plan: Application MVP de Suivi de Recherche d'Emploi (Mini CRM)

**Branch**: `001-job-tracking-mvp` | **Date**: 2025-12-16 | **Spec**: `/specs/001-job-tracking-mvp/spec.md`
**Input**: Feature specification from `/specs/001-job-tracking-mvp/spec.md`

**Note**: This plan suit l'exécution de `/speckit.plan`. Voir `.specify/templates/commands/plan.md` pour le workflow.

## Summary

MVP mini CRM pour le suivi de recherche d'emploi : gestion des entreprises, contacts, canaux, opportunités et entretiens. Frontend Next.js (App Router) + API route handlers, Prisma/PostgreSQL, TailwindCSS (dark mode). Données scopées par `userId` (MVP: user demo via header `X-User-Id`). Respect des règles primary (locations, channels), validations Zod, pagination/search basiques, erreurs explicites (409/422). Parcours clé : company → location primary → contact → channel primary → opportunity → entretien (1+ contact + channel) → visualisation dans opportunity detail.

## Technical Context

**Language/Version**: TypeScript, Next.js 14 (App Router)  
**Primary Dependencies**: Next.js (app router + route handlers), Prisma, Zod, TailwindCSS, React, node-postgres (via Prisma)  
**Storage**: PostgreSQL (Docker pour dev), Prisma ORM  
**Testing**: Vitest (unit/services/validators), Playwright (E2E smoke optionnel), possible Supertest/fetch pour API route handlers  
**Target Platform**: Web (Next.js, Node 18+)  
**Project Type**: Web app (frontend + API dans le même Next)  
**Performance Goals**: <2s chargement initial, API p95 <200ms, CRUD critique <500ms, recherche <300ms sur 10k lignes, 100 users concurrents min  
**Constraints**: Données scopées par `userId` (header `X-User-Id`, fallback demo), dark mode par défaut, validations Zod, erreurs 409/422 explicites, pagination simple `?page=&pageSize=` et search `?q=`  
**Scale/Scope**: MVP mono-tenant logique (user demo) avec jeux de données ~10k entrées (companies/contacts/opportunities), seed types + user demo

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Vérifier la conformité avec la constitution Jobtrack (`.specify/memory/constitution.md`) :

- **I. Code Quality Standards** : Plan MUST inclure linting/formatting, structure de code claire, documentation
- **II. Test-First Development** : Plan MUST inclure stratégie de tests TDD avec couverture ≥80% (100% pour code critique)
- **III. Testing Standards** : Plan MUST spécifier tests unitaires, intégration, contrat, et E2E pour fonctionnalités critiques
- **IV. User Experience Consistency** : Plan MUST vérifier cohérence UI/UX, design system, accessibilité WCAG 2.1 AA
- **V. Performance Requirements** : Plan MUST valider objectifs de performance (<2s chargement, <200ms API p95, <500ms CRUD)

**Violations** : Documenter toute exception dans la section "Complexity Tracking" ci-dessous avec justification.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
```text
src/
├── app/
│   ├── (app)/
│   │   ├── companies/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── contacts/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── opportunities/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── entretiens/
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   └── api/
│       ├── companies/route.ts
│       ├── companies/[id]/route.ts
│       ├── companies/[id]/locations/route.ts
│       ├── locations/[id]/route.ts
│       ├── contacts/route.ts
│       ├── contacts/[id]/route.ts
│       ├── contacts/[id]/channels/route.ts
│       ├── channels/[id]/route.ts
│       ├── company-types/route.ts
│       ├── channel-types/route.ts
│       ├── opportunities/route.ts
│       ├── opportunities/[id]/route.ts
│       ├── entretiens/route.ts
│       └── entretiens/[id]/contacts/route.ts
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   ├── validators/
│   ├── dto/
│   └── errors/
├── components/
├── styles/
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/

prisma/
├── schema.prisma
└── seed.ts
```

**Structure Decision**: Next.js App Router unique projet : frontend pages dans `src/app/(app)`, API route handlers dans `src/app/api`, librairies partagées dans `src/lib`, composants UI dans `src/components`, tests dans `src/tests`, Prisma dans `prisma/`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| _None_ | - | - |
