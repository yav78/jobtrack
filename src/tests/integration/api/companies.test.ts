import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { POST as postCompany, GET as getCompanies } from "@/app/api/companies/route";
import { POST as postLocation } from "@/app/api/companies/[id]/locations/route";
import { NextRequest } from "next/server";

const userId = "00000000-0000-0000-0000-000000000001";

function makeRequest(url: string, method: string, body?: unknown) {
  return new NextRequest(url, {
    method,
    headers: {
      "content-type": "application/json",
      "x-user-id": userId,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("API companies/locations", () => {
  beforeAll(async () => {
    await prisma.entretienContact.deleteMany();
    await prisma.entretien.deleteMany();
    await prisma.workOpportunity.deleteMany();
    await prisma.contactChannel.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.location.deleteMany();
    await prisma.company.deleteMany();
    await prisma.companyType.createMany({
      data: [
        { code: "CLIENT_FINAL", label: "Client final" },
        { code: "ESN", label: "ESN" },
      ],
      skipDuplicates: true,
    });
    await prisma.user.upsert({
      where: { id: userId },
      update: { fullName: "Demo", email: "demo@example.com" },
      create: { id: userId, fullName: "Demo", email: "demo@example.com", password: "x" },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates company then lists it", async () => {
    const resCreate = await postCompany(
      makeRequest("http://localhost/api/companies", "POST", {
        name: "TestCo",
        typeCode: "CLIENT_FINAL",
      })
    );
    const dataCreate = await resCreate.json();
    if ("error" in dataCreate) {
      throw new Error(`Create company failed: ${dataCreate.error}`);
    }
    expect(resCreate.status).toBe(201);
    expect(dataCreate.name).toBe("TestCo");

    const resList = await getCompanies(makeRequest("http://localhost/api/companies", "GET"));
    const list = await resList.json();
    expect(list.items.some((c: { name: string }) => c.name === "TestCo")).toBe(true);
  });

  it("creates primary location and switches primary", async () => {
    const resCreate = await postCompany(
      makeRequest("http://localhost/api/companies", "POST", {
        name: "TestCo2",
        typeCode: "CLIENT_FINAL",
      })
    );
    const company = await resCreate.json();
    const companyId = company.id;

    const resLoc1 = await postLocation(
      makeRequest(`http://localhost/api/companies/${companyId}/locations`, "POST", {
        label: "HQ",
        addressLine1: "1 rue",
        zipCode: "75000",
        city: "Paris",
        country: "France",
        isPrimary: true,
      }),
      { params: { id: companyId } as { id: string } }
    );
    const loc1 = await resLoc1.json();
    if ("error" in loc1) {
      throw new Error(`Create location failed: ${loc1.error}`);
    }
    expect(resLoc1.status).toBe(201);
    expect(loc1.isPrimary).toBe(true);

    const resLoc2 = await postLocation(
      makeRequest(`http://localhost/api/companies/${companyId}/locations`, "POST", {
        label: "Annexe",
        addressLine1: "2 rue",
        zipCode: "69000",
        city: "Lyon",
        country: "France",
        isPrimary: true,
      }),
      { params: { id: companyId } as { id: string } }
    );
    const loc2 = await resLoc2.json();
    expect(loc2.isPrimary).toBe(true);

    const allLocs = await prisma.location.findMany({ where: { companyId } });
    const primaries = allLocs.filter((l) => l.isPrimary);
    expect(primaries.length).toBe(1);
  });
});

