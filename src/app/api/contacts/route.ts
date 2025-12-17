import { prisma } from "@/lib/prisma";
import { contactCreateSchema } from "@/lib/validators/contact";
import { jsonCreated, jsonOk } from "@/lib/errors/response";
import { handleRouteError, parsePagination, requireUserId } from "@/lib/api-helpers";

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const { page, pageSize, q } = parsePagination(req);
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId") ?? undefined;

    const where = {
      company: { userId },
      ...(companyId ? { companyId } : {}),
      ...(q
        ? {
            OR: [
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.contact.count({ where }),
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
    const data = contactCreateSchema.parse(body);
    // Ensure company belongs to user
    const company = await prisma.company.findFirst({ where: { id: data.companyId, userId } });
    if (!company) throw new Error("Not found");
    const contact = await prisma.contact.create({ data });
    return jsonCreated(contact);
  } catch (error) {
    return handleRouteError(error);
  }
}

