import { prisma } from "@/lib/prisma";
import { entretienCreateSchema, entretienUpdateSchema } from "@/lib/validators/entretien";
import { NotFound } from "@/lib/errors";
import type { z } from "zod";

type EntretienCreateInput = z.infer<typeof entretienCreateSchema>;
type EntretienUpdateInput = z.infer<typeof entretienUpdateSchema>;

export async function getEntretiens(
  userId: string,
  options?: { page?: number; pageSize?: number; workOpportunityId?: string }
) {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 10;
  const where = {
    userId,
    ...(options?.workOpportunityId ? { workOpportunityId: options.workOpportunityId } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.entretien.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { contacts: true, contactChannel: true },
    }),
    prisma.entretien.count({ where }),
  ]);
  return { items, page, pageSize, total };
}

export async function createEntretien(userId: string, data: EntretienCreateInput) {
  const validatedData = entretienCreateSchema.parse(data);

  const opp = await prisma.workOpportunity.findFirst({
    where: { id: validatedData.workOpportunityId, userId },
  });
  if (!opp) throw NotFound("Opportunity not found");

  const channel = await prisma.contactChannel.findFirst({
    where: { id: validatedData.contactChannelId, contact: { userId } },
  });
  if (!channel) throw NotFound("Contact channel not found");

  const entretien = await prisma.entretien.create({
    data: {
      date: validatedData.date,
      workOpportunityId: validatedData.workOpportunityId,
      contactChannelId: validatedData.contactChannelId,
      userId,
      contacts: {
        create: validatedData.contactIds.map((cid) => ({ contactId: cid })),
      },
    },
    include: { contacts: true, contactChannel: true },
  });
  return entretien;
}

export async function getEntretien(id: string, userId: string) {
  const entretien = await prisma.entretien.findFirst({
    where: { id, userId },
    include: { contacts: true, contactChannel: true, workOpportunity: true },
  });
  if (!entretien) throw NotFound("Entretien not found");
  return entretien;
}

export async function updateEntretien(id: string, userId: string, data: EntretienUpdateInput) {
  const validatedData = entretienUpdateSchema.parse(data);

  if (validatedData.workOpportunityId) {
    const opp = await prisma.workOpportunity.findFirst({
      where: { id: validatedData.workOpportunityId, userId },
    });
    if (!opp) throw NotFound("Opportunity not found");
  }
  if (validatedData.contactChannelId) {
    const ch = await prisma.contactChannel.findFirst({
      where: { id: validatedData.contactChannelId, contact: { userId } },
    });
    if (!ch) throw NotFound("Contact channel not found");
  }

  const updated = await prisma.entretien.update({
    where: { id, userId },
    data: {
      date: validatedData.date,
      workOpportunityId: validatedData.workOpportunityId,
      contactChannelId: validatedData.contactChannelId,
    },
    include: { contacts: true, contactChannel: true, workOpportunity: true },
  });
  return updated;
}

export async function deleteEntretien(id: string, userId: string) {
  await prisma.entretien.delete({ where: { id, userId } });
  return { success: true };
}


