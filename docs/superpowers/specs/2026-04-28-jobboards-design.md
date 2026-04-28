# Design : Jobboards & liaison candidature/source

Date : 2026-04-28

## Contexte

La table `Link` existe déjà avec une catégorie `JOBBOARD`. Elle est actuellement mélangée avec les catégories `TOOL`, `NETWORK`, `OTHER` dans une seule page "Liens". L'objectif est de :

1. Donner une page dédiée aux jobboards, séparée des autres liens
2. Permettre de renseigner sur quelle plateforme une opportunité a été trouvée
3. Permettre de renseigner via quelle plateforme une action a été effectuée
4. Afficher des stats "candidatures par jobboard" sur le tableau de bord

---

## 1. Modèle de données

### Nouveaux champs

```prisma
model WorkOpportunity {
  // champ existants...
  sourceLinkId  String?  @db.Uuid
  sourceLink    Link?    @relation("OpportunitySourceLink", fields: [sourceLinkId], references: [id])
}

model OpportunityAction {
  // champs existants...
  linkId  String?  @db.Uuid
  link    Link?    @relation("ActionJobboard", fields: [linkId], references: [id])
}

model Link {
  // champs existants...
  actionJobboards      OpportunityAction[]  @relation("ActionJobboard")
  sourceOpportunities  WorkOpportunity[]    @relation("OpportunitySourceLink")
}
```

**Sémantique :**
- `WorkOpportunity.sourceLinkId` = jobboard sur lequel l'offre a été trouvée ("Vu sur")
- `OpportunityAction.linkId` = jobboard utilisé lors de cette action ("Via")

**Contraintes :**
- Les deux FK sont nullables — aucun champ obligatoire
- Aucune check constraint en base sur la catégorie ; le filtre `JOBBOARD` est appliqué uniquement côté application (UI et services)
- Migration non destructive : deux colonnes nullable sur tables existantes

### DTOs à mettre à jour

- `OpportunityActionDTO` : ajouter `linkId`, `linkTitle` (dénormalisé pour l'affichage)
- `WorkOpportunityDTO` : ajouter `sourceLinkId`, `sourceLinkTitle`

---

## 2. Scission de la page Liens

### Page `/jobboards` (nouvelle)

- Affiche uniquement les `Link` avec `category = JOBBOARD`
- Formulaire de création sans sélecteur de catégorie (fixé à `JOBBOARD` implicitement)
- Affiche un compteur "X candidatures" par jobboard (agrégation depuis les actions `APPLIED`)
- Route : `src/app/(app)/jobboards/`

### Page `/links` (existante, modifiée)

- Filtre à l'affichage : `category IN (TOOL, NETWORK, OTHER)`
- Retire `JOBBOARD` du sélecteur de catégorie dans le formulaire de création/édition
- L'API reste la même (`/api/links`), le filtre est passé en query param

### API `/api/links`

- Accepte déjà un filtre `category` en query param
- Ajouter le support de plusieurs catégories via param répété : `?category[]=TOOL&category[]=NETWORK&category[]=OTHER`
- Validator `linkListQuerySchema` : `category` passe de `LinkCategoryEnum.optional()` à `z.array(LinkCategoryEnum).optional()`

### Sidebar

```
Tableau de bord
Entreprises
Contacts
Opportunités
Jobboards        ← nouveau (/jobboards)
Liens            ← existant, sans JOBBOARD
Actions
Documents
Corbeille
```

---

## 3. Formulaires

### Formulaire d'opportunité (création + édition)

Nouveau champ optionnel **"Vu sur"** :
- Dropdown listant les `Link` de l'utilisateur avec `category = JOBBOARD`
- Placé après le champ `sourceUrl`
- Alimenté par `/api/links?category=JOBBOARD` au chargement
- Si aucun jobboard enregistré : lien "Ajouter un jobboard" vers `/jobboards`
- Effaçable (envoi `null` pour vider la relation)

### Formulaire d'action (`StandaloneActionForm`)

Nouveau champ optionnel **"Via"** :
- Même dropdown filtré `JOBBOARD`
- Placé après le champ "Canal" (`channelTypeCode`)
- Présent pour tous les types d'action (pas uniquement `APPLIED`)
- Même comportement que le champ de l'opportunité (nullable, lien vers `/jobboards` si vide)

### Services front

- Nouveau `jobboardService.list()` dans `src/lib/services/front/` qui appelle `/api/links?category=JOBBOARD`
- Utilisé par les deux formulaires

---

## 4. Widget dashboard

### "Candidatures par plateforme"

Nouveau bloc sur le tableau de bord. Agrège les actions de type `APPLIED` ayant un `linkId` renseigné, groupées par jobboard :

```
Candidatures par plateforme
────────────────────────────
LinkedIn                  8
Welcome to the Jungle     5
Indeed                    2
(sans plateforme)         3
```

**Implémentation :**
- Nouvelle fonction back `getApplicationsByJobboard(userId)` dans `src/lib/services/back/opportunity-actions.ts`
- Requête Prisma : `groupBy` sur `linkId`, filtre `type = APPLIED`, inclut le `link.title`
- Ligne "sans plateforme" : count des actions `APPLIED` avec `linkId = null`
- Nouveau composant `JobboardStatsWidget` dans `src/components/dashboard/`
- Données chargées côté serveur (RSC) dans la page dashboard

---

## 5. Affichage dans les listes

### Liste des opportunités

- Nouvelle colonne/badge **"Vu sur"** affichée sous le titre ou en colonne séparée
- Source : `WorkOpportunity.sourceLinkId` → `sourceLinkTitle`
- Si null : rien affiché

### Liste des actions

- Nouvelle colonne/badge **"Via"** sur chaque ligne
- Source : `OpportunityAction.linkId` → `linkTitle`
- Si null : rien affiché

---

## Fichiers à créer ou modifier

| Fichier | Changement |
|---|---|
| `prisma/schema.prisma` | Ajouter `sourceLinkId` sur `WorkOpportunity`, `linkId` sur `OpportunityAction`, back-relations sur `Link` |
| `prisma/migrations/` | Nouvelle migration |
| `src/lib/validators/opportunity-action.ts` | Ajouter `linkId?: uuid | null` |
| `src/lib/validators/opportunity.ts` | Ajouter `sourceLinkId?: uuid | null` |
| `src/lib/validators/link.ts` | Mettre à jour `linkListQuerySchema` pour accepter plusieurs catégories |
| `src/lib/dto/opportunity-action.ts` | Ajouter `linkId`, `linkTitle` |
| `src/lib/dto/opportunity.ts` | Ajouter `sourceLinkId`, `sourceLinkTitle` |
| `src/lib/services/back/opportunity-actions.ts` | Inclure `link` dans les includes Prisma, nouvelle fonction `getApplicationsByJobboard` |
| `src/lib/services/back/opportunities.ts` | Inclure `sourceLink` dans les includes Prisma |
| `src/lib/services/front/jobboard.service.ts` | Nouveau service (`list()`) |
| `src/app/api/actions/route.ts` | Passer `linkId` à la création |
| `src/app/api/actions/[actionId]/route.ts` | Passer `linkId` à la mise à jour |
| `src/app/api/opportunities/route.ts` | Passer `sourceLinkId` à la création |
| `src/app/api/opportunities/[id]/route.ts` | Passer `sourceLinkId` à la mise à jour |
| `src/app/api/links/route.ts` | Supporter `category` multi-valeurs |
| `src/components/actions/StandaloneActionForm.tsx` | Ajouter champ "Via" |
| `src/components/opportunities/OpportunityForm.tsx` | Ajouter champ "Vu sur" (création) |
| `src/components/opportunities/OpportunityEditForm.tsx` | Ajouter champ "Vu sur" (édition) |
| `src/components/dashboard/JobboardStatsWidget.tsx` | Nouveau composant widget |
| `src/app/(app)/page.tsx` | Intégrer le widget (page tableau de bord) |
| `src/app/(app)/jobboards/` | Nouvelle page (page.tsx + client component) |
| `src/app/(app)/links/LinksPageClient.tsx` | Retirer `JOBBOARD` des catégories |
| `src/app/api/links/route.ts` | Filtrer par catégories multiples |
| `src/components/layout/sidebar.tsx` | Ajouter entrée "Jobboards" |
| `src/components/actions/ActionsListClient.tsx` | Ajouter colonne "Via" |
| `src/components/opportunities/OpportunitiesListClient.tsx` | Ajouter colonne "Vu sur" |
