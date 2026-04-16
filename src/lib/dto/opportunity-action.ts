import type { OpportunityActionType } from "@prisma/client";

export type ActionDocumentSummary = {
  id: string;
  title: string;
  originalName: string;
  mimeType: string;
  size: number;
};

export type OpportunityActionDTO = {
  id: string;
  occurredAt: string;
  type: OpportunityActionType;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  channelTypeCode: string | null;
  userId: string;
  workOpportunityId: string | null;
  companyId: string | null;
  contactId: string | null;
  contactChannelId: string | null;
  createdAt: string;
  updatedAt: string;
  contactChannel?: {
    id: string;
    value: string;
    label: string | null;
  };
  participants?: Array<{
    contactId: string;
    contact: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }>;
  workOpportunity?: {
    id: string;
    title: string;
    company?: {
      id: string;
      name: string;
    };
  } | null;
  company?: {
    id: string;
    name: string;
  } | null;
  /** Contact principal (action entre User et Contact) */
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    company?: { id: string; name: string };
  } | null;
  documents?: Array<ActionDocumentSummary>;
};
