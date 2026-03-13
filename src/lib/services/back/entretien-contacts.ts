import { prisma } from "@/lib/prisma";
import { BadRequest, NotFound } from "@/lib/errors";

export async function addContactsToEntretien(entretienId: string, userId: string, contactIds: string[]) {
  if (!contactIds.length) throw BadRequest("At least one contact ID is required");

  const entretien = await prisma.entretien.findFirst({
    where: { id: entretienId, userId },
  });
  if (!entretien) throw NotFound("Entretien not found");

  await prisma.entretienContact.createMany({
    data: contactIds.map((cid) => ({ entretienId, contactId: cid })),
    skipDuplicates: true,
  });
  return { success: true };
}

export async function removeContactFromEntretien(entretienId: string, userId: string, contactId: string) {
  const entretien = await prisma.entretien.findFirst({
    where: { id: entretienId, userId },
  });
  if (!entretien) throw NotFound("Entretien not found");

  await prisma.entretienContact.delete({
    where: { entretienId_contactId: { entretienId, contactId } },
  });
  return { success: true };
}


