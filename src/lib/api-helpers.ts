import { NextRequest } from "next/server";
import { ZodError, ZodIssue } from "zod";
import { prisma } from "@/lib/prisma";
import { resolveUser } from "@/lib/auth";
import { BadRequest, HttpError, NotFound } from "@/lib/errors";
import { jsonError } from "@/lib/errors/response";

export { NotFound, BadRequest };

function translateZodIssue(issue: ZodIssue): string {
  const field = issue.path.length > 0 ? `"${issue.path.join(".")}"` : "Un champ";
  switch (issue.code) {
    case "too_small":
      return `${field} est requis`;
    case "too_big":
      return `${field} dépasse la longueur maximale autorisée`;
    case "invalid_string":
      if (issue.validation === "url") return `${field} doit être une URL valide`;
      if (issue.validation === "uuid") return `${field} doit être un identifiant valide`;
      if (issue.validation === "email") return `${field} doit être une adresse e-mail valide`;
      return `${field} est invalide`;
    case "invalid_type":
      if (issue.received === "undefined" || issue.received === "null")
        return `${field} est requis`;
      return `${field} a un type invalide`;
    case "invalid_enum_value":
      return `${field} contient une valeur non autorisée`;
    default:
      return `${field} est invalide`;
  }
}

export async function requireUserId() {
  const { userId } = await resolveUser();
  return userId;
}

export function parsePagination(req: Request | NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? "20")));
  const q = searchParams.get("q") ?? undefined;
  return { page, pageSize, q };
}

export function handleRouteError(error: unknown) {
  if (error instanceof HttpError) return jsonError(error);
  if (error instanceof ZodError) {
    const message = error.issues.map(translateZodIssue).join(", ");
    return jsonError(BadRequest(message));
  }
  if (error instanceof Error && (error as { code?: string }).code === "P2025") {
    return jsonError(NotFound(error.message));
  }
  if (error instanceof Error && (error as { code?: string }).code === "P2002") {
    return jsonError(new HttpError(409, "Cette valeur existe déjà"));
  }
  return jsonError(error);
}

export async function ensureCompanyOwnership(companyId: string, userId: string) {
  const company = await prisma.company.findFirst({ where: { id: companyId, userId } });
  if (!company) {
    throw NotFound("Company not found");
  }
  return company;
}

export async function ensureContactOwnership(contactId: string, userId: string) {
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, company: { userId } },
  });
  if (!contact) throw NotFound("Contact not found");
  return contact;
}

export function requireJson(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) throw BadRequest("Content-Type must be application/json");
}

