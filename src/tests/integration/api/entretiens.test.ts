import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { POST as postEntretien } from "@/app/api/entretiens/route";
import { NextRequest } from "next/server";

const userId = "00000000-0000-0000-0000-000000000001";

function makeRequest(url: string, method: string, body?: unknown) {
  return new NextRequest(url, {
    method,
    headers: { "content-type": "application/json", "x-user-id": userId },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("API entretiens", () => {
  let contactId: string;
  let channelId: string;
  let opportunityId: string;

  beforeAll(async () => {
    await prisma.entretienContact.deleteMany();
    await prisma.entretien.deleteMany();
    await prisma.workOpportunity.deleteMany();
    await prisma.contactChannel.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.location.deleteMany();
    await prisma.company.deleteMany();
    await prisma.companyType.createMany({
      data: [{ code: "CLIENT_FINAL", label: "Client" }],
      skipDuplicates: true,
    });
    await prisma.user.upsert({
      where: { id: userId },
      update: { fullName: "Demo", email: "demo@example.com" },
      create: { id: userId, fullName: "Demo", email: "demo@example.com", password: "x" },
    });

    const company = await prisma.company.create({
      data: { name: "EntCo", typeCode: "CLIENT_FINAL", userId },
    });
    const contact = await prisma.contact.create({
      data: { companyId: company.id, firstName: "Bob", lastName: "Lee", userId },
    });
    const channel = await prisma.contactChannel.create({
      data: { contactId: contact.id, channelTypeCode: "EMAIL", value: "bob@example.com", isPrimary: true },
    });
    const opp = await prisma.workOpportunity.create({
      data: { title: "Op Ent", userId, companyId: company.id },
    });
    contactId = contact.id;
    channelId = channel.id;
    opportunityId = opp.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates entretien with contacts", async () => {
    const res = await postEntretien(
      makeRequest("http://localhost/api/entretiens", "POST", {
        date: new Date().toISOString(),
        workOpportunityId: opportunityId,
        contactChannelId: channelId,
        contactIds: [contactId],
      })
    );
    const ent = await res.json();
    if ("error" in ent) {
      throw new Error(`Create entretien failed: ${ent.error}`);
    }
    expect(res.status).toBe(201);
    expect(ent.contacts.length).toBe(1);
  });
});

