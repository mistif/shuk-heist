"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ChatMessage } from "@/lib/game-state";

const INPUT_MAX = 2000;

export default function ChatPanel({
  title,
  speaker,
  placeholder,
  emptyHint,
  messages,
  active,
  onSend,
}: {
  title: string;
  speaker: string;
  placeholder: string;
  emptyHint: string;
  messages: ChatMessage[];
  active: boolean;
  onSend: (text: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, pending, active]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || pending) return;
    setPending(text);
    setFailed(false);
    setDraft("");
    try {
      await onSend(text);
    } catch {
      // The message goes back in the box so the player can resend it.
      setDraft(text);
      setFailed(true);
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="glass rise-in chat-frame flex w-full flex-col">
      <div className="tile-strip" />
      <h2 className="chat-bar sign-text border-b border-line px-4 py-3 text-lg leading-tight md:text-xl">
        {title}
      </h2>
      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4"
      >
        {messages.length === 0 && !pending && (
          <p className="chat-note typewriter m-auto self-center text-center text-muted">{emptyHint}</p>
        )}
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} text={m.content} speaker={speaker} />
        ))}
        {pending && (
          <>
            <Bubble role="user" text={pending} speaker={speaker} />
            <p className="chat-note typewriter flex items-center text-sm text-muted">
              {speaker} is answering
              <span className="dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </p>
          </>
        )}
      </div>
      {failed && (
        <p role="alert" className="chat-bar px-4 py-1 text-sm text-danger">
          Lost contact, try again.
        </p>
      )}
      <form onSubmit={submit} className="chat-bar flex gap-2 rounded-b-[13px] border-t border-line p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          maxLength={INPUT_MAX}
          className="chat-input min-w-0 flex-1 px-3 py-2"
        />
        <button type="submit" disabled={!!pending || !draft.trim()} className="gel-button px-5 py-2">
          Send
        </button>
      </form>
    </section>
  );
}

function Bubble({
  role,
  text,
  speaker,
}: {
  role: ChatMessage["role"];
  text: string;
  speaker: string;
}) {
  const mine = role === "user";
  return (
    <div className={`bubble ${mine ? "bubble-me" : "bubble-them"}`}>
      <span className="bubble-label typewriter">{mine ? "Detective" : speaker}</span>
      {/* Document citations like [C2] become evidence tags. */}
      {text.split(/(\[[BCSX]\d\])/).map((part, i) =>
        /^\[[BCSX]\d\]$/.test(part) ? (
          <span key={i} className="cite">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </div>
  );
}
