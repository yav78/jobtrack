import { describe, expect, it } from "vitest";
import { opportunityCreateSchema, opportunityUpdateSchema } from "@/lib/validators/opportunity";

describe("opportunity validators", () => {
  it("valid create", () => {
    const parsed = opportunityCreateSchema.parse({ title: "Dev", description: "desc" });
    expect(parsed.title).toBe("Dev");
  });

  it("rejects empty title", () => {
    expect(() => opportunityCreateSchema.parse({ title: "" })).toThrow();
  });

  describe("sourceUrl on create", () => {
    it("accepts a valid URL", () => {
      const parsed = opportunityCreateSchema.parse({
        title: "Dev",
        sourceUrl: "https://example.com/job/123",
      });
      expect(parsed.sourceUrl).toBe("https://example.com/job/123");
    });

    it("rejects an invalid URL", () => {
      expect(() =>
        opportunityCreateSchema.parse({ title: "Dev", sourceUrl: "not-a-url" })
      ).toThrow();
    });

    it("accepts null", () => {
      const parsed = opportunityCreateSchema.parse({ title: "Dev", sourceUrl: null });
      expect(parsed.sourceUrl).toBeNull();
    });

    it("accepts undefined (omitted)", () => {
      const parsed = opportunityCreateSchema.parse({ title: "Dev" });
      expect(parsed.sourceUrl).toBeUndefined();
    });
  });

  describe("sourceUrl on update", () => {
    it("accepts a valid URL", () => {
      const parsed = opportunityUpdateSchema.parse({
        sourceUrl: "https://jobs.example.com/456",
      });
      expect(parsed.sourceUrl).toBe("https://jobs.example.com/456");
    });

    it("rejects an invalid URL", () => {
      expect(() =>
        opportunityUpdateSchema.parse({ sourceUrl: "ftp-not-valid" })
      ).toThrow();
    });

    it("accepts null", () => {
      const parsed = opportunityUpdateSchema.parse({ sourceUrl: null });
      expect(parsed.sourceUrl).toBeNull();
    });

    it("accepts undefined (omitted)", () => {
      const parsed = opportunityUpdateSchema.parse({});
      expect(parsed.sourceUrl).toBeUndefined();
    });
  });
});
