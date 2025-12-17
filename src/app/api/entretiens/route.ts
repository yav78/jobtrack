import { prisma } from "@/lib/prisma";
import { entretienCreateSchema } from "@/lib/validators/entretien";
import { jsonCreated, jsonOk } from "@/lib/errors/response";
import { handleRouteError, parsePagination, requireUserId } from "@/lib/api-helpers";

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const { page, pageSize } = parsePagination(req);
    const { searchParams } = new URL(req.url);
    const opportunityId = searchParams.get("workOpportunityId") ?? undefined;
    const where = {
      userId,
      ...(opportunityId ? { workOpportunityId: opportunityId } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.entretien.findMany({
        where,
        orderBy: { date: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { contacts: true, contactChannel: true },
      }),
      prisma.entretien.count({ where }),
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
    const data = entretienCreateSchema.parse(body);

    const opp = await prisma.workOpportunity.findFirst({
      where: { id: data.workOpportunityId, userId },
    });
    if (!opp) throw new Error("Not found");

    const channel = await prisma.contactChannel.findFirst({
      where: { id: data.contactChannelId, contact: { company: { userId } } },
    });
    if (!channel) throw new Error("Not found");

    const entretien = await prisma.entretien.create({
      data: {
        date: data.date,
        workOpportunityId: data.workOpportunityId,
        contactChannelId: data.contactChannelId,
        userId,
        contacts: {
          create: data.contactIds.map((cid) => ({ contactId: cid })),
        },
      },
      include: { contacts: true, contactChannel: true },
    });
    return jsonCreated(entretien);
  } catch (error) {
    return handleRouteError(error);
  }
}

