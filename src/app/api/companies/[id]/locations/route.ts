import { prisma } from "@/lib/prisma";
import { locationCreateSchema } from "@/lib/validators/company";
import { jsonCreated } from "@/lib/errors/response";
import { handleRouteError, requireUserId } from "@/lib/api-helpers";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const company = await prisma.company.findFirst({ where: { id: params.id, userId } });
    if (!company) {
      throw new Error("Not found");
    }
    const body = await req.json();
    const data = locationCreateSchema.parse(body);
    const location = await prisma.$transaction(async (tx) => {
      if (data.isPrimary) {
        await tx.location.updateMany({
          where: { companyId: params.id, isPrimary: true },
          data: { isPrimary: false },
        });
      }
      return tx.location.create({
        data: { ...data, companyId: params.id },
      });
    });
    return jsonCreated(location);
  } catch (error) {
    return handleRouteError(error);
  }
}

