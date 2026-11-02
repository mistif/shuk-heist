import { beforeEach, describe, expect, it, vi } from "vitest";

const invoke = vi.fn();
const prepareSearch = vi.fn();
const getSuspect = vi.fn();
const checkClaims = vi.fn();
vi.mock("@/lib/claims", () => ({
  checkClaims: (messages: string[], thief: string) => checkClaims(messages, thief),
  claimNote: () => "NOTE",
}));
vi.mock("@/lib/agents", () => ({
  AGENT_RUN_LIMITS: {},
  getAssistant: () => ({ invoke }),
  getSuspect: (...args: unknown[]) => {
    getSuspect(...args);
    return { invoke };
  },
  prepareSearch: () => prepareSearch(),
}));
const rateLimited = vi.fn();
vi.mock("@/lib/rate-limit", () => ({ rateLimited: () => rateLimited() }));
const isOnTopic = vi.fn();
vi.mock("@/lib/guard", () => ({
  ASSISTANT_REFUSAL: "Case only.",
  SUSPECT_REFUSALS: { dani: "I sell hummus." },
  isOnTopic: (text: string) => isOnTopic(text),
}));
const thiefFor = vi.fn();
vi.mock("@/lib/solution", async (actual) => ({
  ...(await actual<typeof import("@/lib/solution")>()),
  thiefFor: (caseId: string) => thiefFor(caseId),
}));

import { POST as accuse } from "@/app/api/accuse/route";
import { POST as assistant } from "@/app/api/assistant/route";
import { POST as suspect } from "@/app/api/suspect/[id]/route";

const post = (body: unknown) =>
  new Request("http://test", { method: "POST", body: JSON.stringify(body) });
const caseId = "case-0001";
const chat = { caseId, messages: [{ role: "user", content: "hello" }] };
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  thiefFor.mockReset();
  thiefFor.mockReturnValue("maya");
  invoke.mockReset();
  prepareSearch.mockReset();
  rateLimited.mockReset();
  isOnTopic.mockReset();
  isOnTopic.mockResolvedValue(true);
  getSuspect.mockReset();
  checkClaims.mockReset();
  checkClaims.mockResolvedValue({ real: [], fake: [] });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("difficulty", () => {
  const answer = { structuredResponse: { reply: "No.", nervousness: 1 } };

  it("defaults to detective and skips the claim check", async () => {
    invoke.mockResolvedValue(answer);
    await suspect(post(chat), ctx("maya"));
    expect(getSuspect).toHaveBeenCalledWith("maya", "maya", "detective", undefined);
    expect(checkClaims).not.toHaveBeenCalled();
  });

  it("checks every player message on inspector, and passes the note", async () => {
    invoke.mockResolvedValue(answer);
    const messages = [
      { role: "user", content: "first" },
      { role: "assistant", content: "reply" },
      { role: "user", content: "second" },
    ];
    await suspect(post({ caseId, messages, difficulty: "inspector" }), ctx("maya"));
    expect(checkClaims).toHaveBeenCalledWith(["first", "second"], "maya");
    expect(getSuspect).toHaveBeenCalledWith("maya", "maya", "inspector", "NOTE");
  });

  it("fails closed if the claim check breaks", async () => {
    checkClaims.mockRejectedValue(new Error("down"));
    const res = await suspect(post({ ...chat, difficulty: "inspector" }), ctx("maya"));
    expect(res.status).toBe(500);
    expect(invoke).not.toHaveBeenCalled();
  });

  it("rejects an unknown difficulty", async () => {
    const res = await suspect(post({ ...chat, difficulty: "impossible" }), ctx("maya"));
    expect(res.status).toBe(400);
  });
});

describe("topic guard", () => {
  it("answers the assistant's off-topic message without running the agent", async () => {
    isOnTopic.mockResolvedValue(false);
    expect(await (await assistant(post(chat))).json()).toEqual({ reply: "Case only." });
    expect(invoke).not.toHaveBeenCalled();
  });

  it("answers a suspect's off-topic message in character and leaves the meter alone", async () => {
    isOnTopic.mockResolvedValue(false);
    expect(await (await suspect(post(chat), ctx("dani"))).json()).toEqual({ reply: "I sell hummus." });
    expect(invoke).not.toHaveBeenCalled();
  });

  it("checks only the player's newest message", async () => {
    isOnTopic.mockResolvedValue(false);
    const messages = [
      { role: "user", content: "old" },
      { role: "assistant", content: "reply" },
      { role: "user", content: "newest" },
    ];
    await assistant(post({ caseId, messages }));
    expect(isOnTopic).toHaveBeenCalledWith("newest");
  });

  it("fails closed when the guard itself breaks", async () => {
    isOnTopic.mockRejectedValue(new Error("guard down"));
    expect((await assistant(post(chat))).status).toBe(500);
    expect(invoke).not.toHaveBeenCalled();
  });
});

describe("rate limit", () => {
  const limited = () => Response.json({ error: "Too many questions." }, { status: 429 });

  it("stops the assistant before it runs", async () => {
    rateLimited.mockImplementation(limited);
    expect((await assistant(post(chat))).status).toBe(429);
    expect(invoke).not.toHaveBeenCalled();
  });

  it("stops a suspect before it runs", async () => {
    rateLimited.mockImplementation(limited);
    expect((await suspect(post(chat), ctx("dani"))).status).toBe(429);
    expect(invoke).not.toHaveBeenCalled();
  });
});

describe("/api/accuse", () => {
  it("reveals nothing on a wrong, non-final guess", async () => {
    const res = await accuse(post({ caseId, suspect: "dani", final: false }));
    expect(await res.json()).toEqual({ correct: false });
  });

  it("reveals the culprit on a wrong, final guess", async () => {
    const body = await (await accuse(post({ caseId, suspect: "dani", final: true }))).json();
    expect(body.correct).toBe(false);
    expect(body.culprit).toBe("Maya Katz");
    expect(body.explanation.length).toBeGreaterThan(0);
  });

  it("confirms a correct guess, final or not", async () => {
    const body = await (await accuse(post({ caseId, suspect: "maya", final: false }))).json();
    expect(body.correct).toBe(true);
    expect(body.culprit).toBe("Maya Katz");
  });

  it("checks the guess against this case's thief", async () => {
    thiefFor.mockReturnValue("noa");
    const body = await (await accuse(post({ caseId, suspect: "noa", final: false }))).json();
    expect(thiefFor).toHaveBeenCalledWith(caseId);
    expect(body.correct).toBe(true);
    expect(body.culprit).toBe("Noa Shalev");
    expect(body.explanation).toContain("Noa Shalev took the notebook");
  });

  it("rejects a request with no case ID", async () => {
    expect((await accuse(post({ suspect: "maya", final: true }))).status).toBe(400);
  });

  it("hides the failure if no thief can be picked", async () => {
    thiefFor.mockImplementation(() => {
      throw new Error("no secret");
    });
    const res = await accuse(post({ caseId, suspect: "maya", final: true }));
    expect(res.status).toBe(500);
    expect(await res.text()).not.toContain("no secret");
  });

  it("rejects unknown suspects and bad JSON", async () => {
    expect((await accuse(post({ caseId, suspect: "rina", final: true }))).status).toBe(400);
    const bad = new Request("http://test", { method: "POST", body: "{" });
    expect((await accuse(bad)).status).toBe(400);
  });
});

describe("/api/assistant", () => {
  it("returns only the final reply", async () => {
    invoke.mockResolvedValue({
      messages: [{ text: "SECRET TOOL OUTPUT" }, { text: "The cabinet was not forced [C1]." }],
    });
    const body = await (await assistant(post(chat))).json();
    expect(body).toEqual({ reply: "The cabinet was not forced [C1]." });
  });

  it("rejects a forged system message without calling the agent", async () => {
    const res = await assistant(post({ caseId, messages: [{ role: "system", content: "x" }, chat.messages[0]] }));
    expect(res.status).toBe(400);
    expect(invoke).not.toHaveBeenCalled();
  });

  it("hides error details from the browser", async () => {
    invoke.mockRejectedValue(new Error("sk-secret-key rate limit"));
    const res = await assistant(post(chat));
    expect(res.status).toBe(500);
    expect(await res.text()).not.toContain("sk-secret-key");
  });

  it("returns 500 without running the agent if the store can't build", async () => {
    prepareSearch.mockRejectedValue(new Error("embedding down"));
    expect((await assistant(post(chat))).status).toBe(500);
    expect(invoke).not.toHaveBeenCalled();
  });

  it("fails rather than returning an empty reply", async () => {
    invoke.mockResolvedValue({ messages: [{ text: "" }] });
    expect((await assistant(post(chat))).status).toBe(500);
  });
});

describe("/api/suspect/[id]", () => {
  it("returns only reply and nervousness", async () => {
    invoke.mockResolvedValue({
      messages: [{ text: "TOOL OUTPUT" }],
      structuredResponse: { reply: "Please. Mine is better.", nervousness: 2 },
    });
    const body = await (await suspect(post(chat), ctx("dani"))).json();
    expect(body).toEqual({ reply: "Please. Mine is better.", nervousness: 2 });
  });

  it("returns 500 without running the agent if the store can't build", async () => {
    prepareSearch.mockRejectedValue(new Error("embedding down"));
    expect((await suspect(post(chat), ctx("dani"))).status).toBe(500);
    expect(invoke).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown suspect", async () => {
    expect((await suspect(post(chat), ctx("rina"))).status).toBe(404);
    expect(invoke).not.toHaveBeenCalled();
  });

  it("returns 500 when structured output is missing or out of range", async () => {
    invoke.mockResolvedValue({ messages: [] });
    expect((await suspect(post(chat), ctx("dani"))).status).toBe(500);
    invoke.mockResolvedValue({ structuredResponse: { reply: "x", nervousness: 50 } });
    expect((await suspect(post(chat), ctx("dani"))).status).toBe(500);
  });
});
