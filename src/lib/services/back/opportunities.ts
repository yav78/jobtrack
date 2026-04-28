import { prisma } from "@/lib/prisma";
import { opportunityCreateSchema, opportunityUpdateSchema } from "@/lib/validators/opportunity";
import { NotFound } from "@/lib/errors";
import type { z } from "zod";
import type { Contact, ContactChannel, Entretien, WorkOpportunity, WorkOpportunityStatus, Prisma } from "@prisma/client";

type OpportunityCreateInput = z.infer<typeof opportunityCreateSchema>;
type OpportunityUpdateInput = z.infer<typeof opportunityUpdateSchema>;

type OpportunityWithRelations = Prisma.WorkOpportunityGetPayload<{
  include: {
    company: true;
    entretiens: {
      include: { contacts: true; contactChannel: true };
    };
    sourceLink: { select: { id: true; title: true } };
  };
}>;

const ACTIVE = { deletedAt: null } as const;

export async function getOpportunities(
  userId: string,
  options?: { page?: number; pageSize?: number; q?: string; status?: string }
) {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 10;
  const where: Prisma.WorkOpportunityWhereInput = {
    userId,
    ...ACTIVE,
    ...(options?.q ? { title: { contains: options.q, mode: "insensitive" } } : {}),
    ...(options?.status ? { status: options.status as WorkOpportunityStatus } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.workOpportunity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        company: { select: { id: true, name: true } },
        sourceLink: { select: { id: true, title: true } },
      },
    }),
    prisma.workOpportunity.count({ where }),
  ]);
  return { items, page, pageSize, total };
}

export async function getAllOpportunitiesForExport(userId: string) {
  return prisma.workOpportunity.findMany({
    where: { userId, ...ACTIVE },
    include: {
      company: { select: { id: true, name: true } },
      sourceLink: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createOpportunity(userId: string, data: OpportunityCreateInput) {
  const validatedData = opportunityCreateSchema.parse(data);
  if (validatedData.companyId) {
    const company = await prisma.company.findFirst({ where: { id: validatedData.companyId, userId, ...ACTIVE } });
    if (!company) throw NotFound("Company not found");
  }
  return prisma.workOpportunity.create({
    data: { ...validatedData, userId },
    include: {
      company: { select: { id: true, name: true } },
      sourceLink: { select: { id: true, title: true } },
    },
  });
}

export async function getOpportunity(id: string, userId: string): Promise<OpportunityWithRelations | null> {
  const opp = await prisma.workOpportunity.findFirst({
    where: { id, userId, ...ACTIVE },
    include: {
      company: true,
      entretiens: {
        include: { contacts: true, contactChannel: true },
        orderBy: { date: "desc" },
      },
      sourceLink: { select: { id: true, title: true } },
    },
  });
  return opp ?? null;
}

export async function updateOpportunity(id: string, userId: string, data: OpportunityUpdateInput) {
  const validatedData = opportunityUpdateSchema.parse(data);
  if (validatedData.companyId) {
    const company = await prisma.company.findFirst({ where: { id: validatedData.companyId, userId, ...ACTIVE } });
    if (!company) throw NotFound("Company not found");
  }
  return prisma.workOpportunity.update({
    where: { id, userId },
    data: validatedData,
    include: {
      company: { select: { id: true, name: true } },
      sourceLink: { select: { id: true, title: true } },
    },
  });
}

export async function deleteOpportunity(id: string, userId: string) {
  await prisma.workOpportunity.update({ where: { id, userId }, data: { deletedAt: new Date() } });
  return { success: true };
}

export async function deleteManyOpportunities(ids: string[], userId: string) {
  await prisma.workOpportunity.updateMany({
    where: { id: { in: ids }, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return { success: true };
}
