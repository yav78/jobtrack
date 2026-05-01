# Design — Entreprise client final sur une opportunité

**Date :** 2026-05-01  
**Statut :** Approuvé

## Contexte

Une opportunité peut être postée par une ESN alors que la mission concerne en réalité une entreprise cliente finale différente. L'utilisateur veut pouvoir lier une seconde entreprise (client final) à une opportunité pour garder cette information dans son CRM.

## Approche retenue

Ajout d'un champ nullable `concernedCompanyId` sur `WorkOpportunity`, même pattern que le champ `companyId` existant. L'entreprise client final est une fiche `Company` existante dans le CRM.

## Schéma de données

```prisma
model WorkOpportunity {
  // ... champs existants ...
  concernedCompanyId String?  @db.Uuid

  concernedCompany Company? @relation("OpportunityConcernedCompany", fields: [concernedCompanyId], references: [id])
}

model Company {
  // ... champs existants ...
  concernedOpportunities WorkOpportunity[] @relation("OpportunityConcernedCompany")
}
```

Une migration Prisma est générée (`prisma migrate dev`).

## Backend

### DTO (`src/lib/dto/opportunity.ts`)
Ajouter :
- `concernedCompanyId?: string | null`
- `concernedCompany?: { id: string; name: string } | null`

### Validators (`src/lib/validators/opportunity.ts`)
Ajouter sur les schémas create et update :
- `concernedCompanyId: z.string().uuid().nullable().optional()`

### Service back (`src/lib/services/back/opportunities.ts`)
Inclure `concernedCompany: { select: { id, name } }` dans tous les `include`/`select` des requêtes Prisma sur `WorkOpportunity`.

### Routes API
- `GET /api/opportunities/[id]` — exposer `concernedCompanyId` + `concernedCompany` dans la réponse
- `POST /api/opportunities` — accepter et persister `concernedCompanyId`
- `PATCH /api/opportunities/[id]` — accepter et mettre à jour `concernedCompanyId`

## Frontend

### Formulaires création et édition
Dans `OpportunityForm.tsx` et `OpportunityEditForm.tsx` :
- Ajouter un select **"Entreprise concernée (client final)"** optionnel, sous le champ ESN existant
- Même composant/style que le picker d'entreprise actuel
- Valeur par défaut : vide (aucune)

### Page détail (`OpportunityEditClient.tsx`)
En mode lecture, afficher sous l'entreprise ESN :
```
Client final : [Nom entreprise] → lien vers /companies/[id]
```
Uniquement si `concernedCompany` est renseigné.

### Liste des opportunités
Pas de changement — la colonne serait trop dense.

## Ce qui ne change pas
- Logique de statut (`markOpportunityApplied`)
- Actions / timeline
- Export CSV
