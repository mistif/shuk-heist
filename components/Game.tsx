"use client";

import { useEffect, useRef, useState } from "react";
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
  type AccuseResponse,
  type ChatId,
  type GameState,
} from "@/lib/game-state";
import { SUSPECT_IDS, SUSPECTS, suspectName, type SuspectId } from "@/lib/suspects";
import AccusePanel from "./AccusePanel";
import ChatPanel from "./ChatPanel";
import StartScreen from "./StartScreen";
import SuspectCard from "./SuspectCard";
import VerdictScreen from "./VerdictScreen";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

const CHATS: ChatId[] = ["assistant", ...SUSPECT_IDS];

function chatTitle(chat: ChatId) {
  return chat === "assistant" ? "Case Assistant" : `Interrogating ${suspectName(chat)}`;
}

export default function Game() {
  const [game, setGame] = useState<GameState | null>(() => loadGame(browserStorage));
  const [openChat, setOpenChat] = useState<ChatId>("assistant");
  const gameRef = useRef(game);

  useEffect(() => {
    gameRef.current = game;
    if (game) saveGame(browserStorage, game);
  }, [game]);

  if (!game) {
    return <StartScreen onStart={(players) => setGame(newGame(players))} />;
  }

  function resetGame() {
    clearGame(browserStorage);
    setOpenChat("assistant");
    setGame(null);
  }

  if (game.verdict) {
    return <VerdictScreen verdict={game.verdict} onNewCase={resetGame} />;
  }

  async function send(chat: ChatId, text: string) {
    const current = gameRef.current!;
    const messages = requestMessages(current.chats[chat], text);
    const url = chat === "assistant" ? "/api/assistant" : `/api/suspect/${chat}`;
    const { reply, nervousness } = await postJson<{ reply: string; nervousness?: number }>(url, {
      messages,
    });
    setGame((g) => g && applyExchange(g, current.id, chat, text, reply, nervousness));
  }

  async function accuse(suspect: SuspectId) {
    const current = gameRef.current!;
    const response = await postJson<AccuseResponse>("/api/accuse", {
      suspect,
      final: isFinalAccusation(current),
    });
    setGame((g) => g && g.id === current.id ? applyAccusation(g, suspect, response) : g);
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">The Shuk Recipe Heist</h1>
        <p className="text-sm text-muted">
          {game.players === 1 ? "You vs. the thief" : "Team vs. the thief"}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-[1fr_20rem]">
        <div className="flex min-w-0">
          {/* All panels stay mounted so switching chats keeps each draft and pending reply. */}
          {CHATS.map((chat) => (
            <div key={chat} className={chat === openChat ? "flex min-w-0 flex-1" : "hidden"}>
              <ChatPanel
                title={chatTitle(chat)}
                placeholder={chat === "assistant" ? "Ask about the case files" : "Question this suspect"}
                messages={game.chats[chat]}
                active={chat === openChat}
                onSend={(text) => send(chat, text)}
              />
            </div>
          ))}
        </div>
        <aside className="flex flex-col gap-3">
          <button
            onClick={() => setOpenChat("assistant")}
            aria-pressed={openChat === "assistant"}
            className={`rounded-lg border p-3 text-left font-semibold ${
              openChat === "assistant" ? "border-accent bg-panel" : "border-line"
            }`}
          >
            Case Assistant
          </button>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
            {SUSPECTS.map((s) => (
              <SuspectCard
                key={s.id}
                name={s.name}
                role={s.role}
                nervousness={game.nervousness[s.id]}
                selected={openChat === s.id}
                accused={game.accused.includes(s.id)}
                onSelect={() => setOpenChat(s.id)}
              />
            ))}
          </div>
          <AccusePanel
            accused={game.accused}
            accusationsLeft={game.accusationsLeft}
            lastWrong={game.accused.length > 0}
            onAccuse={accuse}
          />
        </aside>
      </div>
    </main>
  );
}
