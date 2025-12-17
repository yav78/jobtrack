import { prisma } from "@/lib/prisma";
import { locationUpdateSchema } from "@/lib/validators/company";
import { jsonError, jsonOk } from "@/lib/errors/response";
import { handleRouteError, requireUserId } from "@/lib/api-helpers";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const data = locationUpdateSchema.parse(body);
    const location = await prisma.location.findFirst({
      where: { id: params.id, company: { userId } },
      include: { company: true },
    });
    if (!location) throw new Error("Not found");

    const updated = await prisma.$transaction(async (tx) => {
      if (data.isPrimary === true) {
        await tx.location.updateMany({
          where: { companyId: location.companyId, isPrimary: true, NOT: { id: params.id } },
          data: { isPrimary: false },
        });
      }
      return tx.location.update({
        where: { id: params.id },
        data,
      });
    });
    return jsonOk(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    await prisma.location.delete({
      where: { id: params.id, company: { userId } },
    });
    return jsonOk({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}

