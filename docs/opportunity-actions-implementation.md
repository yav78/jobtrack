# Implémentation du système d'actions d'opportunité

## Résumé

Refonte du système d'entretiens vers un système générique d'historisation d'actions sur les opportunités (timeline).

## Fichiers créés/modifiés

### Schéma Prisma
- ✅ `prisma/schema.prisma` : Ajout de l'enum `OpportunityActionType` et des modèles `OpportunityAction` + `OpportunityActionContact`
- ✅ Migration `20251221185926_add_opportunity_actions` : Création des tables + migration des données

### DTOs et Validators
- ✅ `src/lib/dto/opportunity-action.ts` : Type DTO pour les actions
- ✅ `src/lib/validators/opportunity-action.ts` : Schémas Zod pour validation

### Services
- ✅ `src/lib/services/opportunity-actions.ts` : Fonctions CRUD pour les actions
- ✅ `src/lib/services/types.ts` : Types TypeScript partagés

### Routes API
- ✅ `src/app/api/opportunities/[id]/actions/route.ts` : GET (liste) et POST (création)

### Composants Frontend
- ✅ `src/components/opportunities/OpportunityTimeline.tsx` : Server component pour afficher la timeline
- ✅ `src/components/opportunities/ActionForm.tsx` : Client component modal pour créer une action
- ✅ `src/components/opportunities/ActionTypeFilter.tsx` : Client component pour filtrer par type
- ✅ `src/components/opportunities/ActionTypeFilterClient.tsx` : Wrapper client pour le filtre avec état
- ✅ `src/components/opportunities/ActionPageClient.tsx` : Wrapper client pour le bouton d'ajout

### Pages
- ✅ `src/app/(app)/opportunities/[id]/page.tsx` : Page détail avec timeline et filtre
- ✅ `src/app/(app)/opportunities/[id]/interviews/page.tsx` : Page dédiée aux entretiens (filtre INTERVIEW)

### Documentation
- ✅ `docs/migration-phase2.md` : Guide pour la suppression des tables Entretien (phase 2)

## Types d'actions disponibles

- `INTERVIEW` : Entretien
- `APPLIED` : Candidature
- `INBOUND_CONTACT` : Contact entrant
- `OUTBOUND_CONTACT` : Contact sortant
- `MESSAGE` : Message
- `CALL` : Appel
- `FOLLOW_UP` : Relance
- `OFFER_RECEIVED` : Offre reçue
- `OFFER_ACCEPTED` : Offre acceptée
- `REJECTED` : Refus
- `NOTE` : Note

## Migration des données

La migration phase 1 :
1. Crée les nouvelles tables `OpportunityAction` et `OpportunityActionContact`
2. Copie toutes les données `Entretien` vers `OpportunityAction` avec `type=INTERVIEW`
3. Copie toutes les données `EntretienContact` vers `OpportunityActionContact`
4. Conserve `legacyEntretienId` pour traçabilité

Les tables `Entretien` et `EntretienContact` restent en place pour la phase 2 (suppression après validation).

## API Endpoints

### GET `/api/opportunities/[id]/actions?type=INTERVIEW`
Retourne la liste des actions pour une opportunité, optionnellement filtrée par type.
- Tri par `occurredAt DESC`
- Inclut `contactChannel` et `participants`

### POST `/api/opportunities/[id]/actions`
Crée une nouvelle action.
- Body: `{ type, occurredAt, notes?, contactChannelId?, participantContactIds?, metadata? }`
- Validation Zod
- Vérification de propriété de l'opportunité

## Fonctionnalités UI

### Timeline
- Affichage chronologique des actions (plus récentes en premier)
- Badge coloré par type d'action
- Affichage de la date/heure formatée
- Affichage des notes, canal et participants

### Filtre par type
- Boutons de filtre pour chaque type d'action
- Filtre "Toutes" pour afficher toutes les actions
- Mise à jour de l'URL avec paramètre `?type=...`

### Formulaire de création
- Modal avec formulaire complet
- Sélection du type d'action
- Date/heure (datetime-local)
- Multi-select des participants (contacts de l'entreprise)
- Sélection du canal (filtré selon les participants sélectionnés)
- Notes optionnelles
- Validation et gestion d'erreurs

## Prochaines étapes

1. **Tester la migration** : Appliquer la migration et vérifier que les données sont bien migrées
2. **Valider le fonctionnement** : Tester la création d'actions, l'affichage de la timeline, les filtres
3. **Phase 2** : Après validation, suivre le guide `docs/migration-phase2.md` pour supprimer les tables Entretien

## Notes importantes

- Les anciennes routes `/api/entretiens` restent fonctionnelles pour compatibilité
- La page `/entretiens/new` peut être redirigée vers la nouvelle page d'opportunité
- Le champ `legacyEntretienId` sera supprimé en phase 2
- Les données existantes sont préservées via la migration

