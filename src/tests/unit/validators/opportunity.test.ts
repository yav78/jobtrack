import { describe, expect, it } from "vitest";
import { opportunityCreateSchema } from "@/lib/validators/opportunity";

describe("opportunity validators", () => {
  it("valid create", () => {
    const parsed = opportunityCreateSchema.parse({ title: "Dev", description: "desc" });
    expect(parsed.title).toBe("Dev");
  });

  it("rejects empty title", () => {
    expect(() => opportunityCreateSchema.parse({ title: "" })).toThrow();
  });
});

