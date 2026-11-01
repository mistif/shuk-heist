import { describe, expect, it } from "vitest";
import caseFiles from "@/data/case.json";
import { SOLUTION } from "@/lib/solution";
import { isSuspectId, SUSPECT_IDS } from "@/lib/suspects";

const VIEWERS = ["detective", ...SUSPECT_IDS];

describe("case data", () => {
  it("has all 14 documents, each once", () => {
    expect(caseFiles.map((f) => f.id).sort()).toEqual(
      ["B1", "C1", "C2", "C3", "C4", "C5", "S1", "S2", "S3", "S4", "X1", "X2", "X3", "X4"],
    );
  });

  it("has title, content and known viewers on every document", () => {
    for (const f of caseFiles) {
      expect(f.title.length).toBeGreaterThan(0);
      expect(f.content.length).toBeGreaterThan(0);
      expect(f.visibleTo.length).toBeGreaterThan(0);
      for (const v of f.visibleTo) expect(VIEWERS).toContain(v);
    }
  });

  it("gives each private file to its one suspect only", () => {
    const owners: Record<string, string> = { X1: "dani", X2: "noa", X3: "yossi", X4: "maya" };
    for (const [id, owner] of Object.entries(owners)) {
      expect(caseFiles.find((f) => f.id === id)?.visibleTo).toEqual([owner]);
    }
  });

  it("keeps the solution out of the documents", () => {
    expect(JSON.stringify(caseFiles)).not.toContain(SOLUTION.explanation);
    expect(caseFiles.some((f) => f.id.toLowerCase().includes("solution"))).toBe(false);
  });

  it("names a real suspect as culprit", () => {
    expect(isSuspectId(SOLUTION.culprit)).toBe(true);
  });
});
