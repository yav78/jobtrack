import { jsonCreated, jsonOk } from "@/lib/errors/response";
import { handleRouteError, requireJson, requireUserId } from "@/lib/api-helpers";
import { linkListQuerySchema } from "@/lib/validators/link";
import { createLink, getLinks } from "@/lib/services/back/links";
import type { LinkCategory } from "@prisma/client";

function parseLinkListQuery(req: Request) {
  const { searchParams } = new URL(req.url);
  const categoryValues = searchParams.getAll("category") as LinkCategory[];
  const category =
    categoryValues.length === 1
      ? categoryValues[0]
      : categoryValues.length > 1
        ? categoryValues
        : undefined;
  return linkListQuerySchema.parse({
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    category,
  });
}

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const { page, pageSize, q, category } = parseLinkListQuery(req);
    const result = await getLinks(userId, { page, pageSize, q, category });
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(req: Request) {
  try {
    requireJson(req);
    const userId = await requireUserId();
    const body = await req.json();
    const link = await createLink(userId, body);
    return jsonCreated(link);
  } catch (error) {
    return handleRouteError(error);
  }
}
