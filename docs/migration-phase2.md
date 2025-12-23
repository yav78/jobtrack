# Migration Phase 2 : Suppression des tables Entretien

## Objectif

Après validation de la migration vers `OpportunityAction`, supprimer les anciennes tables `Entretien` et `EntretienContact`, ainsi que le champ `legacyEntretienId` de `OpportunityAction`.

## Prérequis

- ✅ Migration phase 1 appliquée et validée
- ✅ Toutes les données `Entretien` migrées vers `OpportunityAction`
- ✅ Vérification que `legacyEntretienId` n'est plus utilisé dans le code
- ✅ Tests de régression passés

## Étapes

### 1. Vérifier qu'aucune donnée n'utilise encore Entretien

```sql
-- Vérifier qu'il n'y a plus d'entretiens
SELECT COUNT(*) FROM "Entretien";
-- Doit retourner 0

-- Vérifier que tous les legacyEntretienId sont remplis
SELECT COUNT(*) FROM "OpportunityAction" WHERE "legacyEntretienId" IS NOT NULL;
```

### 2. Créer la migration de suppression

```bash
npx prisma migrate dev --name remove_entretien_tables --create-only
```

### 3. Modifier le fichier de migration

Ajouter dans le fichier de migration généré :

```sql
-- Supprimer les foreign keys
ALTER TABLE "EntretienContact" DROP CONSTRAINT IF EXISTS "EntretienContact_entretienId_fkey";
ALTER TABLE "EntretienContact" DROP CONSTRAINT IF EXISTS "EntretienContact_contactId_fkey";
ALTER TABLE "Entretien" DROP CONSTRAINT IF EXISTS "Entretien_userId_fkey";
ALTER TABLE "Entretien" DROP CONSTRAINT IF EXISTS "Entretien_workOpportunityId_fkey";
ALTER TABLE "Entretien" DROP CONSTRAINT IF EXISTS "Entretien_contactChannelId_fkey";

-- Supprimer les tables
DROP TABLE IF EXISTS "EntretienContact";
DROP TABLE IF EXISTS "Entretien";

-- Supprimer le champ legacyEntretienId de OpportunityAction
ALTER TABLE "OpportunityAction" DROP COLUMN IF EXISTS "legacyEntretienId";
DROP INDEX IF EXISTS "OpportunityAction_legacyEntretienId_key";

-- Supprimer les relations dans le schéma Prisma
-- (à faire manuellement dans schema.prisma)
```

### 4. Mettre à jour le schéma Prisma

Supprimer dans `schema.prisma` :
- Le modèle `Entretien`
- Le modèle `EntretienContact`
- La relation `entretiens` dans `User`
- La relation `entretiens` dans `WorkOpportunity`
- La relation `entretiens` dans `ContactChannel`
- La relation `entretienLinks` dans `Contact`
- Le champ `legacyEntretienId` dans `OpportunityAction`

### 5. Appliquer la migration

```bash
npx prisma migrate dev
npx prisma generate
```

### 6. Nettoyer le code

Supprimer ou commenter :
- `src/lib/services/entretiens.ts`
- `src/app/api/entretiens/**`
- `src/lib/validators/entretien.ts`
- `src/lib/dto/entretien.ts`
- `src/components/entretiens/**`
- `src/app/(app)/entretiens/**`

### 7. Tests de régression

- ✅ Vérifier que les actions sont bien créées
- ✅ Vérifier que la timeline s'affiche correctement
- ✅ Vérifier que les filtres fonctionnent
- ✅ Vérifier que les participants sont bien associés

## Rollback

Si nécessaire, restaurer depuis une sauvegarde de la base de données avant la migration phase 2.

