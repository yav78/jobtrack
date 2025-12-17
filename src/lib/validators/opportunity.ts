import { z } from "zod";

export const opportunityCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  companyId: z.string().uuid().nullable().optional(),
});

export const opportunityUpdateSchema = opportunityCreateSchema.partial();

