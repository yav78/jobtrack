import { handleRouteError, requireUserId, requireJson } from "@/lib/api-helpers";
import { jsonOk } from "@/lib/errors/response";
import { deleteManyContacts } from "@/lib/services/back/contacts";
import { z } from "zod";

const schema = z.object({ ids: z.array(z.string().uuid()).min(1) });

export async function POST(req: Request) {
  try {
    requireJson(req);
    const userId = await requireUserId();
    const body = schema.parse(await req.json());
    return jsonOk(await deleteManyContacts(body.ids, userId));
  } catch (error) {
    return handleRouteError(error);
  }
}
