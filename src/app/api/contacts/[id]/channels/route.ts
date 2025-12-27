import { jsonCreated } from "@/lib/errors/response";
import { handleRouteError, requireUserId } from "@/lib/api-helpers";
import { createChannel } from "@/lib/services/back/channels";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const { id } = params instanceof Promise ? await params : params;
    const channel = await createChannel(id, userId, body);
    return jsonCreated(channel);
  } catch (error) {
    return handleRouteError(error);
  }
}

