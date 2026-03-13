import { handleRouteError, requireUserId } from "@/lib/api-helpers";
import { getAllOpportunitiesForExport } from "@/lib/services/back/opportunities";

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
    const items = await getAllOpportunitiesForExport(userId);
    const rows = items.map((o) => ({
      id: o.id,
      titre: o.title,
      statut: o.status,
      entreprise: o.company?.name ?? "",
      description: o.description ?? "",
      relance: o.followUpAt ? new Date(o.followUpAt).toISOString().slice(0, 10) : "",
      createdAt: new Date(o.createdAt).toISOString().slice(0, 10),
    }));
    const csv = toCsv(rows as unknown as Record<string, unknown>[], [
      "id",
      "titre",
      "statut",
      "entreprise",
      "description",
      "relance",
      "createdAt",
    ]);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="opportunites.csv"',
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
