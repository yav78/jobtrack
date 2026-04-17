import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { GET as getLinks, POST as postLink } from "@/app/api/links/route";
import { GET as getLink, PATCH as patchLink, DELETE as deleteLink } from "@/app/api/links/[id]/route";

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

describe("API links", () => {
  beforeAll(async () => {
    await prisma.link.deleteMany({ where: { userId } });
    await prisma.user.upsert({
      where: { id: userId },
      update: { fullName: "Demo", email: "demo@example.com" },
      create: { id: userId, fullName: "Demo", email: "demo@example.com", password: "x" },
    });
  });

  afterAll(async () => {
    await prisma.link.deleteMany({ where: { userId } });
    await prisma.$disconnect();
  });

  it("creates, lists with category filter, gets one, patches, deletes", async () => {
    const resCreate = await postLink(
      makeRequest("http://localhost/api/links", "POST", {
        title: "Board",
        url: "https://example.com/board",
        category: "JOBBOARD",
        notes: "Note test",
      })
    );
    expect(resCreate.status).toBe(201);
    const created = await resCreate.json();
    expect(created.title).toBe("Board");
    expect(created.category).toBe("JOBBOARD");
    const id = created.id as string;

    const resListAll = await getLinks(makeRequest("http://localhost/api/links", "GET"));
    const listAll = await resListAll.json();
    expect(listAll.items.some((l: { id: string }) => l.id === id)).toBe(true);

    const resListFilter = await getLinks(
      makeRequest("http://localhost/api/links?category=TOOL", "GET")
    );
    const listFilter = await resListFilter.json();
    expect(listFilter.items.every((l: { category: string }) => l.category === "TOOL")).toBe(true);

    const resListJb = await getLinks(makeRequest("http://localhost/api/links?category=JOBBOARD", "GET"));
    const listJb = await resListJb.json();
    expect(listJb.items.some((l: { id: string }) => l.id === id)).toBe(true);

    const resGet = await getLink(makeRequest(`http://localhost/api/links/${id}`, "GET"), {
      params: { id },
    });
    expect(resGet.status).toBe(200);
    const one = await resGet.json();
    expect(one.id).toBe(id);

    const resPatch = await patchLink(
      makeRequest(`http://localhost/api/links/${id}`, "PATCH", {
        title: "Board updated",
        category: "TOOL",
      }),
      { params: { id } }
    );
    expect(resPatch.status).toBe(200);
    const updated = await resPatch.json();
    expect(updated.title).toBe("Board updated");
    expect(updated.category).toBe("TOOL");

    const resDel = await deleteLink(makeRequest(`http://localhost/api/links/${id}`, "DELETE"), {
      params: { id },
    });
    expect(resDel.status).toBe(200);

    const resGet404 = await getLink(makeRequest(`http://localhost/api/links/${id}`, "GET"), {
      params: { id },
    });
    expect(resGet404.status).toBe(404);
  });
});
