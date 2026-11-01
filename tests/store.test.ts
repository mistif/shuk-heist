import { FakeEmbeddings } from "@langchain/core/utils/testing";
import { describe, expect, it, vi } from "vitest";
import caseFiles from "@/data/case.json";
import { makeStoreLoader } from "@/lib/store";

describe("store loader", () => {
  it("builds once and never exposes an empty store to concurrent callers", async () => {
    const embeddings = new FakeEmbeddings();
    const make = vi.fn(() => embeddings);
    const load = makeStoreLoader(make);

    const [a, b] = await Promise.all([load(), load()]);

    expect(make).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
    expect(a.memoryVectors).toHaveLength(caseFiles.length);
  });

  it("retries after an embedding failure", async () => {
    const good = new FakeEmbeddings();
    const bad = {
      embedQuery: async () => [0],
      embedDocuments: async () => {
        throw new Error("embedding down");
      },
    };
    const make = vi.fn<() => typeof good | typeof bad>().mockReturnValueOnce(bad).mockReturnValue(good);
    const load = makeStoreLoader(make);

    await expect(load()).rejects.toThrow("embedding down");
    const store = await load();

    expect(store.memoryVectors).toHaveLength(caseFiles.length);
  });
});
