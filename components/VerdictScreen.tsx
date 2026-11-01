import type { Verdict } from "@/lib/game-state";

export default function VerdictScreen({
  verdict,
  onNewCase,
}: {
  verdict: Verdict;
  onNewCase: () => void;
}) {
  return (
    <>
      <div className="verdict-backdrop" aria-hidden="true">
        <div className={verdict.correct ? "verdict-rays" : "verdict-siren"} />
      </div>
      <main className="stage mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-7 px-4 py-8">
        <h1
          className={`verdict-stamp self-center text-center text-[clamp(2.2rem,8vw,4.5rem)] ${
            verdict.correct ? "verdict-won" : "verdict-lost"
          }`}
        >
          {verdict.correct ? "Case solved" : "The thief got away"}
        </h1>
        <div className="glass rise-in" style={{ animationDelay: "0.45s" }}>
          <div className="tile-strip" />
          <div className="flex flex-col gap-4 p-5">
            <p className="text-xl font-semibold">The thief was {verdict.culprit}.</p>
            <p className="typewriter text-lg leading-relaxed">{verdict.explanation}</p>
            <button onClick={onNewCase} className="gel-button self-start px-6 py-3">
              New case
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
