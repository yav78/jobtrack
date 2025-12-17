# Jobtrack - Mini CRM de recherche d'emploi

Suivi des entreprises, contacts, canaux, opportunités et entretiens.

## Stack
- Next.js (App Router) + route handlers API
- Prisma + PostgreSQL
- TailwindCSS (dark mode)
- Zod pour les validateurs
- Vitest pour tests unitaires/intégration

## Setup
```bash
npm install
cp env.example .env
docker compose up -d db
npx prisma migrate dev
npm run db:seed
npm run dev
```

Env attendues (`.env`) :
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/jobtrack`
- `AUTH_DEMO_USER_ID=00000000-0000-0000-0000-000000000001`

## Scripts
- `npm run dev` : serveur Next
- `npm run lint` : ESLint
- `npm run test` : Vitest (unit + intégration + smoke)
- `npm run db:seed` : seed (user demo, types, données démo)
- `npm run build` / `npm start` : prod

## Endpoints principaux (REST)
- Companies : `GET/POST /api/companies`, `GET/PATCH/DELETE /api/companies/:id`, `POST /api/companies/:id/locations`, `PATCH/DELETE /api/locations/:id`
- Contacts : `GET/POST /api/contacts`, `GET/PATCH/DELETE /api/contacts/:id`, `POST /api/contacts/:id/channels`, `PATCH/DELETE /api/channels/:id`
- Opportunities : `GET/POST /api/opportunities`, `GET/PATCH/DELETE /api/opportunities/:id`
- Entretiens : `GET/POST /api/entretiens`, `GET/PATCH/DELETE /api/entretiens/:id`, `POST /api/entretiens/:id/contacts`, `DELETE /api/entretiens/:id/contacts?contactId=...`

Convention : toutes les routes attendent `X-User-Id` (fallback user demo).

## Tests
```bash
npm run test   # Vitest
```
Suites couvertes : validateurs, API companies/contacts/opportunities/entretiens, smoke.

## UI (pages clés)
- `/companies`, `/contacts`, `/opportunities`, `/entretiens/new`, `/entretiens/[id]`

## Notes
- Uniques partielles gérées via migration SQL (location primaire par company, channel primaire par type).
- Dark mode par défaut, toggle dans l'AppShell.
