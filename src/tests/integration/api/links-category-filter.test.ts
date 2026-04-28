import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/links/route";
import { NextRequest } from "next/server";

const userId = "00000000-0000-0000-0000-000000000001";

function makeRequest(url: string) {
  return new NextRequest(url, {
    method: "GET",
    headers: { "x-user-id": userId },
  });
}

describe("GET /api/links - multi-category filter", () => {
  let jobboardId: string;
  let toolId: string;
  let networkId: string;

  beforeAll(async () => {
    await prisma.link.deleteMany({ where: { userId } });
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, fullName: "Demo", email: "demo@example.com", password: "x" },
    });
    const jb = await prisma.link.create({
      data: { userId, title: "LinkedIn", url: "https://linkedin.com", category: "JOBBOARD" },
    });
    const tool = await prisma.link.create({
      data: { userId, title: "Notion", url: "https://notion.so", category: "TOOL" },
    });
    const network = await prisma.link.create({
      data: { userId, title: "Malt", url: "https://malt.fr", category: "NETWORK" },
    });
    jobboardId = jb.id;
    toolId = tool.id;
    networkId = network.id;
  });

  afterAll(async () => {
    await prisma.link.deleteMany({ where: { userId } });
    await prisma.$disconnect();
  });

  it("filters by single category JOBBOARD", async () => {
    const res = await GET(makeRequest("http://localhost/api/links?category=JOBBOARD"));
    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].id).toBe(jobboardId);
  });

  it("filters by multiple categories TOOL+NETWORK+OTHER (excludes JOBBOARD)", async () => {
    const res = await GET(
      makeRequest("http://localhost/api/links?category=TOOL&category=NETWORK&category=OTHER")
    );
    const body = await res.json();
    expect(body.items.some((i: { id: string }) => i.id === jobboardId)).toBe(false);
    expect(body.items.some((i: { id: string }) => i.id === toolId)).toBe(true);
    expect(body.items.some((i: { id: string }) => i.id === networkId)).toBe(true);
  });
});
