import { prisma } from "@/lib/prisma";
import { companyCreateSchema } from "@/lib/validators/company";
import { jsonCreated, jsonOk } from "@/lib/errors/response";
import { handleRouteError, parsePagination, requireUserId } from "@/lib/api-helpers";

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const { page, pageSize, q } = parsePagination(req);
    const where = {
      userId,
      ...(q
        ? {
            name: {
              contains: q,
              mode: "insensitive",
            },
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.company.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.company.count({ where }),
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
    const data = companyCreateSchema.parse(body);
    const company = await prisma.company.create({
      data: { ...data, userId },
    });
    return jsonCreated(company);
  } catch (error) {
    return handleRouteError(error);
  }
}

