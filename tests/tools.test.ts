import { FakeEmbeddings } from "@langchain/core/utils/testing";
import { describe, expect, it, vi } from "vitest";
import { makeStoreLoader } from "@/lib/store";
import { SUSPECT_IDS } from "@/lib/suspects";
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
    it(`${viewer} sees exactly their documents when Maya is the thief`, async () => {
      const store = await load();
      const docs = await store.similaritySearch("anything", 100, canSee(viewer, "maya"));
      expect(docs.map((d) => d.metadata.id).sort()).toEqual(ids);
    });
  }

  it("shows the detective one version of each file, in every case", async () => {
    const store = await load();
    for (const thief of SUSPECT_IDS) {
      const docs = await store.similaritySearch("anything", 100, canSee("detective", thief));
      expect(docs.map((d) => d.metadata.id).sort()).toEqual(EXPECTED.detective);
    }
  });

  it("shows the digital evidence to the thief and to no other suspect", async () => {
    const store = await load();
    const seen = await store.similaritySearch("anything", 100, canSee("dani", "dani"));
    expect(seen.map((d) => d.metadata.id).sort()).toEqual(["B1", "C5", "S1", "X1"]);
    const notSeen = await store.similaritySearch("anything", 100, canSee("noa", "dani"));
    expect(notSeen.map((d) => d.metadata.id)).not.toContain("C5");
  });
});

describe("search_files", () => {
  it("returns only allowed documents with their IDs", async () => {
    const output = await makeSearchTool("dani", "maya", load).invoke({ query: "Maya's secret" });
    expect(output).toContain("[X1]");
    expect(output).not.toContain("[X4]");
    expect(output).not.toContain("Golden Spoon");
  });

  it("adds the level rule after the documents", async () => {
    const output = await makeSearchTool("dani", "maya", load, "LEVEL RULE").invoke({ query: "anything" });
    expect(output.endsWith("LEVEL RULE")).toBe(true);
  });

  it("returns at most 4 documents to the detective", async () => {
    const output = await makeSearchTool("detective", "maya", load).invoke({ query: "notebook" });
    expect(output.match(/^\[[A-Z]\d\]/gm)).toHaveLength(4);
    expect(output).not.toMatch(/\[X\d\]/);
  });

  it("keeps failure details away from the model", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const failing = async () => {
      throw new Error("sk-secret-key rate limit");
    };
    const output = await makeSearchTool("dani", "maya", failing).invoke({ query: "anything" });
    expect(output).toBe(SEARCH_UNAVAILABLE);
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});
