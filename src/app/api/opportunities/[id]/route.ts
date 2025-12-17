import { prisma } from "@/lib/prisma";
import { opportunityUpdateSchema } from "@/lib/validators/opportunity";
import { jsonOk } from "@/lib/errors/response";
import { handleRouteError, requireUserId } from "@/lib/api-helpers";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const opp = await prisma.workOpportunity.findFirst({
      where: { id: params.id, userId },
      include: {
        entretiens: {
          include: { contacts: true, contactChannel: true },
          orderBy: { date: "desc" },
        },
      },
    });
    if (!opp) throw new Error("Not found");
    return jsonOk(opp);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const data = opportunityUpdateSchema.parse(body);
    if (data.companyId) {
      const company = await prisma.company.findFirst({ where: { id: data.companyId, userId } });
      if (!company) throw new Error("Not found");
    }
    const updated = await prisma.workOpportunity.update({
      where: { id: params.id, userId },
      data,
    });
    return jsonOk(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    await prisma.workOpportunity.delete({ where: { id: params.id, userId } });
    return jsonOk({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

