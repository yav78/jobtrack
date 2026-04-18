# Action Form — Quick-Create Contact/Company + File Upload — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter la création rapide de contact, d'entreprise et l'upload de fichiers directement depuis `StandaloneActionForm`.

**Architecture:** Un seul fichier modifié (`StandaloneActionForm.tsx`). Les composants `ContactForm`, `CompanyQuickCreateModal` et `DocumentUploadForm` sont réutilisés sans modification. Les modales contact et entreprise sont placées hors du `<form>` principal (la `Modal` ne fait pas de portail React). `DocumentUploadForm` est un `<div>` et peut être embedded inline. Les documents uploadés en mode création sont stockés dans `pendingDocuments[]` et liés à l'action après sa création dans `submit`.

**Tech Stack:** Next.js App Router, React, TailwindCSS, TypeScript.

---

## File Map

| Fichier | Action |
|---|---|
| `src/components/actions/StandaloneActionForm.tsx` | Seul fichier modifié |

---

## Task 1 : Création rapide de contact

**Files:**
- Modify: `src/components/actions/StandaloneActionForm.tsx`

- [ ] **Step 1 : Ajouter l'import `ContactForm`**

Après la ligne `import { ActionDocumentPicker } from "@/components/documents/ActionDocumentPicker";`, ajouter :

```typescript
import { ContactForm } from "@/components/contacts/ContactForm";
```

- [ ] **Step 2 : Ajouter le state `showContactModal`**

Après la ligne `const [showOpportunityModal, setShowOpportunityModal] = useState(false);`, ajouter :

```typescript
  const [showContactModal, setShowContactModal] = useState(false);
```

- [ ] **Step 3 : Ajouter `handleContactCreated`**

Après la fonction `handleOpportunityCreated`, ajouter :

```typescript
  function handleContactCreated(contact: ContactDTO) {
    setAllContacts((prev) => [contact, ...prev]);
    onContactSelect(contact.id);
    setShowContactModal(false);
  }
```

Note : `ContactDTO` est déjà importé ligne 8. `onContactSelect` est déjà défini et gère automatiquement le `companyId` et les participants.

- [ ] **Step 4 : Ajouter le bouton "+ Créer" sur le champ contact**

Dans le JSX, remplacer le bloc contact (le `<div className="space-y-1">` qui contient `label "Avec quel contact ?"`) :

```tsx
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Avec quel contact ? (action entre vous et un contact)</label>
              <button
                type="button"
                onClick={() => setShowContactModal(true)}
                className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                + Créer
              </button>
            </div>
            <select
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              value={form.contactId}
              onChange={(e) => onContactSelect(e.target.value)}
            >
              <option value="">Aucun</option>
              {allContacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                  {c.company?.name ? ` — ${c.company.name}` : ""}
                </option>
              ))}
            </select>
          </div>
```

- [ ] **Step 5 : Ajouter la modale contact hors du `<form>`**

Dans le fragment `<>`, après la `<Modal open={showOpportunityModal} ...>`, ajouter :

```tsx
        <Modal
          open={showContactModal}
          title="Nouveau contact"
          onClose={() => setShowContactModal(false)}
        >
          <ContactForm onSuccess={handleContactCreated} />
        </Modal>
```

- [ ] **Step 6 : Vérifier le build TypeScript**

```bash
npm run build 2>&1 | grep -E "error TS|Type error" | head -20
```

Résultat attendu : aucune erreur.

- [ ] **Step 7 : Commit**

```bash
git add src/components/actions/StandaloneActionForm.tsx
git commit -m "feat: add contact quick-create to StandaloneActionForm"
```

---

## Task 2 : Création rapide d'entreprise

**Files:**
- Modify: `src/components/actions/StandaloneActionForm.tsx`

- [ ] **Step 1 : Ajouter l'import `CompanyQuickCreateModal`**

Après la ligne `import { ContactForm } from "@/components/contacts/ContactForm";`, ajouter :

```typescript
import { CompanyQuickCreateModal } from "@/components/companies/CompanyQuickCreateModal";
```

- [ ] **Step 2 : Ajouter le state `showCompanyModal`**

Après la ligne `const [showContactModal, setShowContactModal] = useState(false);`, ajouter :

```typescript
  const [showCompanyModal, setShowCompanyModal] = useState(false);
```

- [ ] **Step 3 : Ajouter `handleCompanyCreated`**

Après la fonction `handleContactCreated`, ajouter :

```typescript
  function handleCompanyCreated(company: { id: string; name: string }) {
    setCompanies((prev) => [...prev, company]);
    setForm((f) => ({ ...f, companyId: company.id }));
  }
```

- [ ] **Step 4 : Ajouter le bouton "+ Créer" sur le champ entreprise**

Dans le JSX, remplacer le bloc entreprise (le `<div className="space-y-1">` qui contient `label "Entreprise (optionnel)"` et son select) :

```tsx
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Entreprise (optionnel)</label>
              <button
                type="button"
                onClick={() => setShowCompanyModal(true)}
                className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                + Créer
              </button>
            </div>
            <select
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              value={form.companyId}
              onChange={(e) => setForm({ ...form, companyId: e.target.value })}
            >
              <option value="">Aucune</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
```

- [ ] **Step 5 : Ajouter `CompanyQuickCreateModal` hors du `<form>`**

Dans le fragment `<>`, après la `<Modal open={showContactModal} ...>`, ajouter :

```tsx
        <CompanyQuickCreateModal
          open={showCompanyModal}
          onClose={() => setShowCompanyModal(false)}
          onSuccess={handleCompanyCreated}
        />
```

Note : `CompanyQuickCreateModal` est déjà une `Modal` — pas besoin de la wrapper.

- [ ] **Step 6 : Vérifier le build TypeScript**

```bash
npm run build 2>&1 | grep -E "error TS|Type error" | head -20
```

Résultat attendu : aucune erreur.

- [ ] **Step 7 : Commit**

```bash
git add src/components/actions/StandaloneActionForm.tsx
git commit -m "feat: add company quick-create to StandaloneActionForm"
```

---

## Task 3 : Upload de fichiers en mode création

**Files:**
- Modify: `src/components/actions/StandaloneActionForm.tsx`

- [ ] **Step 1 : Ajouter les imports `DocumentUploadForm`, `documentService`, `DocumentDTO`**

Après la ligne `import { ContactForm } from "@/components/contacts/ContactForm";`, ajouter :

```typescript
import { DocumentUploadForm } from "@/components/documents/DocumentUploadForm";
import { documentService } from "@/lib/services/front/document.service";
import type { DocumentDTO } from "@/lib/dto/document";
```

- [ ] **Step 2 : Ajouter les states `pendingDocuments` et `showUploadForm`**

Après la ligne `const [showCompanyModal, setShowCompanyModal] = useState(false);`, ajouter :

```typescript
  const [pendingDocuments, setPendingDocuments] = useState<DocumentDTO[]>([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
```

- [ ] **Step 3 : Ajouter `handleDocumentUploaded`**

Après la fonction `handleCompanyCreated`, ajouter :

```typescript
  function handleDocumentUploaded(doc: DocumentDTO) {
    setPendingDocuments((prev) => [doc, ...prev]);
    setShowUploadForm(false);
  }
```

- [ ] **Step 4 : Mettre à jour `submit` — lier les docs pending après création**

Dans la fonction `submit`, remplacer le bloc :

```typescript
      const data =
        isEdit && editActionId
          ? await opportunityActionService.updateStandalone(editActionId, payload)
          : await opportunityActionService.createStandalone(payload);
      pushToast({ type: "success", title: isEdit ? "Action modifiée" : "Action créée" });
      onSuccess?.(data);
      setForm({
        type: "OUTBOUND_CONTACT",
        occurredAt: new Date().toISOString().slice(0, 16),
        notes: "",
        channelTypeCode: "",
        contactId: "",
        companyId: "",
        workOpportunityId: "",
        participantContactIds: [],
      });
      onClose();
      router.refresh();
```

Par :

```typescript
      const data =
        isEdit && editActionId
          ? await opportunityActionService.updateStandalone(editActionId, payload)
          : await opportunityActionService.createStandalone(payload);

      if (!isEdit && pendingDocuments.length > 0) {
        const failed: string[] = [];
        for (const doc of pendingDocuments) {
          try {
            await documentService.linkToAction(data.id, doc.id);
          } catch {
            failed.push(doc.title);
          }
        }
        if (failed.length > 0) {
          pushToast({
            type: "error",
            title: "Certains documents n'ont pas pu être liés",
            description: failed.join(", "),
          });
        }
      }

      pushToast({ type: "success", title: isEdit ? "Action modifiée" : "Action créée" });
      onSuccess?.(data);
      setForm({
        type: "OUTBOUND_CONTACT",
        occurredAt: new Date().toISOString().slice(0, 16),
        notes: "",
        channelTypeCode: "",
        contactId: "",
        companyId: "",
        workOpportunityId: "",
        participantContactIds: [],
      });
      setPendingDocuments([]);
      setShowUploadForm(false);
      onClose();
      router.refresh();
```

- [ ] **Step 5 : Ajouter la section documents dans le JSX (mode création uniquement)**

Dans le JSX, remplacer le bloc `{editActionId && (...)}` (documents liés en édition) par :

```tsx
          {editActionId && (
            <div className="border-t border-neutral-200 pt-4 dark:border-neutral-700">
              <h3 className="mb-2 text-sm font-medium">Documents liés</h3>
              <ActionDocumentPicker actionId={editActionId} />
            </div>
          )}

          {!editActionId && (
            <div className="border-t border-neutral-200 pt-4 dark:border-neutral-700">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium">Documents (optionnel)</h3>
                {!showUploadForm && (
                  <button
                    type="button"
                    onClick={() => setShowUploadForm(true)}
                    className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                  >
                    + Ajouter un document
                  </button>
                )}
              </div>

              {pendingDocuments.length > 0 && (
                <div className="mb-2 divide-y divide-neutral-100 rounded border border-neutral-200 dark:divide-neutral-700 dark:border-neutral-700">
                  {pendingDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-2 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{doc.title}</p>
                        <p className="truncate text-xs text-neutral-400">{doc.originalName}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPendingDocuments((prev) => prev.filter((d) => d.id !== doc.id))}
                        className="shrink-0 rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        Retirer
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {showUploadForm && (
                <DocumentUploadForm
                  onSuccess={handleDocumentUploaded}
                  onCancel={() => setShowUploadForm(false)}
                />
              )}
            </div>
          )}
```

- [ ] **Step 6 : Vérifier le build TypeScript**

```bash
npm run build 2>&1 | grep -E "error TS|Type error" | head -20
```

Résultat attendu : aucune erreur.

- [ ] **Step 7 : Vérifier le lint**

```bash
npm run lint 2>&1 | grep " error " | head -10
```

Résultat attendu : les 2 erreurs pré-existantes dans `DocumentPreviewModal.tsx` uniquement — aucune nouvelle erreur.

- [ ] **Step 8 : Test manuel — upload en création**

1. `npm run dev`
2. Ouvrir "Nouvelle action"
3. Vérifier que la section "Documents (optionnel)" apparaît avec le bouton "+ Ajouter un document"
4. Cliquer "+ Ajouter un document", remplir titre + fichier, cliquer "Uploader"
5. Vérifier que le document apparaît dans la liste pending avec un bouton "Retirer"
6. Soumettre le formulaire
7. Ouvrir l'action créée en modification → vérifier que le document est bien lié dans `ActionDocumentPicker`

- [ ] **Step 9 : Test manuel — retrait d'un doc pending**

1. Ajouter 2 documents en mode création
2. Cliquer "Retirer" sur le premier
3. Vérifier qu'il disparaît de la liste
4. Soumettre → vérifier que seul le second est lié à l'action

- [ ] **Step 10 : Commit**

```bash
git add src/components/actions/StandaloneActionForm.tsx
git commit -m "feat: add pending document upload at action creation"
```
