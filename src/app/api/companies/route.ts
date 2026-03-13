import { jsonCreated, jsonOk } from "@/lib/errors/response";
import { handleRouteError, parsePagination, requireJson, requireUserId } from "@/lib/api-helpers";
import { getCompanies, createCompany } from "@/lib/services/back/companies";

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const { page, pageSize, q } = parsePagination(req);
    const result = await getCompanies(userId, { page, pageSize, q });
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
    const company = await createCompany(userId, body);
    return jsonCreated(company);
  } catch (error) {
    return handleRouteError(error);
  }
}

