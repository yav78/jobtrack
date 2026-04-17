import { z } from "zod";

export const linkCategorySchema = z.enum(["JOBBOARD", "TOOL", "NETWORK", "OTHER"]);

export const linkCreateSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  category: linkCategorySchema.default("OTHER"),
  notes: z.string().optional(),
});

export const linkUpdateSchema = linkCreateSchema.partial();

export const linkListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().optional(),
  category: linkCategorySchema.optional(),
});
