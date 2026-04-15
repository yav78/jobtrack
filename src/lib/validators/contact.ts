import { z } from "zod";

export const contactCreateSchema = z.object({
  companyId: z.string().uuid().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  roleTitle: z.string().optional(),
  notes: z.string().optional(),
  basedAtLocationId: z.string().uuid().nullable().optional(),
  channels: z
    .array(
      z.object({
        channelTypeCode: z.string().min(1),
        value: z.string().min(1),
      })
    )
    .optional()
    .default([]),
});

export const contactUpdateSchema = z.object({
  companyId: z.string().uuid().nullable().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  roleTitle: z.string().optional(),
  notes: z.string().optional(),
  basedAtLocationId: z.string().uuid().nullable().optional(),
});

export const contactChannelCreateSchema = z.object({
  channelTypeCode: z.string().min(1),
  value: z.string().min(1),
  label: z.string().optional(),
  isPrimary: z.boolean().optional().default(false),
});

export const contactChannelUpdateSchema = contactChannelCreateSchema.partial();
