import { z } from "zod";

export const documentCreateSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
});

export const documentUpdateSchema = z
  .object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional(),
  })
  .refine((data) => data.title !== undefined || data.description !== undefined, {
    message: "Au moins un champ est requis",
  });

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "text/plain",
  "text/markdown",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
