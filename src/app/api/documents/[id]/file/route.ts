import path from "path";
import { promises as fs } from "fs";
import { handleRouteError, requireUserId } from "@/lib/api-helpers";
import { NotFound } from "@/lib/errors";
import { getDocumentById, getUploadsBase } from "@/lib/services/back/documents";

type Params = { params: Promise<{ id: string }> | { id: string } };

export async function GET(req: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const resolved = params instanceof Promise ? await params : params;
    const id = resolved.id;

    const doc = await getDocumentById(id, userId);
    if (!doc) throw NotFound("Document introuvable");

    const filePath = path.join(getUploadsBase(), userId, doc.filename);
    let buffer: Buffer;
    try {
      buffer = await fs.readFile(filePath);
    } catch {
      throw NotFound("Fichier introuvable sur le serveur");
    }

    const { searchParams } = new URL(req.url);
    const download = searchParams.get("download") !== "false";

    const disposition = download
      ? `attachment; filename*=UTF-8''${encodeURIComponent(doc.originalName)}`
      : `inline; filename*=UTF-8''${encodeURIComponent(doc.originalName)}`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Length": buffer.length.toString(),
        "Content-Disposition": disposition,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
