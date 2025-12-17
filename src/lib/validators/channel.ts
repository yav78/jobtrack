import { z } from "zod";

export const channelTypeSchema = z.object({
  code: z.string().min(1),
  label: z.string().min(1),
});

export const contactChannelCreateSchema = z.object({
  channelTypeCode: z.string().min(1),
  value: z.string().min(1),
  label: z.string().optional(),
  isPrimary: z.boolean().optional().default(false),
});

export const contactChannelUpdateSchema = contactChannelCreateSchema.partial();

