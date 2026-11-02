import "server-only";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { OpenAIEmbeddings } from "@langchain/openai";
import caseFiles from "@/data/case.json";
import { SUSPECT_IDS, type SuspectId } from "./suspects";

// A file with no "thieves" list is true in every version of the case.
type CaseFile = (typeof caseFiles)[number] & { thieves?: string[] };
const allFiles: CaseFile[] = caseFiles;

export const filesFor = (thief: SuspectId) =>
  allFiles.filter((f) => (f.thieves ?? SUSPECT_IDS).includes(thief));

const documents = allFiles.map((f) => ({
  pageContent: f.content,
  metadata: { id: f.id, title: f.title, visibleTo: f.visibleTo, thieves: f.thieves ?? SUSPECT_IDS },
}));

// Caches the promise, not the store: callers can never see a half-built store,
// and a failed embedding clears the cache so the next request retries.
export function makeStoreLoader(makeEmbeddings: () => EmbeddingsInterface) {
  let pending: Promise<MemoryVectorStore> | null = null;
  return () => {
    if (!pending) {
      const store = new MemoryVectorStore(makeEmbeddings());
      pending = store.addDocuments(documents).then(
        () => store,
        (err) => {
          pending = null;
          throw err;
        },
      );
    }
    return pending;
  };
}

export const getStore = makeStoreLoader(
  () => new OpenAIEmbeddings({ model: "text-embedding-3-small" }),
);
