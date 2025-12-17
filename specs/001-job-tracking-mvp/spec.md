# Feature Specification: Application MVP de Suivi de Recherche d'Emploi (Mini CRM)

**Feature Branch**: `001-job-tracking-mvp`  
**Created**: 2025-12-16  
**Status**: Draft  
**Input**: User description: "Je veux specifier une application MVP de suivi de recherche demploi (mini CRM)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gérer les Entreprises et leurs Lieux (Priority: P1)

En tant qu'utilisateur en recherche d'emploi, je veux pouvoir créer et gérer des entreprises avec leurs informations de localisation, afin de suivre les entreprises avec lesquelles je suis en contact.

**Why this priority**: La gestion des entreprises est la base du système. Sans entreprises, il n'y a pas de contexte pour les contacts, opportunités ou entretiens. C'est le fondement du CRM.

**Independent Test**: Peut être testé indépendamment en créant une entreprise avec un ou plusieurs lieux, en consultant la liste des entreprises, et en modifiant/supprimant des entreprises. Cette fonctionnalité seule permet déjà de commencer à organiser sa recherche d'emploi.

**Acceptance Scenarios**:

1. **Given** je suis connecté à l'application, **When** je crée une nouvelle entreprise avec un nom, un type, et un site web, **Then** l'entreprise est enregistrée et apparaît dans ma liste d'entreprises
2. **Given** j'ai créé une entreprise, **When** j'ajoute un lieu avec une adresse complète, **Then** le lieu est associé à l'entreprise et marqué comme principal si c'est le premier
3. **Given** une entreprise a plusieurs lieux, **When** je marque un nouveau lieu comme principal, **Then** l'ancien lieu principal est automatiquement décoché et seul le nouveau reste principal
4. **Given** j'ai plusieurs entreprises, **When** je recherche une entreprise par nom, **Then** je vois uniquement les entreprises correspondantes
5. **Given** j'ai créé une entreprise avec le même nom qu'une existante, **When** je tente de sauvegarder, **Then** je reçois une erreur indiquant que le nom d'entreprise doit être unique

---

### User Story 2 - Gérer les Contacts et leurs Canaux de Communication (Priority: P2)

En tant qu'utilisateur, je veux pouvoir créer et gérer des contacts au sein des entreprises, avec leurs différents canaux de communication (email, téléphone, LinkedIn), afin de savoir comment contacter les personnes clés.

**Why this priority**: Les contacts sont essentiels pour établir des relations professionnelles. Sans contacts, il n'est pas possible de planifier des entretiens. Cette fonctionnalité complète la gestion des entreprises.

**Independent Test**: Peut être testé indépendamment en créant un contact avec plusieurs canaux de communication, en consultant la liste des contacts, et en gérant les canaux principaux. Cette fonctionnalité permet de commencer à construire un réseau de contacts.

**Acceptance Scenarios**:

1. **Given** j'ai créé une entreprise, **When** j'ajoute un contact avec prénom, nom et rôle, **Then** le contact est associé à l'entreprise et apparaît dans la liste des contacts de cette entreprise
2. **Given** j'ai créé un contact, **When** j'ajoute un canal de communication (email), **Then** le canal est validé (format email) et associé au contact
3. **Given** un contact a plusieurs emails, **When** je marque un email comme principal, **Then** seul cet email reste principal pour le type "email"
4. **Given** un contact a un email et un téléphone, **When** je marque le téléphone comme principal, **Then** l'email principal reste principal pour son type, et le téléphone devient principal pour son type
5. **Given** j'ajoute un canal avec un format invalide (email mal formé), **When** je tente de sauvegarder, **Then** je reçois une erreur de validation claire

---

### User Story 3 - Gérer les Opportunités de Travail (Priority: P3)

En tant qu'utilisateur, je veux pouvoir créer et suivre des opportunités de travail, afin d'organiser mes candidatures et mes recherches.

**Why this priority**: Les opportunités permettent de structurer la recherche d'emploi. Elles servent de conteneur pour les entretiens et permettent de suivre l'avancement de chaque candidature.

**Independent Test**: Peut être testé indépendamment en créant une opportunité avec titre et description, en consultant la liste des opportunités, et en visualisant les détails. Cette fonctionnalité permet de commencer à organiser ses candidatures.

**Acceptance Scenarios**:

1. **Given** je suis connecté, **When** je crée une nouvelle opportunité avec un titre et une description, **Then** l'opportunité est enregistrée et apparaît dans ma liste d'opportunités
2. **Given** j'ai créé plusieurs opportunités, **When** je consulte la liste, **Then** je vois toutes mes opportunités avec leurs titres et dates de création
3. **Given** j'ai créé une opportunité, **When** je consulte ses détails, **Then** je vois le titre, la description et la liste des entretiens associés (même si vide)
4. **Given** je tente de créer une opportunité sans titre, **When** je sauvegarde, **Then** je reçois une erreur indiquant que le titre est obligatoire

---

### User Story 4 - Gérer les Entretiens et leur Association (Priority: P4)

En tant qu'utilisateur, je veux pouvoir créer des entretiens liés à une opportunité, avec les contacts impliqués et le canal utilisé, afin de garder une trace complète de mes interactions.

**Why this priority**: Les entretiens sont le cœur du suivi. Ils permettent de noter qui a été contacté, quand, via quel canal, et pour quelle opportunité. C'est la fonctionnalité qui transforme l'application en véritable outil de suivi.

**Independent Test**: Peut être testé indépendamment en créant un entretien avec date, opportunité, contacts et canal, puis en consultant l'historique. Cette fonctionnalité permet de commencer à suivre efficacement ses interactions.

**Acceptance Scenarios**:

1. **Given** j'ai créé une opportunité et au moins un contact, **When** je crée un entretien avec date, opportunité, au moins un contact et un canal, **Then** l'entretien est enregistré et associé à l'opportunité
2. **Given** j'ai créé un entretien, **When** je consulte les détails de l'opportunité, **Then** je vois la liste de tous les entretiens associés avec leurs dates et contacts
3. **Given** je crée un entretien, **When** j'associe plusieurs contacts, **Then** tous les contacts sont liés à l'entretien et apparaissent dans les détails
4. **Given** je tente de créer un entretien sans contact, **When** je sauvegarde, **Then** je reçois une erreur indiquant qu'au moins un contact est requis
5. **Given** je tente de créer un entretien sans date, opportunité ou canal, **When** je sauvegarde, **Then** je reçois des erreurs de validation pour chaque champ manquant
6. **Given** j'ai créé un entretien avec plusieurs contacts, **When** je retire un contact de l'entretien, **Then** le contact est retiré mais l'entretien reste avec les autres contacts
7. **Given** j'ai créé plusieurs entretiens pour une opportunité, **When** je consulte l'historique, **Then** je peux voir rapidement qui a été contacté, quand, et via quel canal

---

### Edge Cases

- Que se passe-t-il si un utilisateur tente de créer deux lieux principaux pour la même entreprise ? → Le système doit empêcher cela et décocher automatiquement l'ancien
- Comment le système gère-t-il la suppression d'une entreprise qui a des contacts associés ? → Empêcher la suppression et afficher un message d'erreur demandant de déplacer ou supprimer d'abord les contacts
- Que se passe-t-il si un utilisateur tente de créer un contact sans prénom ou nom ? → Le système doit rejeter avec une erreur de validation claire
- Comment le système gère-t-il la suppression d'un contact qui est associé à des entretiens ? → Empêcher la suppression et afficher un message d'erreur indiquant qu'il existe un historique d'entretiens
- Que se passe-t-il si un utilisateur tente de créer un entretien avec un canal qui n'appartient à aucun des contacts sélectionnés ? → Le système doit permettre cela ou rejeter avec un message clair
- Comment le système gère-t-il la recherche rapide avec un grand nombre d'entreprises/contacts ? → Le système doit retourner les résultats rapidement même avec des milliers d'entrées

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create, read, update, and delete companies with name, type, website, and notes
- **FR-002**: System MUST ensure company names are unique per user
- **FR-003**: System MUST allow users to associate multiple locations with a company, with address details (address line 1, address line 2, zip code, city, country)
- **FR-004**: System MUST enforce that only one location per company can be marked as primary
- **FR-005**: System MUST allow users to create, read, update, and delete contacts within companies, with first name, last name, role title, and notes
- **FR-006**: System MUST require first name and last name for all contacts
- **FR-007**: System MUST allow users to associate multiple communication channels with each contact (email, phone, LinkedIn, etc.)
- **FR-008**: System MUST validate email format when a channel type is email
- **FR-009**: System MUST validate basic phone format when a channel type is phone
- **FR-010**: System MUST enforce that only one channel per type can be marked as primary per contact (e.g., one primary email, one primary phone)
- **FR-011**: System MUST allow users to create, read, update, and delete work opportunities with title and description
- **FR-012**: System MUST require a title for all work opportunities
- **FR-013**: System MUST allow users to create, read, update, and delete interviews (entretiens) with date, work opportunity, at least one contact, and a communication channel
- **FR-014**: System MUST require date, work opportunity, at least one contact, and communication channel for all interviews
- **FR-015**: System MUST allow multiple contacts to be associated with a single interview
- **FR-016**: System MUST allow a contact to be associated with multiple interviews
- **FR-017**: System MUST allow users to add or remove contacts from an existing interview
- **FR-018**: System MUST display the complete history of interviews for a work opportunity, showing date, contacts involved, and channel used
- **FR-019**: System MUST allow users to quickly search and find who was contacted, when, via which channel, and for which opportunity
- **FR-020**: System MUST associate all data (companies, contacts, opportunities, interviews) with the authenticated user
- **FR-021**: System MUST provide list views for companies, contacts, and opportunities with basic information
- **FR-022**: System MUST provide detail views showing all related information (company with locations and contacts, contact with channels, opportunity with interviews)

### Key Entities *(include if feature involves data)*

- **User**: Représente l'utilisateur de l'application. Attributs : fullName, email. Toutes les données sont associées à un utilisateur.

- **Company**: Représente une entreprise avec laquelle l'utilisateur est en contact. Attributs : name (unique par user), typeCode, website, notes. Relations : appartient à un CompanyType, a 0..* Location, a 0..* Contact.

- **CompanyType**: Représente le type d'entreprise (ex: startup, grande entreprise, agence). Attributs : code, label. Relation : plusieurs Company pour un CompanyType.

- **Location**: Représente un lieu/adresse d'une entreprise. Attributs : label, addressLine1, addressLine2, zipCode, city, country, isPrimary. Relation : appartient à une Company (composition), peut être associée à 0..1 Contact (basedAt).

- **Contact**: Représente une personne de contact dans une entreprise. Attributs : firstName, lastName, roleTitle, notes. Relations : appartient à une Company (composition), a 0..* ContactChannel, peut être basé à 0..1 Location, peut être dans 0..* Entretien (many-to-many).

- **ContactChannel**: Représente un canal de communication d'un contact (email, téléphone, LinkedIn, etc.). Attributs : typeCode, value, label, isPrimary. Relations : appartient à un Contact (composition), appartient à un ChannelType, peut être utilisé par 0..* Entretien.

- **ChannelType**: Représente le type de canal (email, phone, LinkedIn, etc.). Attributs : code, label. Relation : plusieurs ContactChannel pour un ChannelType.

- **WorkOpportunity**: Représente une opportunité de travail. Attributs : title, description. Relations : a 0..* Entretien.

- **Entretien**: Représente un entretien ou interaction avec des contacts. Attributs : date. Relations : appartient à un User, appartient à une WorkOpportunity, implique 1..* Contact (many-to-many), utilise un ContactChannel.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a complete company record (with at least one location) in under 1 minute
- **SC-002**: Users can create a contact with at least one communication channel in under 30 seconds
- **SC-003**: Users can create a work opportunity in under 20 seconds
- **SC-004**: Users can create an interview record with all required associations (opportunity, contacts, channel) in under 1 minute
- **SC-005**: Users can retrieve the complete history of interactions (interviews) for any work opportunity in under 2 seconds
- **SC-006**: Users can search and find a specific company, contact, or opportunity from a list of 1000+ entries in under 1 second
- **SC-007**: System prevents data entry errors through validation (duplicate company names, invalid email formats, missing required fields) with clear error messages
- **SC-008**: Users can successfully complete the full workflow: create company → add contact → create opportunity → create interview, without errors, in under 3 minutes
- **SC-009**: All data entered by a user is correctly associated and retrievable (companies show their contacts, opportunities show their interviews, contacts show their channels)
