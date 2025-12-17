<!--
Sync Impact Report:
Version change: N/A → 1.0.0 (initial creation)
Modified principles: N/A (new constitution)
Added sections: Core Principles (5 principles), Code Quality Standards, User Experience Standards, Performance Requirements, Governance
Removed sections: N/A
Templates requiring updates:
  ✅ plan-template.md - Constitution Check section will reference new principles
  ✅ spec-template.md - No changes needed (already generic)
  ✅ tasks-template.md - No changes needed (already generic)
Follow-up TODOs: None
-->

# Jobtrack Constitution

## Core Principles

### I. Code Quality Standards (NON-NEGOTIABLE)
Tous les code soumis DOIT respecter les standards de qualité suivants :
- Code MUST être lisible, maintenable et documenté avec des commentaires explicites pour la logique métier complexe
- Noms de variables, fonctions et classes MUST être descriptifs et suivre les conventions du langage utilisé
- Complexité cyclomatique MUST rester sous 10 par fonction/méthode ; refactoriser si dépassée
- Code dupliqué MUST être éliminé via extraction de fonctions/classes réutilisables
- Tous les fichiers MUST passer les linters et formatters configurés sans erreurs
- Code mort (unreachable) et imports inutilisés MUST être supprimés avant commit

**Rationale** : La qualité du code est fondamentale pour la maintenabilité à long terme et la collaboration efficace. Jobtrack étant une application de suivi de contacts critiques pour la recherche d'emploi, le code doit être fiable et facile à comprendre.

### II. Test-First Development (NON-NEGOTIABLE)
TDD strictement appliqué pour toute nouvelle fonctionnalité :
- Tests MUST être écrits AVANT l'implémentation (Red-Green-Refactor)
- Tests MUST échouer initialement, puis passer après implémentation
- Couverture de code MUST atteindre au minimum 80% pour le code métier (services, modèles, logique)
- Tests critiques (authentification, persistance, calculs) MUST avoir une couverture de 100%
- Tests MUST être indépendants, rapides (<100ms par test unitaire) et reproductibles
- Tests d'intégration MUST couvrir tous les flux utilisateur critiques

**Rationale** : Les tests garantissent la fiabilité de l'application et permettent des refactorisations en toute confiance. Pour une application de suivi de contacts professionnels, la perte de données serait catastrophique.

### III. Testing Standards & Coverage
Standards de test obligatoires :
- Tests unitaires : chaque fonction/service isolé avec mocks appropriés
- Tests d'intégration : interactions entre composants (base de données, API, services)
- Tests de contrat : validation des interfaces API et schémas de données
- Tests end-to-end : parcours utilisateur complets pour les fonctionnalités critiques
- Tests de régression : suite complète MUST passer avant chaque merge
- Tests de performance : validation des seuils de performance pour les opérations critiques

**Rationale** : Une suite de tests complète et maintenue est la seule garantie contre les régressions et les bugs en production.

### IV. User Experience Consistency
Cohérence de l'expérience utilisateur à travers toute l'application :
- Interface utilisateur MUST suivre un design system unifié (couleurs, typographie, espacements, composants)
- Navigation MUST être intuitive et cohérente entre toutes les pages/écrans
- Messages d'erreur MUST être clairs, actionnables et dans un langage compréhensible
- Feedback utilisateur MUST être immédiat pour toutes les actions (chargement, succès, erreur)
- Accessibilité MUST respecter WCAG 2.1 niveau AA minimum (contraste, navigation clavier, labels)
- Responsive design MUST fonctionner sur desktop, tablette et mobile

**Rationale** : Une expérience utilisateur cohérente réduit la courbe d'apprentissage et améliore la productivité des utilisateurs qui suivent leurs contacts professionnels.

### V. Performance Requirements
Exigences de performance non-négociables :
- Temps de chargement initial MUST être < 2 secondes (First Contentful Paint)
- Temps de réponse API MUST être < 200ms pour le p95 des requêtes
- Opérations CRUD critiques (création/modification de contact) MUST compléter en < 500ms
- Recherche et filtrage MUST retourner résultats en < 300ms même avec 10k+ contacts
- Application MUST supporter au minimum 100 utilisateurs concurrents sans dégradation
- Base de données MUST être optimisée avec index appropriés sur colonnes de recherche/filtrage fréquentes

**Rationale** : La performance impacte directement la productivité des utilisateurs. Des temps de réponse lents peuvent décourager l'utilisation régulière de l'application pour le suivi de contacts.

## Code Quality Standards

### Linting & Formatting
- Configuration de linter MUST être partagée et appliquée automatiquement (pre-commit hooks)
- Formatage automatique MUST être configuré et appliqué avant chaque commit
- Violations de linting bloquantes MUST être corrigées avant merge

### Code Review Requirements
- Tous les PRs MUST être revus par au moins un autre développeur
- Reviewers MUST vérifier la conformité aux principes de la constitution
- Complexité ajoutée MUST être justifiée dans le PR description
- Tests MUST être inclus et passer pour toute nouvelle fonctionnalité

## User Experience Standards

### Design System
- Composants UI réutilisables MUST être documentés avec exemples
- Variations de composants (états, tailles) MUST être cohérentes
- Thème (couleurs, espacements) MUST être centralisé et facilement modifiable

### Error Handling
- Messages d'erreur MUST guider l'utilisateur vers une solution
- Erreurs techniques MUST être loggées avec contexte complet
- Interface MUST rester utilisable même en cas d'erreur partielle

## Performance Requirements

### Monitoring & Optimization
- Métriques de performance MUST être collectées et monitorées en production
- Alertes MUST être configurées pour dépassement des seuils de performance
- Profiling régulier MUST être effectué pour identifier les goulots d'étranglement
- Optimisations MUST être documentées avec benchmarks avant/après

### Scalability
- Architecture MUST supporter la croissance du nombre d'utilisateurs et de données
- Requêtes base de données MUST être optimisées (éviter N+1, utiliser pagination)
- Cache MUST être utilisé stratégiquement pour les données fréquemment accédées

## Governance

Cette constitution est le document suprême pour toutes les décisions de développement de Jobtrack. Elle prime sur toutes les autres pratiques et conventions.

### Amendment Procedure
- Toute modification de la constitution REQUIERT une discussion d'équipe et un consensus
- Modifications MUST être documentées avec justification dans le Sync Impact Report
- Version MUST être incrémentée selon le versioning sémantique :
  - **MAJOR** : Suppression ou redéfinition incompatible de principes
  - **MINOR** : Ajout de nouveaux principes ou sections
  - **PATCH** : Clarifications, corrections de typo, affinements non-sémantiques

### Compliance Review
- Tous les PRs/reviews MUST vérifier la conformité aux principes de cette constitution
- Violations MUST être documentées et justifiées dans la section "Complexity Tracking" du plan
- Revue de conformité trimestrielle MUST être effectuée pour identifier les écarts systémiques

### Development Guidance
- Utiliser les templates dans `.specify/templates/` pour garantir la conformité
- Constitution Check dans `plan-template.md` MUST être complété avant Phase 0
- Toute exception aux principes MUST être explicitement justifiée et documentée

**Version**: 1.0.0 | **Ratified**: 2025-12-16 | **Last Amended**: 2025-12-16
