import { prisma } from "@/lib/prisma";
import { opportunityCreateSchema } from "@/lib/validators/opportunity";
import { jsonCreated, jsonOk } from "@/lib/errors/response";
import { handleRouteError, parsePagination, requireUserId } from "@/lib/api-helpers";

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const { page, pageSize, q } = parsePagination(req);
    const where = {
      userId,
      ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
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
    return jsonOk({ items, page, pageSize, total });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const data = opportunityCreateSchema.parse(body);
    if (data.companyId) {
      const company = await prisma.company.findFirst({ where: { id: data.companyId, userId } });
      if (!company) throw new Error("Not found");
    }
    const opp = await prisma.workOpportunity.create({
      data: { ...data, userId },
    });
    return jsonCreated(opp);
  } catch (error) {
    return handleRouteError(error);
  }
}

