"use client";

import { useRef, useState } from "react";
import { ActionsListClient, type ActionsListClientHandle } from "@/components/actions/ActionsListClient";
import { StandaloneActionForm } from "@/components/actions/StandaloneActionForm";
import type { OpportunityActionDTO } from "@/lib/dto/opportunity-action";

type Props = {
  opportunityId: string;
  companyId?: string | null;
  initialType?: string;
  hideTypeFilter?: boolean;
  emptyMessage?: string;
};

export function OpportunityActionsSection({
  opportunityId,
  companyId,
  initialType,
  hideTypeFilter,
  emptyMessage,
}: Props) {
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
    <div className="space-y-4">
      <div className="flex justify-end">
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
        workOpportunityId={opportunityId}
        initialType={initialType}
        hideTypeFilter={hideTypeFilter}
        hideOpportunityLink
        emptyMessage={emptyMessage}
        onEdit={(action) => setEditingAction(action)}
      />

      <StandaloneActionForm
        open={showForm || !!editingAction}
        onClose={closeForm}
        onSuccess={handleSuccess}
        defaultWorkOpportunityId={opportunityId}
        defaultCompanyId={companyId ?? undefined}
        actionId={editingAction?.id}
        initialData={editingAction ?? undefined}
      />
    </div>
  );
}
