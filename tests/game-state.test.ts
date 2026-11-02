import { describe, expect, it } from "vitest";
import {
  applyAccusation,
  applyExchange,
  browserStorage,
  clearGame,
  isFinalAccusation,
  loadGame,
  newGame,
  requestMessages,
  saveGame,
  type ChatMessage,
} from "@/lib/game-state";

const fakeStorage = () => {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
};
const blocked = {
  getItem: () => { throw new Error("blocked"); },
  setItem: () => { throw new Error("blocked"); },
  removeItem: () => { throw new Error("blocked"); },
};

describe("newGame", () => {
  it("gives a solo player one accusation and a team two", () => {
    expect(newGame(1).accusationsLeft).toBe(1);
    expect(newGame(2).accusationsLeft).toBe(2);
    expect(newGame(4).accusationsLeft).toBe(2);
    expect(isFinalAccusation(newGame(1))).toBe(true);
    expect(isFinalAccusation(newGame(2))).toBe(false);
  });
});

describe("applyExchange", () => {
  it("adds to the chat that asked, leaving the others alone", () => {
    const game = newGame(1, "g1");
    const next = applyExchange(game, "g1", "dani", "where were you?", "A wedding!", 3);
    expect(next.chats.dani).toEqual([
      { role: "user", content: "where were you?" },
      { role: "assistant", content: "A wedding!" },
    ]);
    expect(next.chats.maya).toEqual([]);
    expect(next.nervousness.dani).toBe(3);
  });

  it("ignores a reply that arrives after a new game started", () => {
    const game = newGame(1, "new");
    expect(applyExchange(game, "old", "dani", "q", "a", 9)).toBe(game);
  });
});

describe("requestMessages", () => {
  const history = (n: number): ChatMessage[] =>
    Array.from({ length: n }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: String(i),
    }));

  it("ends with the player's new message", () => {
    expect(requestMessages(history(2), "next").at(-1)).toEqual({ role: "user", content: "next" });
  });

  it("stays under the server's cap in a long chat and starts with the player", () => {
    const messages = requestMessages(history(500), "next");
    expect(messages.length).toBeLessThanOrEqual(100);
    expect(messages[0].role).toBe("user");
  });

  it("shortens a very long old reply so the chat keeps working", () => {
    const long: ChatMessage[] = [
      { role: "user", content: "q" },
      { role: "assistant", content: "x".repeat(9000) },
    ];
    const messages = requestMessages(long, "next");
    expect(messages[1].content.length).toBeLessThanOrEqual(8000);
    expect(long[1].content).toHaveLength(9000);
  });
});

describe("applyAccusation", () => {
  it("uses one accusation on a wrong, non-final guess and keeps the game going", () => {
    const next = applyAccusation(newGame(2), "dani", { correct: false });
    expect(next.accusationsLeft).toBe(1);
    expect(next.accused).toEqual(["dani"]);
    expect(next.verdict).toBeNull();
    expect(isFinalAccusation(next)).toBe(true);
  });

  it("ends the game when the response has the explanation", () => {
    const response = { correct: true, culprit: "Maya Katz", explanation: "because" };
    const next = applyAccusation(newGame(2), "maya", response);
    expect(next.verdict).toEqual(response);
  });

  it("changes nothing if that suspect was already accused", () => {
    const once = applyAccusation(newGame(2), "dani", { correct: false });
    expect(applyAccusation(once, "dani", { correct: false })).toBe(once);
  });
});

describe("save and load", () => {
  it("round-trips a game", () => {
    const storage = fakeStorage();
    const game = applyExchange(newGame(2, "g"), "g", "assistant", "q", "a");
    saveGame(storage, game);
    expect(loadGame(storage)).toEqual(game);
  });

  it("starts fresh on corrupt JSON, the wrong shape or blocked storage", () => {
    const storage = fakeStorage();
    storage.setItem("shuk-heist-case", "{not json");
    expect(loadGame(storage)).toBeNull();
    storage.setItem("shuk-heist-case", JSON.stringify({ players: "many" }));
    expect(loadGame(storage)).toBeNull();
    expect(loadGame(blocked)).toBeNull();
  });

  it("keeps the chosen difficulty, and loads older saves as detective", () => {
    const storage = fakeStorage();
    saveGame(storage, newGame(2, "g", "inspector"));
    expect(loadGame(storage)?.difficulty).toBe("inspector");

    const older: Partial<ReturnType<typeof newGame>> = newGame(2, "old");
    delete older.difficulty;
    storage.setItem("shuk-heist-case", JSON.stringify(older));
    expect(loadGame(storage)?.difficulty).toBe("detective");
  });

  it("doesn't throw when storage is blocked", () => {
    expect(() => saveGame(blocked, newGame(1))).not.toThrow();
    expect(() => clearGame(blocked)).not.toThrow();
  });

  it("survives window.localStorage itself throwing", () => {
    // Tests run with no window, so every access in browserStorage throws, like blocked storage.
    expect(loadGame(browserStorage)).toBeNull();
    expect(() => saveGame(browserStorage, newGame(1))).not.toThrow();
    expect(() => clearGame(browserStorage)).not.toThrow();
  });
});
