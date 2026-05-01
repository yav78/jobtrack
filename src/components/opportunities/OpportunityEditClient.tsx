"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { OpportunityEditForm } from "./OpportunityEditForm";
import type { WorkOpportunityDTO } from "@/lib/dto/opportunity";
import {
  OPPORTUNITY_STATUS_LABELS,
  OPPORTUNITY_STATUS_COLORS,
} from "@/constants/opportunityStatus";

type Props = {
  opportunity: WorkOpportunityDTO;
};

function StatusBadge({ status }: { status: string }) {
  const label = OPPORTUNITY_STATUS_LABELS[status] ?? status;
  const color =
    OPPORTUNITY_STATUS_COLORS[status] ??
    "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

export function OpportunityEditClient({ opportunity: initialOpportunity }: Props) {
  const router = useRouter();
  const [opportunity, setOpportunity] = useState(initialOpportunity);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setOpportunity(initialOpportunity);
    }
  }, [initialOpportunity, isEditing]);

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
            type="button"
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

  const followUpDate = opportunity.followUpAt ? new Date(opportunity.followUpAt) : null;
  const isOverdue = followUpDate && followUpDate < new Date();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">{opportunity.title}</h1>
            <StatusBadge status={opportunity.status} />
            <button
              type="button"
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
          {opportunity.concernedCompany && (
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Client final :{" "}
              <Link
                href={`/companies/${opportunity.concernedCompany.id}`}
                className="text-emerald-600 hover:underline dark:text-emerald-400"
              >
                {opportunity.concernedCompany.name}
              </Link>
            </p>
          )}
          {followUpDate && (
            <p
              className={`text-sm ${
                isOverdue
                  ? "font-medium text-red-600 dark:text-red-400"
                  : "text-neutral-600 dark:text-neutral-300"
              }`}
            >
              {isOverdue ? "⚠ Relance en retard — " : "Relance prévue le "}
              {followUpDate.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
          {opportunity.description && (
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300 whitespace-pre-line">
              {opportunity.description}
            </p>
          )}
          {opportunity.sourceUrl && (
            <div className="mt-2 space-y-1">
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Source</p>
              <a
                href={opportunity.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-emerald-600 hover:underline dark:text-emerald-400 break-all"
              >
                {opportunity.sourceUrl}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
