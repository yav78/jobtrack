import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { POST as postOpportunity, GET as getOpportunities } from "@/app/api/opportunities/route";
import { NextRequest } from "next/server";

const userId = "00000000-0000-0000-0000-000000000001";

function makeRequest(url: string, method: string, body?: unknown) {
  return new NextRequest(url, {
    method,
    headers: { "content-type": "application/json", "x-user-id": userId },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("API opportunities", () => {
  beforeAll(async () => {
    await prisma.entretienContact.deleteMany();
    await prisma.entretien.deleteMany();
    await prisma.workOpportunity.deleteMany();
    await prisma.contactChannel.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.company.deleteMany();
    await prisma.companyType.createMany({
      data: [{ code: "CLIENT_FINAL", label: "Client" }],
      skipDuplicates: true,
    });
    await prisma.user.upsert({
      where: { id: userId },
      update: { fullName: "Demo", email: "demo@example.com" },
      create: { id: userId, fullName: "Demo", email: "demo@example.com" },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates opportunity then lists", async () => {
    const res = await postOpportunity(
      makeRequest("http://localhost/api/opportunities", "POST", { title: "Op A", description: "desc" })
    );
    expect(res.status).toBe(201);
    const opp = await res.json();
    expect(opp.title).toBe("Op A");

    const resList = await getOpportunities(makeRequest("http://localhost/api/opportunities", "GET"));
    const list = await resList.json();
    expect(list.items.some((o: { title: string }) => o.title === "Op A")).toBe(true);
  });

  describe("sourceUrl", () => {
    it("creates opportunity with a valid sourceUrl", async () => {
      const res = await postOpportunity(
        makeRequest("http://localhost/api/opportunities", "POST", {
          title: "Op with URL",
          sourceUrl: "https://example.com/job/42",
        })
      );
      expect(res.status).toBe(201);
      const opp = await res.json();
      expect(opp.sourceUrl).toBe("https://example.com/job/42");
    });

    it("creates opportunity with sourceUrl null", async () => {
      const res = await postOpportunity(
        makeRequest("http://localhost/api/opportunities", "POST", {
          title: "Op null URL",
          sourceUrl: null,
        })
      );
      expect(res.status).toBe(201);
      const opp = await res.json();
      expect(opp.sourceUrl).toBeNull();
    });

    it("creates opportunity without sourceUrl (omitted)", async () => {
      const res = await postOpportunity(
        makeRequest("http://localhost/api/opportunities", "POST", {
          title: "Op no URL",
        })
      );
      expect(res.status).toBe(201);
      const opp = await res.json();
      expect(opp.sourceUrl == null).toBe(true);
    });

    it("rejects opportunity with invalid sourceUrl", async () => {
      const res = await postOpportunity(
        makeRequest("http://localhost/api/opportunities", "POST", {
          title: "Op bad URL",
          sourceUrl: "not-a-valid-url",
        })
      );
      expect(res.status).toBe(400);
    });
  });
});
