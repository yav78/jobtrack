# Règles de développement - Jobtrack

## Contexte du projet

Jobtrack est un mini CRM de recherche d'emploi construit avec :
- **Next.js 16** (App Router) avec route handlers API
- **Prisma** + PostgreSQL pour la base de données
- **TailwindCSS** avec dark mode
- **Zod** pour la validation
- **Vitest** pour les tests
- **TypeScript** strict

## Conventions de code

### TypeScript
- Utiliser TypeScript strict
- Préférer les types explicites plutôt que `any`
- Utiliser les types Prisma générés (`Prisma.CompanyCreateInput`, etc.)
- Valider toutes les entrées utilisateur avec Zod

### Structure des fichiers
- Routes API dans `src/app/api/`
- Composants réutilisables dans `src/components/`
- Utilitaires et helpers dans `src/lib/`
- Hooks personnalisés dans `src/hooks/`
- Tests dans `src/tests/`

### API Routes
- Toutes les routes API doivent :
  - Accepter le header `X-User-Id` (avec fallback sur `AUTH_DEMO_USER_ID`)
  - Valider les entrées avec Zod
  - Retourner des réponses JSON cohérentes
  - Gérer les erreurs proprement (try/catch)
  - Utiliser les types Prisma pour les requêtes

### Validation
- Toujours utiliser Zod pour valider les données entrantes
- Créer des schémas Zod réutilisables dans `src/lib/validators/`
- Valider les IDs (UUID) avant les requêtes DB

### Base de données
- Utiliser Prisma Client pour toutes les requêtes
- Respecter les contraintes d'unicité partielles (location primaire, channel primaire)
- Utiliser les transactions pour les opérations multi-tables
- Gérer les erreurs Prisma (P2002 pour les uniques, etc.)

### Composants React
- Utiliser des composants fonctionnels avec hooks
- Préférer les Server Components quand possible (Next.js App Router)
- Utiliser TailwindCSS pour le styling
- Respecter le dark mode (utiliser les classes dark: de Tailwind)

### Tests
- Écrire des tests unitaires pour les validateurs Zod
- Écrire des tests d'intégration pour les routes API
- Utiliser Vitest comme framework de test
- Tester les cas d'erreur et les cas limites

## Bonnes pratiques

### Sécurité
- Ne jamais exposer les credentials dans le code
- Valider et sanitizer toutes les entrées utilisateur
- Utiliser les types Prisma pour éviter les injections SQL

### Performance
- Utiliser les Server Components pour réduire le JavaScript côté client
- Optimiser les requêtes Prisma (select uniquement les champs nécessaires)
- Utiliser la pagination pour les listes

### Code quality
- Suivre les règles ESLint configurées
- Formater le code avec Prettier
- Écrire du code lisible et bien commenté
- Utiliser des noms de variables et fonctions explicites

## Patterns spécifiques au projet

### Authentification
- Utiliser `X-User-Id` header pour identifier l'utilisateur
- Fallback sur `AUTH_DEMO_USER_ID` si le header n'est pas présent
- Ne pas exposer les IDs utilisateur dans les URLs publiques

### Gestion des erreurs
- Retourner des codes HTTP appropriés (400, 404, 500, etc.)
- Inclure des messages d'erreur clairs dans les réponses JSON
- Logger les erreurs serveur pour le debugging

### Format des réponses API
```typescript
// Succès
{ data: {...}, message?: string }

// Erreur
{ error: string, details?: any }
```

## Commandes utiles

```bash
npm run dev        # Démarrer le serveur de développement
npm run lint       # Vérifier le code avec ESLint
npm run format     # Formater le code avec Prettier
npm run test       # Lancer les tests Vitest
npm run db:seed    # Seed la base de données
```

## Notes importantes

- Le projet utilise le dark mode par défaut
- Les uniques partielles sont gérées via des migrations SQL
- Tous les endpoints principaux sont documentés dans le README
- Respecter la structure de données Prisma définie dans `prisma/schema.prisma`

## Architecture
## Services
- Les services du dossier `src/lib/services/front/` ne seront utilisés que pour les composants coté client et qui seront annoter `'use client'`.
- Les services du dossier `src/lib/services/` sauf le dossier `front` à l'interieur ne seront utilisé que pour les composants qui seront utilisé coté server, c'est à dire les composants rendu par le serveur (SSR). D'ailleurs à terme, les "services back"  seront transferer vers le dossier `src/lib/services/back` à terme.
- La différence entre un service back et un service front est l'utilisataion de la fonction `fetch` dans le **service front** qui va taper les routes `/api/*` . Le service back, lui pourra utiliser `prisma` ou tout autre élément necessaire au traitement coté serveur.

En résumer :  
- `src/lib/services/front/` pour les services fronts
- `src/lib/services/back/` pour les services backs (coté serveur)

