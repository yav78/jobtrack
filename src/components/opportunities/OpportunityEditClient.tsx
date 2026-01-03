"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { OpportunityEditForm } from "./OpportunityEditForm";
import type { WorkOpportunityDTO } from "@/lib/dto/opportunity";

type Props = {
  opportunity: WorkOpportunityDTO;
};

export function OpportunityEditClient({ opportunity: initialOpportunity }: Props) {
  const router = useRouter();
  const [opportunity, setOpportunity] = useState(initialOpportunity);
  const [isEditing, setIsEditing] = useState(false);

  const handleSuccess = (updatedOpportunity: WorkOpportunityDTO) => {
    setOpportunity(updatedOpportunity);
    setIsEditing(false);
    router.refresh();
  };

  if (isEditing) {
    return (
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Modifier l'opportunité</h3>
          <button
            onClick={() => setIsEditing(false)}
            className="text-xs text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            Annuler
          </button>
        </div>
        <OpportunityEditForm
          opportunity={opportunity}
          onSuccess={handleSuccess}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{opportunity.title}</h1>
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-emerald-600 hover:underline dark:text-emerald-400"
            >
              Modifier
            </button>
          </div>
          {opportunity.company && (
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Entreprise:{" "}
              <Link
                href={`/companies/${opportunity.company.id}`}
                className="text-emerald-600 hover:underline dark:text-emerald-400"
              >
                {opportunity.company.name}
              </Link>
            </p>
          )}
          {opportunity.description && (
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300 whitespace-pre-line">
              {opportunity.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

