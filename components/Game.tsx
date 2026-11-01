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
import Briefing from "./Briefing";
import CaseProgress from "./CaseProgress";
import ChatPanel from "./ChatPanel";
import InterrogationRoom from "./InterrogationRoom";
import StartScreen from "./StartScreen";
import SuspectCard from "./SuspectCard";
import VerdictScreen from "./VerdictScreen";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status === 429) throw new Error("Too many questions. Take a breath and try again soon.");
  if (!res.ok) throw new Error("Lost contact, try again.");
  return res.json();
}

const CHATS: ChatId[] = ["assistant", ...SUSPECT_IDS];

function chatTitle(chat: ChatId) {
  return chat === "assistant" ? "Case Assistant" : `Interrogating ${suspectName(chat)}`;
}

export default function Game() {
  const [game, setGame] = useState<GameState | null>(() => loadGame(browserStorage));
  const [openChat, setOpenChat] = useState<ChatId>("assistant");
  const [showBriefing, setShowBriefing] = useState(false);
  const gameRef = useRef(game);

  useEffect(() => {
    gameRef.current = game;
    if (game) saveGame(browserStorage, game);
  }, [game]);

  if (!game) {
    return (
      <StartScreen
        onStart={(players) => {
          setGame(newGame(players));
          setShowBriefing(true);
        }}
      />
    );
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
    <main className="stage mx-auto flex w-full max-w-[86rem] flex-1 flex-col gap-3 px-4 py-4">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="neon-title text-[clamp(1.5rem,4vw,2.25rem)]">The Shuk Recipe Heist</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <p className="typewriter text-muted">
            {game.players === 1 ? "You vs. the thief" : "Team vs. the thief"}
          </p>
          <button onClick={() => setShowBriefing(true)} className="briefing-link typewriter">
            How to play
          </button>
        </div>
      </header>

      <CaseProgress game={game} />

      {openChat !== "assistant" && <div key={openChat} className="room-bg" aria-hidden="true" />}

      {showBriefing && (
        <Briefing
          accusations={game.players === 1 ? 1 : 2}
          onClose={() => setShowBriefing(false)}
        />
      )}

      <div className="board">
        <div className={`board-chat ${openChat !== "assistant" ? "with-room" : ""}`}>
          {openChat !== "assistant" && (
            <InterrogationRoom key={openChat} id={openChat} nervousness={game.nervousness[openChat]} />
          )}
          {/* All panels stay mounted so switching chats keeps each draft and pending reply. */}
          {CHATS.map((chat) => (
            <div key={chat} className={chat === openChat ? "chat-column flex min-w-0" : "hidden"}>
              <ChatPanel
                title={chatTitle(chat)}
                speaker={chat === "assistant" ? "Case Assistant" : suspectName(chat)}
                placeholder={chat === "assistant" ? "Ask about the case files" : "Question this suspect"}
                emptyHint={
                  chat === "assistant"
                    ? "The case files are open. Ask what the police found."
                    : `${suspectName(chat)} is waiting. Ask your first question.`
                }
                messages={game.chats[chat]}
                active={chat === openChat}
                onSend={(text) => send(chat, text)}
              />
            </div>
          ))}
        </div>
        <nav aria-label="Who to talk to" className="board-people people-list">
          <button
            onClick={() => setOpenChat("assistant")}
            aria-pressed={openChat === "assistant"}
            className="person-card"
          >
            <span className="flex items-center gap-2">
              <span className="monogram" aria-hidden="true">
                ?
              </span>
              <span className="font-semibold leading-tight">Case Assistant</span>
            </span>
          </button>
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
        </nav>
        <div className="board-accuse">
          <AccusePanel
            accused={game.accused}
            accusationsLeft={game.accusationsLeft}
            lastWrong={game.accused.length > 0}
            onAccuse={accuse}
          />
        </div>
      </div>
    </main>
  );
}
