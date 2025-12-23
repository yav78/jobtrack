"use client";

import { useState } from "react";
import { ActionForm } from "./ActionForm";

type Props = {
  opportunityId: string;
  companyId?: string | null;
};

export function ActionPageClient({ opportunityId, companyId }: Props) {
  const [showForm, setShowForm] = useState(false);

  if (!opportunityId) {
    console.error("ActionPageClient: opportunityId is undefined");
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="rounded bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700"
      >
        Ajouter une action
      </button>
      <ActionForm
        opportunityId={opportunityId}
        open={showForm}
        onClose={() => setShowForm(false)}
        companyId={companyId}
      />
    </>
  );
}

