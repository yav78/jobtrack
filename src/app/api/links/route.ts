import { jsonCreated, jsonOk } from "@/lib/errors/response";
import { handleRouteError, requireJson, requireUserId } from "@/lib/api-helpers";
import { linkListQuerySchema } from "@/lib/validators/link";
import { createLink, getLinks } from "@/lib/services/back/links";

function parseLinkListQuery(req: Request) {
  const { searchParams } = new URL(req.url);
  return linkListQuerySchema.parse({
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    category: searchParams.get("category") ?? undefined,
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
