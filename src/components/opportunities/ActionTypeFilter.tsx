"use client";

import type { OpportunityActionType } from "@prisma/client";

const ACTION_TYPES: Array<{ value: OpportunityActionType | "ALL"; label: string }> = [
  { value: "ALL", label: "Toutes" },
  { value: "INTERVIEW", label: "Entretiens" },
  { value: "CALL", label: "Appels" },
  { value: "MESSAGE", label: "Messages" },
  { value: "FOLLOW_UP", label: "Relances" },
  { value: "OFFER_RECEIVED", label: "Offres reçues" },
  { value: "OFFER_ACCEPTED", label: "Offres acceptées" },
  { value: "REJECTED", label: "Refus" },
  { value: "NOTE", label: "Notes" },
  { value: "APPLIED", label: "Candidatures" },
  { value: "INBOUND_CONTACT", label: "Contacts entrants" },
  { value: "OUTBOUND_CONTACT", label: "Contacts sortants" },
];

type Props = {
  value: OpportunityActionType | "ALL" | null;
  onChange: (type: OpportunityActionType | "ALL" | null) => void;
};

export function ActionTypeFilter({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {ACTION_TYPES.map((type) => (
        <button
          key={type.value}
          type="button"
          onClick={() => onChange(type.value === "ALL" ? null : type.value)}
          className={`rounded px-3 py-1 text-sm transition ${
            (value === null && type.value === "ALL") || value === type.value
              ? "bg-emerald-600 text-white"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          }`}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
}

