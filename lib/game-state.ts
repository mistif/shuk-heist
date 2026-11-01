import * as z from "zod";
import { DEFAULT_DIFFICULTY, DIFFICULTY_IDS, type DifficultyId } from "./difficulty";
import { SUSPECT_IDS, type SuspectId } from "./suspects";

const STORAGE_KEY = "shuk-heist-game";
// Below the server's cap of 100, so a long interrogation keeps working.
const HISTORY_SENT = 80;
// Matches the server's limit on an assistant message.
const REPLY_SENT_MAX = 8000;

const Suspect = z.enum(SUSPECT_IDS);

const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const Chat = z.array(ChatMessageSchema);
const Meter = z.number().int().min(0).max(10);

const VerdictSchema = z.object({
  correct: z.boolean(),
  culprit: z.string(),
  explanation: z.string(),
});

const GameStateSchema = z.object({
  id: z.string(),
  players: z.number().int().min(1).max(4),
  // The default keeps games saved before difficulty existed loading.
  difficulty: z.enum(DIFFICULTY_IDS).default(DEFAULT_DIFFICULTY),
  accusationsLeft: z.number().int().min(0).max(2),
  accused: z.array(Suspect),
  chats: z.object({ assistant: Chat, dani: Chat, noa: Chat, yossi: Chat, maya: Chat }),
  nervousness: z.object({ dani: Meter, noa: Meter, yossi: Meter, maya: Meter }),
  verdict: VerdictSchema.nullable(),
});

export type ChatId = "assistant" | SuspectId;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type Verdict = z.infer<typeof VerdictSchema>;
export type GameState = z.infer<typeof GameStateSchema>;
export type AccuseResponse = { correct: false } | Verdict;
type GameStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

// Reading window.localStorage can itself throw when storage is blocked, so it
// happens inside each call, where the try blocks below catch it.
export const browserStorage: GameStorage = {
  getItem: (key) => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
  removeItem: (key) => window.localStorage.removeItem(key),
};

export function newGame(
  players: number,
  id: string = crypto.randomUUID(),
  difficulty: DifficultyId = DEFAULT_DIFFICULTY,
): GameState {
  return {
    id,
    players,
    difficulty,
    accusationsLeft: players === 1 ? 1 : 2,
    accused: [],
    chats: { assistant: [], dani: [], noa: [], yossi: [], maya: [] },
    nervousness: { dani: 0, noa: 0, yossi: 0, maya: 0 },
    verdict: null,
  };
}

export function isFinalAccusation(state: GameState): boolean {
  return state.accusationsLeft === 1;
}

// Applied only when the reply arrives, so a failed send leaves the chat unchanged.
export function applyExchange(
  state: GameState,
  gameId: string,
  chat: ChatId,
  userText: string,
  reply: string,
  nervousness?: number,
): GameState {
  if (state.id !== gameId) return state;
  const next: GameState = {
    ...state,
    chats: {
      ...state.chats,
      [chat]: [
        ...state.chats[chat],
        { role: "user", content: userText },
        { role: "assistant", content: reply },
      ],
    },
  };
  if (chat !== "assistant" && nervousness !== undefined) {
    next.nervousness = { ...state.nervousness, [chat]: nervousness };
  }
  return next;
}

export function requestMessages(history: ChatMessage[], userText: string): ChatMessage[] {
  const recent = history.slice(-HISTORY_SENT);
  const start = recent.findIndex((m) => m.role === "user");
  const sent = recent
    .slice(Math.max(start, 0))
    .map((m) => ({ ...m, content: m.content.slice(0, REPLY_SENT_MAX) }));
  return [...sent, { role: "user", content: userText }];
}

export function applyAccusation(
  state: GameState,
  suspect: SuspectId,
  response: AccuseResponse,
): GameState {
  if (state.accused.includes(suspect) || state.accusationsLeft === 0) return state;
  return {
    ...state,
    accusationsLeft: state.accusationsLeft - 1,
    accused: [...state.accused, suspect],
    verdict: "explanation" in response ? response : null,
  };
}

export function loadGame(storage: GameStorage): GameState | null {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = GameStateSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function saveGame(storage: GameStorage, state: GameState): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The game still works this session without a save.
  }
}

export function clearGame(storage: GameStorage): void {
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing was saved if storage is blocked.
  }
}
