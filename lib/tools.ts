import "server-only";
import type { Document } from "@langchain/core/documents";
import { tool } from "langchain";
import * as z from "zod";
import { getStore } from "./store";
import type { SuspectId } from "./suspects";

export type Viewer = "detective" | SuspectId;

export const SEARCH_UNAVAILABLE =
  "Search is unavailable right now. State no facts, and say briefly that you can't answer at the moment.";

export const canSee = (viewer: Viewer) => (doc: Document) =>
  doc.metadata.visibleTo.includes(viewer);

export function makeSearchTool(viewer: Viewer, loadStore = getStore, levelRule?: string) {
  return tool(
    async ({ query }) => {
      // LangChain hands tool errors to the model as text, so catch them here:
      // the model must not see error details or answer as if it had searched.
      try {
        const store = await loadStore();
        const docs = await store.similaritySearch(query, 4, canSee(viewer));
        if (docs.length === 0) return "No documents found.";
        const found = docs
          .map((d) => `[${d.metadata.id}] ${d.metadata.title}\n${d.pageContent}`)
          .join("\n\n");
        return levelRule ? `${found}\n\n${levelRule}` : found;
      } catch (err) {
        console.error(err);
        return SEARCH_UNAVAILABLE;
      }
    },
    {
      name: "search_files",
      description: "Search the documents you have access to. Use it before answering.",
      schema: z.object({ query: z.string().describe("What to look for") }),
    },
  );
}
