import { jsonCreated, jsonOk } from "@/lib/errors/response";
import { handleRouteError, parsePagination, requireUserId } from "@/lib/api-helpers";
import { getOpportunities, createOpportunity } from "@/lib/services/opportunities";

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const { page, pageSize, q } = parsePagination(req);
    const result = await getOpportunities(userId, { page, pageSize, q });
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const opp = await createOpportunity(userId, body);
    return jsonCreated(opp);
  } catch (error) {
    return handleRouteError(error);
  }
}

