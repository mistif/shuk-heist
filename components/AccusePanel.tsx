"use client";

import { useState } from "react";
import { SUSPECTS, type SuspectId } from "@/lib/suspects";

export default function AccusePanel({
  accused,
  accusationsLeft,
  lastWrong,
  onAccuse,
}: {
  accused: SuspectId[];
  accusationsLeft: number;
  lastWrong: boolean;
  onAccuse: (suspect: SuspectId) => Promise<void>;
}) {
  const [choice, setChoice] = useState<SuspectId | null>(null);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function confirm() {
    if (!choice || pending) return;
    setPending(true);
    setFailed(false);
    try {
      await onAccuse(choice);
      setChoice(null);
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="glass p-4">
      <h2 className="sign-text text-lg">Make an accusation</h2>
      <p className="typewriter text-sm text-muted">Accusations left: {accusationsLeft}</p>
      {lastWrong && (
        <p role="status" className="shake-in mt-1 text-sm font-semibold text-danger">
          Not them. One accusation left.
        </p>
      )}
      <fieldset className="mt-2 flex flex-col gap-1">
        <legend className="sr-only">Who took the notebook?</legend>
        {SUSPECTS.map((s) => (
          <label
            key={s.id}
            className={`suspect-choice ${accused.includes(s.id) ? "text-muted line-through" : ""}`}
          >
            <input
              type="radio"
              name="accused"
              disabled={accused.includes(s.id)}
              checked={choice === s.id}
              onChange={() => setChoice(s.id)}
            />
            {s.name}
          </label>
        ))}
      </fieldset>
      {failed && (
        <p role="alert" className="mt-2 text-sm text-danger">
          Lost contact, and your accusation wasn&apos;t used. Try again.
        </p>
      )}
      <button
        onClick={confirm}
        disabled={!choice || pending}
        className="gel-button danger-button mt-3 w-full px-4 py-2 text-lg"
      >
        {pending ? "Checking..." : "Accuse"}
      </button>
    </section>
  );
}
