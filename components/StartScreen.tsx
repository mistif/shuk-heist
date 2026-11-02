"use client";

import { useState } from "react";
import { DEFAULT_DIFFICULTY, DIFFICULTIES, type DifficultyId } from "@/lib/difficulty";

export default function StartScreen({
  onStart,
}: {
  onStart: (players: number, difficulty: DifficultyId) => void;
}) {
  const [difficulty, setDifficulty] = useState<DifficultyId>(DEFAULT_DIFFICULTY);

  return (
    <main className="stage flex flex-1 items-center px-4 py-8 md:px-[6vw]">
      <div className="w-full max-w-2xl">
        <p className="kicker rise-in">Machane Yehuda Market, Jerusalem. Thursday, 06:00</p>
        <h1 className="neon-title rise-in mt-3 text-[clamp(3rem,10vw,6.25rem)]">
          The Shuk Recipe Heist
        </h1>
        <div className="glass rise-in mt-7" style={{ animationDelay: "0.2s" }}>
          <div className="tile-strip" />
          <div className="flex flex-col gap-4 p-5">
            <p className="leading-relaxed">
              Rina Shalev opens her hummus stall and finds that her grandmother&apos;s secret
              recipe, a small blue notebook, is gone. Tomorrow is the Jerusalem Hummus Championship.
            </p>
            <p className="font-semibold text-accent">
              Four suspects, and any of them could be the thief. Each new case picks one at random,
              with its own evidence.
            </p>

            <fieldset>
              <legend className="mb-2 font-semibold">How well do they lie?</legend>
              <div className="grid gap-2 md:grid-cols-3">
                {DIFFICULTIES.map((d) => (
                  <label key={d.id} className="level-choice">
                    <input
                      type="radio"
                      name="difficulty"
                      checked={difficulty === d.id}
                      onChange={() => setDifficulty(d.id)}
                    />
                    <span>
                      <span className="sign-text block">{d.name}</span>
                      <span className="block text-sm text-muted">{d.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <h2 className="mb-3 font-semibold">How many detectives?</h2>
              <div className="flex flex-wrap gap-3">
                {[1, 2, 3, 4].map((n, i) => (
                  <button
                    key={n}
                    onClick={() => onStart(n, difficulty)}
                    aria-label={n === 1 ? "Start with 1 detective" : `Start with ${n} detectives`}
                    className="stall-number rise-in"
                    style={{ animationDelay: `${0.4 + i * 0.09}s` }}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-sm text-muted">
                One detective gets one accusation. A team shares this screen and gets two.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
