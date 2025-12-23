import type { OpportunityActionType } from "@prisma/client";

export const ACTION_TYPE_LABELS: Record<OpportunityActionType, string> = {
  INTERVIEW: "Entretien",
  APPLIED: "Candidature",
  INBOUND_CONTACT: "Contact entrant",
  OUTBOUND_CONTACT: "Contact sortant",
  MESSAGE: "Message",
  CALL: "Appel",
  FOLLOW_UP: "Relance",
  OFFER_RECEIVED: "Offre reçue",
  OFFER_ACCEPTED: "Offre acceptée",
  REJECTED: "Refus",
  NOTE: "Note",
};

export const ACTION_TYPE_ORDER: OpportunityActionType[] = [
  "APPLIED",
  "INTERVIEW",
  "FOLLOW_UP",
  "MESSAGE",
  "CALL",
  "INBOUND_CONTACT",
  "OUTBOUND_CONTACT",
  "OFFER_RECEIVED",
  "OFFER_ACCEPTED",
  "REJECTED",
  "NOTE",
];

export const ACTION_TYPE_COLORS: Record<OpportunityActionType | "DEFAULT", string> = {
  INTERVIEW: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  APPLIED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  INBOUND_CONTACT: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  OUTBOUND_CONTACT: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  MESSAGE: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  CALL: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  FOLLOW_UP: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  OFFER_RECEIVED: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  OFFER_ACCEPTED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  NOTE: "bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200",
  DEFAULT: "bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200",
};
