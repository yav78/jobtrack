import { prisma } from "@/lib/prisma";
import { opportunityCreateSchema, opportunityUpdateSchema } from "@/lib/validators/opportunity";
import type { z } from "zod";

type OpportunityCreateInput = z.infer<typeof opportunityCreateSchema>;
type OpportunityUpdateInput = z.infer<typeof opportunityUpdateSchema>;

export async function getOpportunities(userId: string, options?: { page?: number; pageSize?: number; q?: string }) {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 10;
  const where = {
    userId,
    ...(options?.q ? { title: { contains: options.q, mode: "insensitive" as const } } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.workOpportunity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.workOpportunity.count({ where }),
  ]);
  return { items, page, pageSize, total };
}

export async function createOpportunity(userId: string, data: OpportunityCreateInput) {
  const validatedData = opportunityCreateSchema.parse(data);
  if (validatedData.companyId) {
    const company = await prisma.company.findFirst({ where: { id: validatedData.companyId, userId } });
    if (!company) throw new Error("Not found");
  }
  const opp = await prisma.workOpportunity.create({
    data: { ...validatedData, userId },
  });
  return opp;
}

export async function getOpportunity(id: string, userId: string) {
  const opp = await prisma.workOpportunity.findFirst({
    where: { id, userId },
    include: {
      entretiens: {
        include: { contacts: true, contactChannel: true },
        orderBy: { date: "desc" },
      },
    },
  });
  if (!opp) throw new Error("Not found");
  return opp;
}

export async function updateOpportunity(id: string, userId: string, data: OpportunityUpdateInput) {
  const validatedData = opportunityUpdateSchema.parse(data);
  if (validatedData.companyId) {
    const company = await prisma.company.findFirst({ where: { id: validatedData.companyId, userId } });
    if (!company) throw new Error("Not found");
  }
  const updated = await prisma.workOpportunity.update({
    where: { id, userId },
    data: validatedData,
  });
  return updated;
}

export async function deleteOpportunity(id: string, userId: string) {
  await prisma.workOpportunity.delete({ where: { id, userId } });
  return { success: true };
}

