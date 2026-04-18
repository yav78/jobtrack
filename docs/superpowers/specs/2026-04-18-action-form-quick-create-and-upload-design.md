# Design : Création rapide contact/entreprise et upload fichier depuis le formulaire d'action

**Date :** 2026-04-18  
**Scope :** `StandaloneActionForm` uniquement  
**Backend :** aucun changement nécessaire

---

## Contexte

`StandaloneActionForm` permet de créer et modifier des actions. Actuellement :
- Le champ contact propose uniquement de sélectionner parmi les contacts existants.
- Le champ entreprise propose uniquement de sélectionner parmi les entreprises existantes.
- L'upload de documents n'est disponible qu'en mode édition (via `ActionDocumentPicker` qui requiert un `actionId`).

---

## Objectif

En **mode création et modification** :
- Créer un contact à la volée si il n'existe pas encore.
- Créer une entreprise à la volée si elle n'existe pas encore.

En **mode création uniquement** :
- Uploader un ou plusieurs fichiers pendant le remplissage du formulaire.
- Les documents sont uploadés immédiatement (ils existent dans la bibliothèque), mais la liaison à l'action se fait au moment de la soumission du formulaire.

---

## Architecture

### Fichiers modifiés

| Fichier | Changement |
|---|---|
| `src/components/actions/StandaloneActionForm.tsx` | Seul fichier modifié |

### Composants réutilisés (sans modification)

| Composant | Usage |
|---|---|
| `src/components/contacts/ContactForm.tsx` | Formulaire complet de création contact (inclut déjà la création d'entreprise via `CompanyQuickCreateModal`) |
| `src/components/companies/CompanyQuickCreateModal.tsx` | Modale création entreprise légère (nom + type) |
| `src/components/documents/DocumentUploadForm.tsx` | Formulaire upload document (déjà un `<div>`, pas de `<form>` imbriqué) |

### Aucun changement backend

Les API existantes couvrent tous les besoins :
- `POST /api/contacts` — création contact
- `POST /api/companies` — création entreprise  
- `POST /api/documents` — upload document
- `POST /api/documents/:id/actions/:actionId` — liaison document ↔ action

---

## Détail des changements dans `StandaloneActionForm`

### 1. Imports ajoutés

```typescript
import { ContactForm } from "@/components/contacts/ContactForm";
import { CompanyQuickCreateModal } from "@/components/companies/CompanyQuickCreateModal";
import { DocumentUploadForm } from "@/components/documents/DocumentUploadForm";
import { documentService } from "@/lib/services/front/document.service";
import type { DocumentDTO } from "@/lib/dto/document";
```

### 2. States ajoutés

```typescript
const [showContactModal, setShowContactModal] = useState(false);
const [showCompanyModal, setShowCompanyModal] = useState(false);
const [pendingDocuments, setPendingDocuments] = useState<DocumentDTO[]>([]);
const [showUploadForm, setShowUploadForm] = useState(false);
```

Reset de `pendingDocuments` et `showUploadForm` dans le reset post-submit.

### 3. Création de contact

**UI :** bouton "+ Créer" à côté du select contact.

**Callback `handleContactCreated(contact: ContactDTO)` :**
```typescript
function handleContactCreated(contact: ContactDTO) {
  setAllContacts((prev) => [contact, ...prev]);
  onContactSelect(contact.id); // réutilise la fonction existante
  setShowContactModal(false);
}
```

**Modal** : placée hors du `<form>` principal (dans le fragment `<>`), contient `<ContactForm onSuccess={handleContactCreated} />`.

`ContactForm` intègre déjà `CompanyQuickCreateModal` en interne — la création d'entreprise depuis le formulaire contact est donc gratuite.

### 4. Création d'entreprise

**UI :** bouton "+ Créer" à côté du select entreprise.

**Callback `handleCompanyCreated(company: { id: string; name: string })` :**
```typescript
function handleCompanyCreated(company: { id: string; name: string }) {
  setCompanies((prev) => [...prev, company]);
  setForm((f) => ({ ...f, companyId: company.id }));
}
```

**Composant** : `<CompanyQuickCreateModal open={showCompanyModal} onClose={...} onSuccess={handleCompanyCreated} />` placé hors du `<form>`.

### 5. Upload de fichiers (mode création uniquement)

Affiché uniquement quand `!editActionId`.

**UI :**
```
[+ Ajouter un document]   ← bouton toggle

// si showUploadForm = true :
<DocumentUploadForm onSuccess={handleDocumentUploaded} onCancel={() => setShowUploadForm(false)} />

// liste des docs pending :
📄 CV Senior 2024.pdf · 45 Ko   [Retirer]
📄 Lettre motivation.pdf · 32 Ko [Retirer]
```

**Callback `handleDocumentUploaded(doc: DocumentDTO)` :**
```typescript
function handleDocumentUploaded(doc: DocumentDTO) {
  setPendingDocuments((prev) => [doc, ...prev]);
  setShowUploadForm(false);
}
```

**Dans `submit`, après `createStandalone(payload)` :**
```typescript
const newAction = await opportunityActionService.createStandalone(payload);
for (const doc of pendingDocuments) {
  await documentService.linkToAction(newAction.id, doc.id);
}
```

Si un `linkToAction` échoue, l'action est quand même créée — afficher un toast d'avertissement (pas d'erreur bloquante).

### 6. Placement des modales (hors `<form>`)

`Modal` ne fait pas de portail React. Pour éviter les `<form>` imbriqués, toutes les modales secondaires sont placées comme siblings du `<form>` dans le fragment `<>` :

```tsx
<Modal open={open} title={modalTitle} onClose={onClose}>
  <>
    <form onSubmit={submit}>
      {/* ... champs ... */}
    </form>

    {/* Modales secondaires — hors du <form> */}
    <Modal open={showContactModal} ...>
      <ContactForm onSuccess={handleContactCreated} />
    </Modal>
    <CompanyQuickCreateModal open={showCompanyModal} ... onSuccess={handleCompanyCreated} />
    <Modal open={showOpportunityModal} ...>
      <OpportunityForm onSuccess={handleOpportunityCreated} />
    </Modal>
  </>
</Modal>
```

---

## Flux de données — upload fichier en création

```
user clicks "+ Ajouter un document"
  → showUploadForm = true
  → DocumentUploadForm shown inline

user fills title + file + clicks "Uploader"
  → documentService.upload(formData)
  → doc created in DB (exists in library, not linked)
  → handleDocumentUploaded(doc)
    → pendingDocuments = [doc, ...]
    → showUploadForm = false
  → doc appears in pending list

user submits action form
  → createStandalone(payload) → newAction
  → for each pendingDoc: documentService.linkToAction(newAction.id, pendingDoc.id)
  → pendingDocuments = []
  → onClose()
```

---

## Cas limites

- **Annulation du formulaire avec docs pending** : les documents existent dans la bibliothèque mais ne sont liés à rien. Acceptable — ils restent accessibles dans la bibliothèque de documents.
- **Échec d'un `linkToAction`** : action créée, toast d'avertissement "Certains documents n'ont pas pu être liés". Pas de rollback.
- **Mode édition** : `pendingDocuments` et `showUploadForm` non affichés — `ActionDocumentPicker` reste inchangé.
- **`ContactForm` ouvre `CompanyQuickCreateModal`** : troisième niveau de modale. Fonctionne car chaque modale est indépendante (pas de portail requis pour ce cas).
