import { handleRouteError, requireUserId } from "@/lib/api-helpers";
import { BadRequest } from "@/lib/errors";
import { jsonOk } from "@/lib/errors/response";
import {
  restoreCompany,
  restoreContact,
  restoreOpportunity,
  permanentDeleteCompany,
  permanentDeleteContact,
  permanentDeleteOpportunity,
} from "@/lib/services/back/trash";

type Params = { entity: string; id: string };

export async function PATCH(_req: Request, { params }: { params: Promise<Params> }) {
  try {
    const userId = await requireUserId();
    const { entity, id } = await params;
    if (entity === "companies") return jsonOk(await restoreCompany(id, userId));
    if (entity === "contacts") return jsonOk(await restoreContact(id, userId));
    if (entity === "opportunities") return jsonOk(await restoreOpportunity(id, userId));
    throw BadRequest("Entity invalide");
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<Params> }) {
  try {
    const userId = await requireUserId();
    const { entity, id } = await params;
    if (entity === "companies") return jsonOk(await permanentDeleteCompany(id, userId));
    if (entity === "contacts") return jsonOk(await permanentDeleteContact(id, userId));
    if (entity === "opportunities") return jsonOk(await permanentDeleteOpportunity(id, userId));
    throw BadRequest("Entity invalide");
  } catch (error) {
    return handleRouteError(error);
  }
}
