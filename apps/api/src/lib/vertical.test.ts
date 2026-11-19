import { describe, expect, it } from "vitest";
import { parseVertical } from "./vertical";

describe("parseVertical", () => {
  it("maps URL segments to verticals", () => {
    expect(parseVertical("cars")).toBe("CARS");
    expect(parseVertical("Gadgets")).toBe("GADGETS");
  });
  it("rejects unknown segments with a 404", () => {
    expect(() => parseVertical("phones")).toThrowError(/Unknown vertical/);
    try {
      parseVertical("phones");
    } catch (e) {
      expect((e as { statusCode?: number }).statusCode).toBe(404);
    }
  });
});
