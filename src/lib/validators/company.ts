import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().optional(),
});

export const companyCreateSchema = z.object({
  name: z.string().min(1),
  typeCode: z.string().min(1),
  website: z.string().url().optional(),
  notes: z.string().optional(),
});

export const companyUpdateSchema = companyCreateSchema.partial();

export const locationCreateSchema = z.object({
  label: z.string().min(1),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  zipCode: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1),
  isPrimary: z.boolean().optional().default(false),
});

export const locationUpdateSchema = locationCreateSchema.partial();

