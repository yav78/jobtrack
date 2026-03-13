export const OPPORTUNITY_STATUS_LABELS: Record<string, string> = {
  SOURCING: "En veille",
  APPLIED: "Candidaté",
  INTERVIEW: "Entretien",
  OFFER_RECEIVED: "Offre reçue",
  OFFER_ACCEPTED: "Offre acceptée",
  REJECTED: "Refus",
};

export const OPPORTUNITY_STATUS_COLORS: Record<string, string> = {
  SOURCING:
    "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  APPLIED:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  INTERVIEW:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  OFFER_RECEIVED:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  OFFER_ACCEPTED:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  REJECTED:
    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

export const OPPORTUNITY_STATUS_ORDER: string[] = [
  "SOURCING",
  "APPLIED",
  "INTERVIEW",
  "OFFER_RECEIVED",
  "OFFER_ACCEPTED",
  "REJECTED",
];
