"use client";

import { useState } from "react";
import { StandaloneActionForm } from "@/components/actions/StandaloneActionForm";

type Props = {
  contactId: string;
  companyId: string;
};

export function ContactAddActionClient({ contactId, companyId }: Props) {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="rounded bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700"
      >
        Ajouter une action
      </button>
      <StandaloneActionForm
        open={showForm}
        onClose={() => setShowForm(false)}
        defaultContactId={contactId}
        defaultCompanyId={companyId}
      />
    </>
  );
}
