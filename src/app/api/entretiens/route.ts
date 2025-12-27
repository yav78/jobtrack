import { jsonCreated, jsonOk } from "@/lib/errors/response";
import { handleRouteError, parsePagination, requireUserId } from "@/lib/api-helpers";
import { getEntretiens, createEntretien } from "@/lib/services/back/entretiens";

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const { page, pageSize } = parsePagination(req);
    const { searchParams } = new URL(req.url);
    const workOpportunityId = searchParams.get("workOpportunityId") ?? undefined;
    const result = await getEntretiens(userId, { page, pageSize, workOpportunityId });
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const entretien = await createEntretien(userId, body);
    return jsonCreated(entretien);
  } catch (error) {
    return handleRouteError(error);
  }
}

