import { describe, expect, it } from "vitest";
import { documentCreateSchema, documentUpdateSchema } from "@/lib/validators/document";

describe("documentCreateSchema", () => {
  it("accepts valid title only", () => {
    const result = documentCreateSchema.parse({ title: "Mon CV" });
    expect(result.title).toBe("Mon CV");
    expect(result.description).toBeUndefined();
  });

  it("accepts title + description", () => {
    const result = documentCreateSchema.parse({
      title: "CV Senior",
      description: "Version 2024",
    });
    expect(result.description).toBe("Version 2024");
  });

  it("rejects empty title", () => {
    expect(() => documentCreateSchema.parse({ title: "" })).toThrow();
  });

  it("rejects title over 255 chars", () => {
    expect(() => documentCreateSchema.parse({ title: "a".repeat(256) })).toThrow();
  });

  it("rejects description over 1000 chars", () => {
    expect(() =>
      documentCreateSchema.parse({ title: "CV", description: "x".repeat(1001) })
    ).toThrow();
  });
});

describe("documentUpdateSchema", () => {
  it("accepts title-only update", () => {
    const result = documentUpdateSchema.parse({ title: "Nouveau titre" });
    expect(result.title).toBe("Nouveau titre");
  });

  it("accepts description-only update", () => {
    const result = documentUpdateSchema.parse({ description: "updated" });
    expect(result.description).toBe("updated");
  });

  it("rejects empty object", () => {
    expect(() => documentUpdateSchema.parse({})).toThrow();
  });

  it("rejects empty title string", () => {
    expect(() => documentUpdateSchema.parse({ title: "" })).toThrow();
  });
});
