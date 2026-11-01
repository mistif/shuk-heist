import "server-only";
import { ChatOpenAI } from "@langchain/openai";
import { createAgent } from "langchain";
import { ASSISTANT_PROMPT, suspectPrompt } from "./prompts";
import { getStore } from "./store";
import type { SuspectId } from "./suspects";
import { makeSearchTool } from "./tools";
import { SuspectReply } from "./validate";

const MODEL = "gpt-5.4-mini";
// Caps each reply's length and each run's steps, so nobody can use an agent for long jobs.
const MAX_REPLY_TOKENS = 1000;
export const AGENT_RUN_LIMITS = { recursionLimit: 10 };

const makeModel = () => new ChatOpenAI({ model: MODEL, maxTokens: MAX_REPLY_TOKENS });

// An instance, not an "openai:..." string: the string loads the provider through a
// dynamic import that Next's bundler can't resolve.
function makeAssistant() {
  return createAgent({
    model: makeModel(),
    tools: [makeSearchTool("detective")],
    systemPrompt: ASSISTANT_PROMPT,
  });
}

function makeSuspect(id: SuspectId) {
  return createAgent({
    model: makeModel(),
    tools: [makeSearchTool(id)],
    systemPrompt: suspectPrompt(id),
    responseFormat: SuspectReply,
  });
}

// Created on first use so that importing this file during `next build` needs no API key.
let assistant: ReturnType<typeof makeAssistant> | null = null;
const suspects = new Map<SuspectId, ReturnType<typeof makeSuspect>>();

// Routes call this first, so a failed store build returns a 500 instead of reaching the model.
export async function prepareSearch() {
  await getStore();
}

export function getAssistant() {
  assistant ??= makeAssistant();
  return assistant;
}

export function getSuspect(id: SuspectId) {
  let agent = suspects.get(id);
  if (!agent) {
    agent = makeSuspect(id);
    suspects.set(id, agent);
  }
  return agent;
}
