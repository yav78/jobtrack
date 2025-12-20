import { jsonOk } from "@/lib/errors/response";
import { handleRouteError, requireUserId } from "@/lib/api-helpers";
import { getCompany, updateCompany, deleteCompany } from "@/lib/services/companies";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const company = await getCompany(params.id, userId);
    return jsonOk(company);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const updated = await updateCompany(params.id, userId, body);
    return jsonOk(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const result = await deleteCompany(params.id, userId);
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

