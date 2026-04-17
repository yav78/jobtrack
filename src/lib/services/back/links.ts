import { prisma } from "@/lib/prisma";
import { linkCreateSchema, linkUpdateSchema } from "@/lib/validators/link";
import { NotFound } from "@/lib/errors";
import type { z } from "zod";
import type { Link, LinkCategory, Prisma } from "@prisma/client";

type LinkCreateInput = z.infer<typeof linkCreateSchema>;
type LinkUpdateInput = z.infer<typeof linkUpdateSchema>;

const ACTIVE = { deletedAt: null } as const;

export type LinkRecord = Link;

export async function getLinks(
  userId: string,
  options?: {
    page?: number;
    pageSize?: number;
    q?: string;
    category?: LinkCategory;
  }
) {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 20;
  const q = options?.q?.trim();

  const where: Prisma.LinkWhereInput = {
    userId,
    ...ACTIVE,
    ...(options?.category ? { category: options.category } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { notes: { contains: q, mode: "insensitive" as const } },
            { url: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.link.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.link.count({ where }),
  ]);

  return { items, page, pageSize, total };
}

export async function getLink(id: string, userId: string): Promise<LinkRecord> {
  const link = await prisma.link.findFirst({
    where: { id, userId, ...ACTIVE },
  });
  if (!link) throw NotFound("Link not found");
  return link;
}

export async function createLink(userId: string, data: LinkCreateInput) {
  const validated = linkCreateSchema.parse(data);
  return prisma.link.create({
    data: {
      userId,
      title: validated.title,
      url: validated.url,
      category: validated.category,
      notes: validated.notes ?? null,
    },
  });
}

export async function updateLink(id: string, userId: string, data: LinkUpdateInput) {
  const validated = linkUpdateSchema.parse(data);
  const result = await prisma.link.updateMany({
    where: { id, userId, ...ACTIVE },
    data: {
      ...(validated.title !== undefined ? { title: validated.title } : {}),
      ...(validated.url !== undefined ? { url: validated.url } : {}),
      ...(validated.category !== undefined ? { category: validated.category } : {}),
      ...(validated.notes !== undefined ? { notes: validated.notes } : {}),
    },
  });
  if (result.count === 0) throw NotFound("Link not found");
  return prisma.link.findUniqueOrThrow({ where: { id } });
}

export async function deleteLink(id: string, userId: string) {
  const now = new Date();
  const result = await prisma.link.updateMany({
    where: { id, userId, ...ACTIVE },
    data: { deletedAt: now },
  });
  if (result.count === 0) throw NotFound("Link not found");
  return { success: true };
}
