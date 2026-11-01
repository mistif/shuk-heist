import "server-only";
import { ChatOpenAI } from "@langchain/openai";
import { createAgent } from "langchain";
import type { DifficultyId } from "./difficulty";
import { ASSISTANT_PROMPT, LEVEL_REMINDERS, suspectPrompt } from "./prompts";
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

function makeSuspect(id: SuspectId, difficulty: DifficultyId, claimNote?: string) {
  const prompt = suspectPrompt(id, difficulty);
  return createAgent({
    model: makeModel(),
    tools: [makeSearchTool(id, getStore, LEVEL_REMINDERS[difficulty])],
    systemPrompt: claimNote ? `${prompt}\n\n${claimNote}` : prompt,
    responseFormat: SuspectReply,
  });
}

// Created on first use so that importing this file during `next build` needs no API key.
let assistant: ReturnType<typeof makeAssistant> | null = null;
const suspects = new Map<string, ReturnType<typeof makeSuspect>>();

// Routes call this first, so a failed store build returns a 500 instead of reaching the model.
export async function prepareSearch() {
  await getStore();
}

export function getAssistant() {
  assistant ??= makeAssistant();
  return assistant;
}

export function getSuspect(id: SuspectId, difficulty: DifficultyId, claimNote?: string) {
  // A claim note changes on every message, so that agent is built fresh and not cached.
  if (claimNote) return makeSuspect(id, difficulty, claimNote);

  const key = `${id}:${difficulty}`;
  let agent = suspects.get(key);
  if (!agent) {
    agent = makeSuspect(id, difficulty);
    suspects.set(key, agent);
  }
  return agent;
}
