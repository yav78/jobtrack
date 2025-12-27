import { prisma } from "@/lib/prisma";
import { locationCreateSchema, locationUpdateSchema } from "@/lib/validators/company";
import type { z } from "zod";

type LocationCreateInput = z.infer<typeof locationCreateSchema>;
type LocationUpdateInput = z.infer<typeof locationUpdateSchema>;

export async function createLocation(companyId: string, userId: string, data: LocationCreateInput) {
  const validatedData = locationCreateSchema.parse(data);
  const company = await prisma.company.findFirst({ where: { id: companyId, userId } });
  if (!company) {
    throw new Error("Not found");
  }
  const location = await prisma.$transaction(async (tx) => {
    if (validatedData.isPrimary) {
      await tx.location.updateMany({
        where: { companyId, isPrimary: true },
        data: { isPrimary: false },
      });
    }
    return tx.location.create({
      data: { ...validatedData, companyId },
    });
  });
  return location;
}

export async function updateLocation(id: string, userId: string, data: LocationUpdateInput) {
  const validatedData = locationUpdateSchema.parse(data);
  const location = await prisma.location.findFirst({
    where: { id, company: { userId } },
    include: { company: true },
  });
  if (!location) throw new Error("Not found");

  const updated = await prisma.$transaction(async (tx) => {
    if (validatedData.isPrimary === true) {
      await tx.location.updateMany({
        where: { companyId: location.companyId, isPrimary: true, NOT: { id } },
        data: { isPrimary: false },
      });
    }
    return tx.location.update({
      where: { id },
      data: validatedData,
    });
  });
  return updated;
}

export async function deleteLocation(id: string, userId: string) {
  await prisma.location.delete({
    where: { id, company: { userId } },
  });
  return { success: true };
}


