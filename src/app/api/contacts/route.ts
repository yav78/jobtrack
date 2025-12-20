import { jsonCreated, jsonOk } from "@/lib/errors/response";
import { handleRouteError, parsePagination, requireUserId } from "@/lib/api-helpers";
import { getContacts, createContact } from "@/lib/services/contacts";

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const { page, pageSize, q } = parsePagination(req);
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId") ?? undefined;
    const result = await getContacts(userId, { page, pageSize, q, companyId });
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const contact = await createContact(userId, body);
    return jsonCreated(contact);
  } catch (error) {
    return handleRouteError(error);
  }
}

