import { describe, expect, it } from "vitest";
import caseFiles from "@/data/case.json";
import { SOLUTIONS, thiefFor } from "@/lib/solution";
import { filesFor } from "@/lib/store";
import { SUSPECT_IDS } from "@/lib/suspects";

const VIEWERS = ["detective", ...SUSPECT_IDS];
const PRIVATE_FILES = { dani: "X1", noa: "X2", yossi: "X3", maya: "X4" } as const;

describe("case data", () => {
  for (const thief of SUSPECT_IDS) {
    describe(`when ${thief} is the thief`, () => {
      const files = filesFor(thief);

      it("has all 14 documents, each once", () => {
        expect(files.map((f) => f.id).sort()).toEqual(
          ["B1", "C1", "C2", "C3", "C4", "C5", "S1", "S2", "S3", "S4", "X1", "X2", "X3", "X4"],
        );
      });

      it("gives each private file to its one suspect only", () => {
        for (const [owner, id] of Object.entries(PRIVATE_FILES)) {
          expect(files.find((f) => f.id === id)?.visibleTo).toEqual([owner]);
        }
      });

      it("makes only the thief's file say they did it", () => {
        for (const [owner, id] of Object.entries(PRIVATE_FILES)) {
          const confessed = files.find((f) => f.id === id)!.content.includes("You are the thief");
          expect(confessed).toBe(owner === thief);
        }
      });

      it("gives the thief a rule for when to confess", () => {
        const own = files.find((f) => f.id === PRIVATE_FILES[thief])!.content;
        expect(own).toContain("TWO or more pieces");
      });

      it("has an explanation that names the thief and is not in the files", () => {
        const { explanation } = SOLUTIONS[thief];
        expect(explanation).toMatch(/took the notebook/);
        expect(JSON.stringify(files)).not.toContain(explanation);
      });
    });
  }

  it("has title, content and known viewers on every document", () => {
    for (const f of caseFiles) {
      expect(f.title.length).toBeGreaterThan(0);
      expect(f.content.length).toBeGreaterThan(0);
      expect(f.visibleTo.length).toBeGreaterThan(0);
      for (const v of f.visibleTo) expect(VIEWERS).toContain(v);
    }
  });
});

describe("thiefFor", () => {
  const ids = Array.from({ length: 400 }, (_, i) => `case-${i}`);

  it("stays the same for a whole case", () => {
    expect(thiefFor("case-1", "secret")).toBe(thiefFor("case-1", "secret"));
  });

  it("picks every suspect, about equally", () => {
    const counts = new Map<string, number>();
    for (const id of ids) {
      const thief = thiefFor(id, "secret");
      counts.set(thief, (counts.get(thief) ?? 0) + 1);
    }
    for (const suspect of SUSPECT_IDS) {
      expect(counts.get(suspect)).toBeGreaterThan(60);
    }
  });

  it("depends on the secret, so the browser can't work it out", () => {
    const differs = ids.some((id) => thiefFor(id, "one") !== thiefFor(id, "two"));
    expect(differs).toBe(true);
  });

  it("refuses to run with no secret", () => {
    expect(() => thiefFor("case-1", "")).toThrow();
  });
});
