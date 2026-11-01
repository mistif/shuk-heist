import type { Verdict } from "@/lib/game-state";

export default function VerdictScreen({
  verdict,
  onNewCase,
}: {
  verdict: Verdict;
  onNewCase: () => void;
}) {
  return (
    <main className="mx-auto flex max-w-xl flex-1 flex-col justify-center gap-5 p-6">
      <h1 className="text-4xl font-bold">
        {verdict.correct ? "Case solved" : "The thief got away"}
      </h1>
      <p className="font-semibold">The thief was {verdict.culprit}.</p>
      <p>{verdict.explanation}</p>
      <button
        onClick={onNewCase}
        className="self-start rounded-lg bg-accent px-5 py-3 font-semibold text-accent-text"
      >
        New case
      </button>
    </main>
  );
}
