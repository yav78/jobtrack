import { prisma } from "@/lib/prisma";
import { companyUpdateSchema } from "@/lib/validators/company";
import { jsonOk } from "@/lib/errors/response";
import { handleRouteError, requireUserId } from "@/lib/api-helpers";

export async function getCompany(id : string) {
  const userId = await requireUserId();
  const company = await prisma.company.findFirst({
    where: { id, userId },
    include: { locations: true, contacts: true },
  });
  return company;
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const company = await prisma.company.findFirst({
      where: { id: params.id, userId },
      include: { locations: true, contacts: true },
    });
    if (!company) throw new Error("Not found");
    return jsonOk(company);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const data = companyUpdateSchema.parse(body);
    const updated = await prisma.company.update({
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
    await prisma.company.delete({
      where: { id: params.id, userId },
    });
    return jsonOk({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

