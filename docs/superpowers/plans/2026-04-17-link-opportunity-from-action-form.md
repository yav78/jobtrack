# Link Opportunity from Action Form — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un sélecteur d'opportunité dans `StandaloneActionForm` (création et édition), avec la possibilité de créer une opportunité à la volée via une modale secondaire.

**Architecture:** `OpportunityForm` est mis à jour pour retourner l'opportunité créée via `onSuccess`. `StandaloneActionForm` ajoute un champ `workOpportunityId` dans son state, charge la liste des opportunités à l'ouverture, et place la modale de création hors du `<form>` principal pour éviter le bug HTML de formulaires imbriqués (la `Modal` ne fait pas de portail React).

**Tech Stack:** Next.js App Router, React, TailwindCSS, TypeScript.

---

## File Map

| Fichier | Action | Responsabilité |
|---|---|---|
| `src/components/opportunities/OpportunityForm.tsx` | Modifier | `onSuccess` reçoit le `WorkOpportunityDTO` créé |
| `src/components/actions/StandaloneActionForm.tsx` | Modifier | Ajouter champ opportunité, fetch, modale création |

---

## Task 1 : Mettre à jour `OpportunityForm` — `onSuccess` reçoit le DTO

**Files:**
- Modify: `src/components/opportunities/OpportunityForm.tsx`

- [ ] **Step 1 : Ajouter l'import `WorkOpportunityDTO` et mettre à jour le type `Props`**

Remplacer le début du fichier (lignes 1-13) :

```typescript
"use client";

import { useState, useEffect } from "react";
import { pushToast } from "@/components/common/Toast";
import { Modal } from "@/components/common/Modal";
import { CompanyForm } from "@/components/companies/CompanyForm";
import type { CompanyDTO } from "@/lib/dto/company";
import type { WorkOpportunityDTO } from "@/lib/dto/opportunity";
import companyService from "@/lib/services/front/company.service";
import opportunityService from "@/lib/services/front/opportunity.service";

type Props = {
  onSuccess?: (opportunity: WorkOpportunityDTO) => void;
};
```

- [ ] **Step 2 : Capturer le retour de `create` et le passer à `onSuccess`**

Dans la fonction `submit`, remplacer :

```typescript
      await opportunityService.create({
        title: form.title,
        description: form.description || undefined,
        sourceUrl: form.sourceUrl || undefined,
        companyId: form.companyId || undefined,
      });
      pushToast({ type: "success", title: "Opportunité créée" });
      setForm({ title: "", description: "", sourceUrl: "", companyId: "" });
      onSuccess?.();
```

Par :

```typescript
      const created = await opportunityService.create<WorkOpportunityDTO>({
        title: form.title,
        description: form.description || undefined,
        sourceUrl: form.sourceUrl || undefined,
        companyId: form.companyId || undefined,
      });
      pushToast({ type: "success", title: "Opportunité créée" });
      setForm({ title: "", description: "", sourceUrl: "", companyId: "" });
      onSuccess?.(created);
```

- [ ] **Step 3 : Vérifier que le build TypeScript ne produit pas d'erreurs**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Résultat attendu : aucune erreur TypeScript.

- [ ] **Step 4 : Vérifier que les appelants existants de `OpportunityForm` compilent**

Chercher tous les usages de `onSuccess` dans le projet :

```bash
grep -r "onSuccess" src/components/opportunities/ --include="*.tsx"
```

Les usages existants appellent `onSuccess?.()` sans argument — TypeScript accepte ça car le paramètre est optionnel dans la signature. Confirmer qu'aucun fichier ne montre d'erreur.

- [ ] **Step 5 : Commit**

```bash
git add src/components/opportunities/OpportunityForm.tsx
git commit -m "feat: pass created opportunity to OpportunityForm onSuccess callback"
```

---

## Task 2 : Ajouter le champ opportunité dans `StandaloneActionForm`

**Files:**
- Modify: `src/components/actions/StandaloneActionForm.tsx`

- [ ] **Step 1 : Ajouter les imports**

Après la ligne `import opportunityActionService from "@/lib/services/front/opportunity-action.service";`, ajouter :

```typescript
import opportunityService from "@/lib/services/front/opportunity.service";
import type { WorkOpportunityDTO } from "@/lib/dto/opportunity";
import { OpportunityForm } from "@/components/opportunities/OpportunityForm";
```

- [ ] **Step 2 : Ajouter les nouveaux states**

Après la ligne `const [channelTypes, setChannelTypes] = useState<ChannelTypeDTO[]>([]);`, ajouter :

```typescript
  const [opportunities, setOpportunities] = useState<WorkOpportunityDTO[]>([]);
  const [showOpportunityModal, setShowOpportunityModal] = useState(false);
```

- [ ] **Step 3 : Ajouter `workOpportunityId` dans le state du formulaire**

Remplacer le `useState` du form :

```typescript
  const [form, setForm] = useState({
    type: "OUTBOUND_CONTACT" as OpportunityActionType,
    occurredAt: new Date().toISOString().slice(0, 16),
    notes: "",
    channelTypeCode: "",
    contactId: "" as string,
    companyId: "" as string,
    workOpportunityId: "" as string,
    participantContactIds: [] as string[],
  });
```

- [ ] **Step 4 : Mettre à jour le `useEffect([open])` — fetch + pré-remplissage**

Remplacer le premier `useEffect` entièrement :

```typescript
  useEffect(() => {
    if (open) {
      fetchCompanies().then(setCompanies);
      fetchAllContacts().then(setAllContacts);
      fetchChannelTypes().then(setChannelTypes);
      opportunityService.listAll().then(setOpportunities).catch(() => {});
      if (initialData) {
        const d = new Date(initialData.occurredAt);
        const pad = (n: number) => String(n).padStart(2, "0");
        const occurredAtLocal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setForm({
          type: initialData.type,
          occurredAt: occurredAtLocal,
          notes: initialData.notes ?? "",
          channelTypeCode: initialData.channelTypeCode ?? "",
          contactId: initialData.contactId ?? "",
          companyId: initialData.companyId ?? "",
          workOpportunityId: initialData.workOpportunityId ?? "",
          participantContactIds:
            initialData.participants?.map((p) => p.contactId) ?? [],
        });
      } else if (defaultContactId) {
        setForm((f) => ({
          ...f,
          contactId: defaultContactId,
          companyId: defaultCompanyId ?? f.companyId,
          workOpportunityId: defaultWorkOpportunityId ?? "",
          participantContactIds: [defaultContactId],
        }));
      } else {
        setForm((f) => ({
          ...f,
          contactId: "",
          companyId: "",
          workOpportunityId: defaultWorkOpportunityId ?? "",
          participantContactIds: [],
        }));
      }
    }
  }, [open, defaultContactId, defaultCompanyId, defaultWorkOpportunityId, initialData]);
```

Note : `defaultWorkOpportunityId` est ajouté au tableau de dépendances.

- [ ] **Step 5 : Mettre à jour le payload dans `submit`**

Dans la fonction `submit`, remplacer :

```typescript
        workOpportunityId: defaultWorkOpportunityId || undefined,
```

Par :

```typescript
        workOpportunityId: form.workOpportunityId || undefined,
```

- [ ] **Step 6 : Réinitialiser `workOpportunityId` après submit**

Dans `submit`, après `onSuccess?.(data)`, remplacer le `setForm` de reset :

```typescript
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
```

- [ ] **Step 7 : Ajouter `handleOpportunityCreated`**

Après la fonction `onContactSelect`, ajouter :

```typescript
  function handleOpportunityCreated(opp: WorkOpportunityDTO) {
    setOpportunities((prev) => [opp, ...prev]);
    setForm((f) => ({ ...f, workOpportunityId: opp.id }));
    setShowOpportunityModal(false);
  }
```

- [ ] **Step 8 : Ajouter le champ opportunité dans le JSX**

Dans le `return`, avant le bloc `<div className="space-y-1">` du champ **Type** (qui contient `label "Type"` et le select des `ACTION_TYPES`), insérer :

```tsx
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Opportunité (optionnel)</label>
            <button
              type="button"
              onClick={() => setShowOpportunityModal(true)}
              className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              + Créer
            </button>
          </div>
          <select
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            value={form.workOpportunityId}
            onChange={(e) => setForm({ ...form, workOpportunityId: e.target.value })}
          >
            <option value="">Aucune</option>
            {opportunities.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title}{o.company?.name ? ` — ${o.company.name}` : ""}
              </option>
            ))}
          </select>
        </div>
```

- [ ] **Step 9 : Placer la modale opportunité hors du `<form>` et wrapper en fragment**

Remplacer le `return` entier pour wrapper en `<>...</>` et ajouter la modale comme sibling du `<form>` :

```tsx
  return (
    <Modal open={open} title={modalTitle} onClose={onClose}>
      <>
        <form className="space-y-4" onSubmit={submit}>
          {/* --- champ Avec quel contact --- */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Avec quel contact ? (action entre vous et un contact)</label>
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

          {/* --- champ Opportunité --- */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Opportunité (optionnel)</label>
              <button
                type="button"
                onClick={() => setShowOpportunityModal(true)}
                className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                + Créer
              </button>
            </div>
            <select
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              value={form.workOpportunityId}
              onChange={(e) => setForm({ ...form, workOpportunityId: e.target.value })}
            >
              <option value="">Aucune</option>
              {opportunities.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}{o.company?.name ? ` — ${o.company.name}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* --- champ Type --- */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Type</label>
            <select
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as OpportunityActionType })}
              required
            >
              {ACTION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* --- champ Date --- */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Date et heure</label>
            <input
              type="datetime-local"
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              value={form.occurredAt}
              onChange={(e) => setForm({ ...form, occurredAt: e.target.value })}
              required
            />
          </div>

          {/* --- champ Entreprise --- */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Entreprise (optionnel)</label>
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

          {/* --- participants --- */}
          {contactsByCompany.length > 0 && (
            <div className="space-y-1">
              <label className="text-sm font-medium">Autres participants (optionnel)</label>
              <div className="max-h-32 space-y-1 overflow-y-auto rounded border border-neutral-300 p-2 dark:border-neutral-700">
                {contactsByCompany.map((contact) => (
                  <label key={contact.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.participantContactIds.includes(contact.id)}
                      onChange={() => toggleParticipant(contact.id)}
                    />
                    <span>
                      {contact.firstName} {contact.lastName}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* --- champ Canal --- */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Type de canal (optionnel)</label>
            <select
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              value={form.channelTypeCode}
              onChange={(e) => setForm({ ...form, channelTypeCode: e.target.value })}
            >
              <option value="">Aucun</option>
              {channelTypes.map((channelType) => (
                <option key={channelType.code} value={channelType.code}>
                  {channelType.label}
                </option>
              ))}
            </select>
          </div>

          {/* --- champ Notes --- */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Notes (optionnel)</label>
            <textarea
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
            />
          </div>

          {/* --- documents (mode édition) --- */}
          {editActionId && (
            <div className="border-t border-neutral-200 pt-4 dark:border-neutral-700">
              <h3 className="mb-2 text-sm font-medium">Documents liés</h3>
              <ActionDocumentPicker actionId={editActionId} />
            </div>
          )}

          {/* --- boutons --- */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "En cours..." : isEdit ? "Enregistrer" : "Créer"}
            </button>
          </div>
        </form>

        {/* --- modale création opportunité (hors du <form>) --- */}
        <Modal
          open={showOpportunityModal}
          title="Nouvelle opportunité"
          onClose={() => setShowOpportunityModal(false)}
        >
          <OpportunityForm onSuccess={handleOpportunityCreated} />
        </Modal>
      </>
    </Modal>
  );
```

- [ ] **Step 10 : Vérifier le build**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

Résultat attendu : aucune erreur TypeScript.

- [ ] **Step 11 : Vérifier le lint**

```bash
npm run lint 2>&1 | tail -20
```

Résultat attendu : pas d'erreurs (warnings acceptables).

- [ ] **Step 12 : Test manuel — création d'action avec opportunité existante**

1. Démarrer le serveur : `npm run dev`
2. Ouvrir une page qui contient le formulaire d'action (ex: page d'une action ou tableau de bord)
3. Cliquer "Nouvelle action"
4. Vérifier que le champ "Opportunité (optionnel)" apparaît avec le select peuplé
5. Sélectionner une opportunité et soumettre
6. Vérifier que l'action est créée avec l'opportunité liée

- [ ] **Step 13 : Test manuel — création d'opportunité à la volée**

1. Dans le formulaire d'action, cliquer "+ Créer" à côté de "Opportunité"
2. Vérifier que la modale "Nouvelle opportunité" s'ouvre par-dessus
3. Remplir titre + entreprise, soumettre
4. Vérifier que la modale se ferme, l'opportunité créée est auto-sélectionnée dans le select
5. Soumettre l'action, vérifier qu'elle est liée à la nouvelle opportunité

- [ ] **Step 14 : Test manuel — mode édition avec opportunité pré-sélectionnée**

1. Ouvrir une action existante ayant une `workOpportunityId` en modification
2. Vérifier que le select "Opportunité" est pré-rempli avec la bonne valeur
3. Changer l'opportunité, sauvegarder, vérifier la mise à jour

- [ ] **Step 15 : Commit**

```bash
git add src/components/actions/StandaloneActionForm.tsx
git commit -m "feat: add opportunity selector with quick-create to StandaloneActionForm"
```
