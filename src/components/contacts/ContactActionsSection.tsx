"use client";

import { useState, useRef } from "react";
import { ActionsListClient, type ActionsListClientHandle } from "@/components/actions/ActionsListClient";
import { StandaloneActionForm } from "@/components/actions/StandaloneActionForm";
import type { OpportunityActionDTO } from "@/lib/dto/opportunity-action";

type Props = {
  contactId: string;
  companyId: string;
};

export function ContactActionsSection({ contactId, companyId }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingAction, setEditingAction] = useState<OpportunityActionDTO | null>(null);
  const listRef = useRef<ActionsListClientHandle>(null);

  const closeForm = () => {
    setShowForm(false);
    setEditingAction(null);
  };

  const handleSuccess = (action: OpportunityActionDTO) => {
    if (editingAction) {
      listRef.current?.updateAction(action);
      setEditingAction(null);
    } else {
      listRef.current?.addAction(action);
    }
  };

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Actions avec ce contact</h3>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700"
        >
          Ajouter une action
        </button>
      </div>

      <ActionsListClient
        ref={listRef}
        contactId={contactId}
        onEdit={(action) => setEditingAction(action)}
      />

      <StandaloneActionForm
        open={showForm || !!editingAction}
        onClose={closeForm}
        onSuccess={handleSuccess}
        defaultContactId={contactId}
        defaultCompanyId={companyId}
        actionId={editingAction?.id}
        initialData={editingAction ?? undefined}
      />
    </div>
  );
}
