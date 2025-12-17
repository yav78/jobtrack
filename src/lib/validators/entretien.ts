import { z } from "zod";

export const entretienCreateSchema = z.object({
  date: z.coerce.date(),
  workOpportunityId: z.string().uuid(),
  contactChannelId: z.string().uuid(),
  contactIds: z.array(z.string().uuid()).min(1),
});

export const entretienUpdateSchema = z.object({
  date: z.coerce.date().optional(),
  workOpportunityId: z.string().uuid().optional(),
  contactChannelId: z.string().uuid().optional(),
  contactIds: z.array(z.string().uuid()).min(1).optional(),
});

