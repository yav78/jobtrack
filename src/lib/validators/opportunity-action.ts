import { z } from "zod";

const opportunityActionTypeEnum = z.enum([
  "INTERVIEW",
  "APPLIED",
  "INBOUND_CONTACT",
  "OUTBOUND_CONTACT",
  "MESSAGE",
  "CALL",
  "FOLLOW_UP",
  "OFFER_RECEIVED",
  "OFFER_ACCEPTED",
  "REJECTED",
  "NOTE",
]);

export const opportunityActionCreateSchema = z.object({
  type: opportunityActionTypeEnum,
  occurredAt: z.coerce.date(),
  notes: z.string().optional(),
  workOpportunityId: z.string().uuid().nullable().optional(),
  companyId: z.string().uuid().nullable().optional(),
  contactId: z.string().uuid().nullable().optional(),
  contactChannelId: z.string().uuid().optional(),
  channelTypeCode: z.string().optional(),
  participantContactIds: z.array(z.string().uuid()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const opportunityActionUpdateSchema = z.object({
  type: opportunityActionTypeEnum.optional(),
  occurredAt: z.coerce.date().optional(),
  notes: z.string().optional(),
  workOpportunityId: z.string().uuid().nullable().optional(),
  companyId: z.string().uuid().nullable().optional(),
  contactId: z.string().uuid().nullable().optional(),
  contactChannelId: z.string().uuid().optional().nullable(),
  channelTypeCode: z.string().optional().nullable(),
  participantContactIds: z.array(z.string().uuid()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

