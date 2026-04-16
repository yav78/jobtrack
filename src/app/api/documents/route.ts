import path from "path";
import crypto from "crypto";
import { promises as fs } from "fs";
import { jsonCreated, jsonOk } from "@/lib/errors/response";
import { handleRouteError, requireUserId } from "@/lib/api-helpers";
import { BadRequest } from "@/lib/errors";
import {
  documentCreateSchema,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
} from "@/lib/validators/document";
import {
  listDocuments,
  createDocument,
  documentToDto,
  getUploadsBase,
  ensureUserUploadsDir,
} from "@/lib/services/back/documents";

export async function GET() {
  try {
    const userId = await requireUserId();
    const documents = await listDocuments(userId);
    return jsonOk({ items: documents.map(documentToDto) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;

    if (!file || !(file instanceof File)) throw BadRequest("Fichier requis");
    if (file.size > MAX_FILE_SIZE) throw BadRequest("Le fichier dépasse 10 Mo");
    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
      throw BadRequest("Type de fichier non supporté");
    }

    const parsed = documentCreateSchema.parse({
      title: title ?? "",
      description: description || undefined,
    });

    const ext = path.extname(file.name);
    const filename = `${crypto.randomUUID()}${ext}`;

    await ensureUserUploadsDir(userId);
    const filePath = path.join(getUploadsBase(), userId, filename);
    const bytes = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(bytes));

    let document;
    try {
      document = await createDocument(userId, {
        ...parsed,
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
      });
    } catch (err) {
      await fs.unlink(filePath).catch(() => {});
      throw err;
    }

    return jsonCreated({ data: documentToDto(document) });
  } catch (error) {
    return handleRouteError(error);
  }
}
