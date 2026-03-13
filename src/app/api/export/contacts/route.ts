import { handleRouteError, requireUserId } from "@/lib/api-helpers";
import { getAllContactsForExport } from "@/lib/services/back/contacts";

function toCsv(rows: Record<string, unknown>[], headers: string[]): string {
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
}

export async function GET() {
  try {
    const userId = await requireUserId();
    const items = await getAllContactsForExport(userId);
    const rows = items.map((c) => ({
      id: c.id,
      prenom: c.firstName,
      nom: c.lastName,
      poste: c.roleTitle ?? "",
      entreprise: c.company?.name ?? "",
      notes: c.notes ?? "",
      createdAt: new Date(c.createdAt).toISOString().slice(0, 10),
    }));
    const csv = toCsv(rows as unknown as Record<string, unknown>[], [
      "id",
      "prenom",
      "nom",
      "poste",
      "entreprise",
      "notes",
      "createdAt",
    ]);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="contacts.csv"',
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
