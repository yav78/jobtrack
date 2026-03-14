import { handleRouteError, requireJson, requireUserId } from "@/lib/api-helpers";
import { BadRequest } from "@/lib/errors";
import { jsonOk } from "@/lib/errors/response";
import { isEmailConfigured, sendMail } from "@/lib/mailer";
import { z } from "zod";

const schema = z.object({
  to: z.string().email("Adresse email invalide"),
  subject: z.string().min(1, "L'objet est requis"),
  text: z.string().min(1, "Le message est requis"),
});

export async function POST(req: Request) {
  try {
    requireJson(req);
    await requireUserId();

    if (!isEmailConfigured()) {
      throw BadRequest("L'envoi d'email n'est pas configuré sur ce serveur.");
    }

    const body = schema.parse(await req.json());
    await sendMail(body);

    return jsonOk({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
