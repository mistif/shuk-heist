"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ChatMessage } from "@/lib/game-state";

const INPUT_MAX = 2000;

export default function ChatPanel({
  title,
  placeholder,
  messages,
  active,
  onSend,
}: {
  title: string;
  placeholder: string;
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
    <section className="flex min-h-96 flex-1 flex-col rounded-lg border border-line bg-panel">
      <h2 className="border-b border-line p-3 font-semibold">{title}</h2>
      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        className="flex max-h-[28rem] flex-1 flex-col gap-2 overflow-y-auto p-3"
      >
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} text={m.content} />
        ))}
        {pending && (
          <>
            <Bubble role="user" text={pending} />
            <p className="text-sm text-muted">Waiting for a reply...</p>
          </>
        )}
      </div>
      {failed && (
        <p role="alert" className="px-3 text-sm text-danger">
          Lost contact, try again.
        </p>
      )}
      <form onSubmit={submit} className="flex gap-2 border-t border-line p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          maxLength={INPUT_MAX}
          className="min-w-0 flex-1 rounded border border-line bg-background px-3 py-2"
        />
        <button
          type="submit"
          disabled={!!pending || !draft.trim()}
          className="rounded bg-accent px-4 py-2 font-semibold text-accent-text disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </section>
  );
}

function Bubble({ role, text }: { role: ChatMessage["role"]; text: string }) {
  const mine = role === "user";
  return (
    <p
      className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 ${
        mine ? "self-end bg-accent text-accent-text" : "self-start border border-line"
      }`}
    >
      {text}
    </p>
  );
}
