import { jsonCreated } from "@/lib/errors/response";
import { handleRouteError, requireUserId } from "@/lib/api-helpers";
import { createLocation } from "@/lib/services/back/locations";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const {id} = await params;
    const location = await createLocation(id, userId, body);
    return jsonCreated(location);
  } catch (error) {
    return handleRouteError(error);
  }
}

