import { describe, expect, it } from "vitest";
import { linkCreateSchema, linkListQuerySchema, linkUpdateSchema } from "@/lib/validators/link";

describe("link validators", () => {
  it("valid link create", () => {
    const parsed = linkCreateSchema.parse({
      title: "Welcome to the Jungle",
      url: "https://www.welcometothejungle.com",
      category: "JOBBOARD",
      notes: "Compte pro",
    });
    expect(parsed.title).toBe("Welcome to the Jungle");
    expect(parsed.category).toBe("JOBBOARD");
  });

  it("defaults category to OTHER", () => {
    const parsed = linkCreateSchema.parse({
      title: "Tool",
      url: "https://example.com",
    });
    expect(parsed.category).toBe("OTHER");
  });

  it("rejects invalid url", () => {
    expect(() =>
      linkCreateSchema.parse({
        title: "x",
        url: "not-a-url",
      })
    ).toThrow();
  });

  it("rejects empty title", () => {
    expect(() =>
      linkCreateSchema.parse({
        title: "",
        url: "https://example.com",
      })
    ).toThrow();
  });

  it("link update allows partial", () => {
    const parsed = linkUpdateSchema.parse({ title: "New title" });
    expect(parsed.title).toBe("New title");
    expect(parsed.url).toBeUndefined();
  });

  it("link list query parses filters", () => {
    const parsed = linkListQuerySchema.parse({
      page: "2",
      pageSize: "10",
      q: "  jungle ",
      category: "JOBBOARD",
    });
    expect(parsed.page).toBe(2);
    expect(parsed.q).toBe("jungle");
    expect(parsed.category).toBe("JOBBOARD");
  });
});
