# Design : Lier une opportunité depuis le formulaire d'action

**Date :** 2026-04-17  
**Scope :** `StandaloneActionForm` + `OpportunityForm`  
**Backend :** aucun changement nécessaire

---

## Contexte

Le formulaire `StandaloneActionForm` permet de créer et modifier des actions. Actuellement, le champ `workOpportunityId` n'est pas exposé dans l'UI — il est figé via la prop `defaultWorkOpportunityId`. L'utilisateur ne peut donc pas lier ou modifier l'opportunité associée à une action depuis ce formulaire.

---

## Objectif

- Ajouter un sélecteur d'opportunité dans `StandaloneActionForm`, disponible en création **et** en modification.
- Permettre la création d'une nouvelle opportunité à la volée via une modale secondaire.

---

## Architecture

### Fichiers modifiés

| Fichier | Changement |
|---|---|
| `src/components/opportunities/OpportunityForm.tsx` | `onSuccess` reçoit le DTO créé |
| `src/components/actions/StandaloneActionForm.tsx` | Nouveau champ opportunité + modale création |

### Aucun changement backend

Le PATCH `/api/actions/[actionId]` et le POST `/api/actions` gèrent déjà `workOpportunityId` via `opportunityActionUpdateSchema` / `opportunityActionCreateSchema`.

---

## Détail des changements

### 1. `OpportunityForm` — signature `onSuccess`

```typescript
// Avant
onSuccess?: () => void

// Après
onSuccess?: (opportunity: WorkOpportunityDTO) => void
```

Dans `submit`, capturer le retour de `opportunityService.create<WorkOpportunityDTO>(...)` et le passer à `onSuccess(created)`. Ajouter l'import `WorkOpportunityDTO`.

### 2. `StandaloneActionForm` — champ opportunité

**Nouveaux imports :**
- `opportunityService` depuis `@/lib/services/front/opportunity.service`
- `WorkOpportunityDTO` depuis `@/lib/dto/opportunity`
- `OpportunityForm` depuis `@/components/opportunities/OpportunityForm`

**Nouveaux states :**
```typescript
const [opportunities, setOpportunities] = useState<WorkOpportunityDTO[]>([]);
const [showOpportunityModal, setShowOpportunityModal] = useState(false);
```

**`form` state — nouveau champ :**
```typescript
workOpportunityId: "" as string,
```

**Initialisation (dans `useEffect([open])`) :**
- Fetch parallèle : `opportunityService.listAll().then(setOpportunities)`
- En mode édition : `workOpportunityId: initialData.workOpportunityId ?? ""`
- En mode création : `workOpportunityId: defaultWorkOpportunityId ?? ""`

**Payload dans `submit` :**
```typescript
workOpportunityId: form.workOpportunityId || undefined,
// remplace : defaultWorkOpportunityId || undefined
```

**UI — nouveau champ (placé avant le champ Type) :**
```tsx
<div className="space-y-1">
  <div className="flex items-center justify-between">
    <label className="text-sm font-medium">Opportunité (optionnel)</label>
    <button type="button" onClick={() => setShowOpportunityModal(true)}>
      + Créer
    </button>
  </div>
  <select value={form.workOpportunityId} onChange={...}>
    <option value="">Aucune</option>
    {opportunities.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
  </select>
</div>
```

**Callback après création :**
```typescript
function handleOpportunityCreated(opp: WorkOpportunityDTO) {
  setOpportunities(prev => [opp, ...prev]);
  setForm(f => ({ ...f, workOpportunityId: opp.id }));
  setShowOpportunityModal(false);
}
```

**Placement de la modale — hors du `<form>` :**

`Modal` ne fait pas de portail React (rendu inline). Pour éviter le bug `<form>` imbriqué, la modale opportunité est placée comme sibling du `<form>`, dans un fragment :

```tsx
<Modal open={open} title={modalTitle} onClose={onClose}>
  <>
    <form onSubmit={submit}>
      {/* ... champs ... */}
    </form>
    <Modal open={showOpportunityModal} title="Nouvelle opportunité" onClose={() => setShowOpportunityModal(false)}>
      <OpportunityForm onSuccess={handleOpportunityCreated} />
    </Modal>
  </>
</Modal>
```

---

## Flux de données

```
open modal
  → fetchOpportunities() + fetchCompanies() + fetchContacts() + fetchChannelTypes()
  → pre-fill form.workOpportunityId (initialData ou defaultWorkOpportunityId)

user selects opportunity
  → form.workOpportunityId = selected id

user clicks "+ Créer"
  → showOpportunityModal = true
  → OpportunityForm rendered (hors du <form> principal)
  → user creates opportunity
  → handleOpportunityCreated(opp)
    → opportunities list updated
    → form.workOpportunityId = opp.id
    → showOpportunityModal = false

user submits form
  → payload includes workOpportunityId: form.workOpportunityId || undefined
  → PATCH /api/actions/[id] or POST /api/actions
```

---

## Cas limites

- **Opportunité déjà liée en édition** : pré-sélectionnée dans le select grâce au `workOpportunityId` de `initialData`.
- **`defaultWorkOpportunityId` prop** : pré-sélectionne l'opportunité en mode création (ex: depuis la page opportunité). L'utilisateur peut la changer ou la vider.
- **Opportunité nouvellement créée absente de la liste** : ajoutée en tête de liste localement sans re-fetch.
- **`Modal` sans portail** : la modale opportunité est placée hors du `<form>` pour éviter les formulaires imbriqués.
