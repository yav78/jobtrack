# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Jobtrack is a job-search mini CRM built with Next.js 16 (App Router), Prisma + PostgreSQL, TailwindCSS (dark mode default), Zod validation, and Vitest.

## Commands

```bash
npm run dev        # Start dev server (port 3000)
npm run build      # Production build
npm run lint       # ESLint
npm run format     # Prettier
npm run test       # Vitest (all tests)
npm run db:seed    # Seed the database
```

Run a single test file:
```bash
npx vitest run src/tests/unit/validators/company.test.ts
```

## Architecture

Three-layer architecture:

1. **Pages/Components** (`src/app/(app)/`, `src/components/`) — React Server Components preferred; `'use client'` only for interactive parts. TailwindCSS used directly (no global CSS for component styles).

2. **API Layer** (`src/app/api/`) — Next.js route handlers. All routes must:
   - Extract the user via `requireUserId()` from `X-User-Id` header (falls back to `AUTH_DEMO_USER_ID`)
   - Validate inputs with Zod schemas from `src/lib/validators/`
   - Return `{ data: {...} }` on success or `{ error: string }` on failure
   - Handle Prisma errors: `P2025` (not found → 404), `P2002` (unique constraint → 400)

3. **Service Layer** — split by rendering context:
   - `src/lib/services/back/` — server-side only, uses Prisma directly
   - `src/lib/services/front/` — client-side only (`'use client'`), uses `fetch()` to call `/api/*` routes

## Key Conventions

### Services
Never use `back/` services in client components or `front/` services in server components. The split is enforced by the `'use client'` directive and whether the service uses `prisma` vs `fetch`.

### API Responses
```typescript
// Success
{ data: {...}, message?: string }

// Error
{ error: string, details?: any }
```

### Database
- Use Prisma-generated types (`Prisma.CompanyCreateInput`, etc.)
- Respect partial unique constraints (one primary location per company, one primary channel per type per contact)
- Use Prisma transactions for multi-table operations
- All data is user-scoped — always filter by `userId`

### Validation
Zod schemas live in `src/lib/validators/`. Always validate before hitting the DB.

### Error Handling
Custom `HttpError` class in `src/lib/errors/index.ts`. Response helpers in `src/lib/errors/response.ts`.

## Environment Variables

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/jobtrack
NEXT_PUBLIC_APP_NAME=Jobtrack
AUTH_DEMO_USER_ID=00000000-0000-0000-0000-000000000001
NEXT_PUBLIC_BASE_URL=http://localhost:3000
AUTH_SECRET=...
AUTH_URL=http://localhost:3000
```

## Testing

Tests in `src/tests/`:
- `unit/validators/` — Zod schema unit tests
- `integration/api/` — Full API route integration tests
- `e2e/smoke.spec.ts` — Smoke tests

Path alias `@/*` maps to `src/*`.
