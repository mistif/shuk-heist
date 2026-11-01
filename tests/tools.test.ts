import { FakeEmbeddings } from "@langchain/core/utils/testing";
import { describe, expect, it, vi } from "vitest";
import { makeStoreLoader } from "@/lib/store";
import { canSee, makeSearchTool, SEARCH_UNAVAILABLE, type Viewer } from "@/lib/tools";

const load = makeStoreLoader(() => new FakeEmbeddings());

const EXPECTED: Record<Viewer, string[]> = {
  detective: ["B1", "C1", "C2", "C3", "C4", "C5", "S1", "S2", "S3", "S4"],
  dani: ["B1", "S1", "X1"],
  noa: ["B1", "S2", "X2"],
  yossi: ["B1", "C4", "S3", "X3"],
  maya: ["B1", "C5", "S4", "X4"],
};

describe("visibility", () => {
  for (const [viewer, ids] of Object.entries(EXPECTED) as [Viewer, string[]][]) {
    it(`${viewer} sees exactly their documents`, async () => {
      const store = await load();
      const docs = await store.similaritySearch("anything", 100, canSee(viewer));
      expect(docs.map((d) => d.metadata.id).sort()).toEqual(ids);
    });
  }
});

describe("search_files", () => {
  it("returns only allowed documents with their IDs", async () => {
    const output = await makeSearchTool("dani", load).invoke({ query: "Maya's secret" });
    expect(output).toContain("[X1]");
    expect(output).not.toContain("[X4]");
    expect(output).not.toContain("Golden Spoon");
  });

  it("adds the level rule after the documents", async () => {
    const output = await makeSearchTool("dani", load, "LEVEL RULE").invoke({ query: "anything" });
    expect(output.endsWith("LEVEL RULE")).toBe(true);
  });

  it("returns at most 4 documents to the detective", async () => {
    const output = await makeSearchTool("detective", load).invoke({ query: "notebook" });
    expect(output.match(/^\[[A-Z]\d\]/gm)).toHaveLength(4);
    expect(output).not.toMatch(/\[X\d\]/);
  });

  it("keeps failure details away from the model", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const failing = async () => {
      throw new Error("sk-secret-key rate limit");
    };
    const output = await makeSearchTool("dani", failing).invoke({ query: "anything" });
    expect(output).toBe(SEARCH_UNAVAILABLE);
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});
