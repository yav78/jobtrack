import path from "path";
import { promises as fs } from "fs";
import { jsonOk } from "@/lib/errors/response";
import { handleRouteError, requireJson, requireUserId } from "@/lib/api-helpers";
import { documentUpdateSchema } from "@/lib/validators/document";
import {
  getDocumentById,
  updateDocument,
  deleteDocument,
  documentToDto,
  getUploadsBase,
} from "@/lib/services/back/documents";
import { NotFound } from "@/lib/errors";

type Params = { params: Promise<{ id: string }> | { id: string } };

async function resolveId(params: Params["params"]): Promise<string> {
  const resolved = params instanceof Promise ? await params : params;
  return resolved.id;
}

export async function GET(_: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const id = await resolveId(params);
    const doc = await getDocumentById(id, userId);
    if (!doc) throw NotFound("Document introuvable");
    return jsonOk({ data: documentToDto(doc) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    requireJson(req);
    const userId = await requireUserId();
    const id = await resolveId(params);
    const body = await req.json();
    const parsed = documentUpdateSchema.parse(body);
    const updated = await updateDocument(id, userId, parsed);
    return jsonOk({ data: documentToDto(updated) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const id = await resolveId(params);
    const { filename, userId: docUserId } = await deleteDocument(id, userId);
    const filePath = path.join(getUploadsBase(), docUserId, filename);
    await fs.unlink(filePath).catch((err) => {
      console.error(`Failed to delete file ${filePath}:`, err);
    });
    return jsonOk({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
