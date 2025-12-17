import { prisma } from "@/lib/prisma";
import { jsonOk } from "@/lib/errors/response";
import { handleRouteError, requireUserId } from "@/lib/api-helpers";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const contactIds = (body?.contactIds as string[] | undefined) ?? [];
    if (!contactIds.length) throw new Error("No contactIds");

    const entretien = await prisma.entretien.findFirst({
      where: { id: params.id, userId },
    });
    if (!entretien) throw new Error("Not found");

    await prisma.entretienContact.createMany({
      data: contactIds.map((cid) => ({ entretienId: params.id, contactId: cid })),
      skipDuplicates: true,
    });
    return jsonOk({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get("contactId");
    if (!contactId) throw new Error("contactId required");

    const entretien = await prisma.entretien.findFirst({
      where: { id: params.id, userId },
    });
    if (!entretien) throw new Error("Not found");

    await prisma.entretienContact.delete({
      where: { entretienId_contactId: { entretienId: params.id, contactId } },
    });
    return jsonOk({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

