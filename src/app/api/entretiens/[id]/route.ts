import { prisma } from "@/lib/prisma";
import { entretienUpdateSchema } from "@/lib/validators/entretien";
import { jsonOk } from "@/lib/errors/response";
import { handleRouteError, requireUserId } from "@/lib/api-helpers";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const entretien = await prisma.entretien.findFirst({
      where: { id: params.id, userId },
      include: { contacts: true, contactChannel: true, workOpportunity: true },
    });
    if (!entretien) throw new Error("Not found");
    return jsonOk(entretien);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const data = entretienUpdateSchema.parse(body);

    if (data.workOpportunityId) {
      const opp = await prisma.workOpportunity.findFirst({
        where: { id: data.workOpportunityId, userId },
      });
      if (!opp) throw new Error("Not found");
    }
    if (data.contactChannelId) {
      const ch = await prisma.contactChannel.findFirst({
        where: { id: data.contactChannelId, contact: { company: { userId } } },
      });
      if (!ch) throw new Error("Not found");
    }

    const updated = await prisma.entretien.update({
      where: { id: params.id, userId },
      data: {
        date: data.date,
        workOpportunityId: data.workOpportunityId,
        contactChannelId: data.contactChannelId,
      },
      include: { contacts: true, contactChannel: true, workOpportunity: true },
    });
    return jsonOk(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    await prisma.entretien.delete({ where: { id: params.id, userId } });
    return jsonOk({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

