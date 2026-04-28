import { z } from "zod";
import { WorkOpportunityStatus } from "@prisma/client";

const statusEnum = z.nativeEnum(WorkOpportunityStatus);

export const opportunityCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  sourceUrl: z.string().url().nullable().optional(),
  companyId: z.string().uuid().nullable().optional(),
  status: statusEnum.optional(),
  sourceLinkId: z.string().uuid().nullable().optional(),
});

export const opportunityUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  sourceUrl: z.string().url().nullable().optional(),
  companyId: z.string().uuid().nullable().optional(),
  status: statusEnum.optional(),
  followUpAt: z.string().datetime().nullable().optional(),
  sourceLinkId: z.string().uuid().nullable().optional(),
});
