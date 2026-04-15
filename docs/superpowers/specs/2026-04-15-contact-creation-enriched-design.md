# Design — Création de contact enrichie

**Date :** 2026-04-15  
**Statut :** Approuvé

## Contexte

Actuellement, créer un contact oblige à sélectionner une entreprise existante. Les canaux de communication ne peuvent être ajoutés qu'après la création. Il n'existe pas de moyen d'ajouter une nouvelle entreprise depuis le formulaire contact.

## Objectifs

1. Rendre l'entreprise **optionnelle** lors de la création d'un contact.
2. Permettre d'ajouter des **canaux de communication** (LinkedIn, email, téléphone…) directement dans le formulaire de création.
3. Permettre de **créer une entreprise à la volée** via une sous-modale, si elle n'existe pas encore.

---

## 1. Schéma Prisma

### Modifications du modèle `Contact`

```prisma
model Contact {
  id                String           @id @default(uuid()) @db.Uuid
  userId            String           @db.Uuid          // NOUVEAU
  companyId         String?          @db.Uuid          // nullable (était requis)
  firstName         String
  lastName          String
  roleTitle         String?
  notes             String?
  basedAtLocationId String?          @db.Uuid
  deletedAt         DateTime?
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt

  user              User             @relation(fields: [userId], references: [id], onDelete: Cascade)  // NOUVEAU
  basedAt           Location?        @relation("ContactLocation", fields: [basedAtLocationId], references: [id])
  company           Company?         @relation(fields: [companyId], references: [id], onDelete: SetNull)  // devient optionnelle
  channels          ContactChannel[]
  entretienLinks    EntretienContact[]
  actionLinks       OpportunityActionContact[]
  actionsAsMainContact OpportunityAction[]

  @@index([userId])   // NOUVEAU
  @@index([companyId])
}
```

### Migration

1. Ajouter la colonne `userId` (nullable dans un premier temps).
2. Backfill : `UPDATE contacts SET user_id = companies.user_id FROM companies WHERE contacts.company_id = companies.id`.
3. Passer `userId` en NOT NULL.
4. Passer `companyId` en nullable.

---

## 2. Validation (Zod)

### `contactCreateSchema` — `src/lib/validators/contact.ts`

```typescript
export const contactCreateSchema = z.object({
  companyId: z.string().uuid().optional(),
  firstName: z.string().min(1),
  lastName:  z.string().min(1),
  roleTitle: z.string().optional(),
  notes:     z.string().optional(),
  basedAtLocationId: z.string().uuid().nullable().optional(),
  channels: z.array(z.object({
    channelTypeCode: z.string().min(1),
    value:           z.string().min(1),
  })).optional().default([]),
});
```

`contactUpdateSchema` reste un `partial()` de `contactCreateSchema` (sans `channels`, les canaux ont leur propre endpoint).

---

## 3. Service back — `src/lib/services/back/contacts.ts`

### `createContact(userId, data)`

- Valide avec `contactCreateSchema`.
- Si `companyId` fourni, vérifie que la company appartient à `userId` (inchangé).
- Crée le contact avec `userId` en transaction Prisma.
- Si `data.channels` non vide, crée les `ContactChannel` dans la même transaction.

### `getContacts(userId, options)`

Remplace `company: { userId }` par `userId` dans le `where`. Les contacts sans entreprise apparaissent dans la liste.

```typescript
const where = {
  userId,
  deletedAt: null,
  ...(options?.companyId ? { companyId: options.companyId } : {}),
  ...
};
```

### Autres fonctions impactées

- `getAllContacts()` : même changement de filtre.
- `getAllContactsForExport()` : idem.
- `deleteContact` / `deleteManyContacts` : filtre sur `userId` directement.
- `getContact` : filtre sur `userId` directement.

---

## 4. API — `POST /api/contacts`

Aucun changement côté route handler. Le payload accepté change via le validator :

```json
{
  "firstName": "Jean",
  "lastName": "Dupont",
  "companyId": "uuid-optionnel",
  "roleTitle": "CTO",
  "channels": [
    { "channelTypeCode": "LINKEDIN", "value": "https://linkedin.com/in/jdupont" },
    { "channelTypeCode": "EMAIL",    "value": "jean@exemple.com" }
  ]
}
```

---

## 5. Interface

### `ContactForm` — `src/components/contacts/ContactForm.tsx`

Champs du formulaire (dans l'ordre) :

| Champ | Comportement |
|---|---|
| Entreprise *(optionnel)* | `<select>` peuplé via `companyService.list()`. Option vide "Aucune". Bouton `+ Créer une entreprise` à côté → ouvre `CompanyQuickCreateModal`. À la fermeture avec succès, l'entreprise créée est ajoutée à la liste et auto-sélectionnée. |
| Prénom / Nom | Inchangé, requis |
| Rôle | Inchangé, optionnel |
| Canaux de communication | Liste dynamique de lignes `ChannelRow`. Bouton `+ Ajouter un canal` en bas. |
| Notes | Inchangé, optionnel |

**Soumission :** `POST /api/contacts` avec l'ensemble du payload (canaux inclus). Un seul appel API.

### `ChannelRow` (composant interne au `ContactForm`)

Ligne inline : `[Type ▾] [Valeur (input text)] [✕ supprimer]`

Types disponibles : `EMAIL`, `PHONE`, `LINKEDIN`, `OTHER` — identiques à ceux du `ChannelForm` existant.

Géré entièrement en local state dans `ContactForm` (tableau de `{ channelTypeCode, value }`). Aucune persistance avant la soumission du formulaire.

### `CompanyQuickCreateModal` — `src/components/companies/CompanyQuickCreateModal.tsx`

Sous-modale légère (composant `Modal` existant) affichée par-dessus la modale contact :

- Champs : **Nom** (requis) + **Type** (select, valeurs existantes : `CLIENT_FINAL`, `ESN`, `PORTAGE`, `OTHER`).
- Soumission : `POST /api/companies` via `companyService.create()`.
- En cas de succès : ferme la sous-modale, renvoie `{ id, name }` via callback `onSuccess`.
- En cas d'erreur : toast d'erreur, modale reste ouverte.

---

## 6. Édition — lier une entreprise après création

Un contact créé sans entreprise doit pouvoir être lié à une entreprise plus tard.

### `ContactEditForm` — `src/components/companies/ContactEditForm.tsx`

Ajout d'un champ **Entreprise** (optionnel) :

| Champ | Comportement |
|---|---|
| Entreprise *(optionnel)* | `<select>` peuplé via `companyService.list()`. Option "Aucune" (valeur `""`). Bouton `+ Créer une entreprise` → ouvre `CompanyQuickCreateModal`. |
| Prénom / Nom | Inchangé |
| Rôle | Inchangé |
| Notes | Inchangé |

Soumission : `PATCH /api/contacts/:id` avec `companyId` (uuid ou `null` pour délier).

### Service `updateContact`

Si `companyId` est fourni dans le payload, vérifier que la company appartient à `userId` avant la mise à jour (même logique que `createContact`). Si `companyId` est explicitement `null`, délier.

### Page détail contact — `src/app/(app)/contacts/[id]/page.tsx`

La page n'a pas encore de bouton "Modifier". Ajout :
- Bouton **"Modifier"** dans l'en-tête (à côté de "Envoyer un email").
- Clic → ouvre une `Modal` avec `ContactEditForm` (le composant devient `'use client'` ou la page est partiellement client-side via un wrapper).
- Affichage du nom de l'entreprise liée dans l'en-tête (ou "Sans entreprise" si null).

---

## 7. Page entreprise — lier un contact existant

Sur la page `/companies/[id]`, onglet **Contacts**, la colonne droite affiche actuellement un formulaire de création de contact (`ContactForm` de `src/components/companies/ContactForm.tsx`). Il faut ajouter une section **"Lier un contact existant"** en dessous.

### Nouveau composant `LinkContactForm` — `src/components/companies/LinkContactForm.tsx`

Un `<select>` peuplé avec les contacts de l'utilisateur qui n'ont **pas de companyId** (`companyId === null`). Bouton "Lier".

- Au chargement : appel `GET /api/contacts?unlinked=true` pour ne récupérer que les contacts sans entreprise.
- Soumission : `PATCH /api/contacts/:id` avec `{ companyId: <id de l'entreprise courante> }`.
- En cas de succès : le contact est ajouté à la liste gauche (contacts de l'entreprise), retiré du `<select>`. Toast succès.
- Si aucun contact sans entreprise : afficher "Aucun contact à lier."

### API — `GET /api/contacts`

Ajout du paramètre query `unlinked=true` qui filtre `companyId: null`.

Dans `getContacts(userId, options)` :

```typescript
...(options?.unlinked ? { companyId: null } : {}),
```

### Page entreprise — `src/app/(app)/companies/[id]/page.tsx`

La colonne droite de l'onglet contacts devient :

```
┌─────────────────────────────┐
│  Créer un nouveau contact   │  ← ContactForm existant
│  [formulaire actuel]        │
│                             │
│  ── ou ──                   │
│                             │
│  Lier un contact existant   │  ← LinkContactForm (nouveau)
│  [select] [Lier]            │
└─────────────────────────────┘
```

---

## 8. Ce qui n'est PAS dans le scope

- Ajouter un label ou marquer un canal "principal" lors de la création (possible après via la page détail du contact).
- Export CSV (les contacts sans entreprise apparaîtront avec une colonne `company` vide).
