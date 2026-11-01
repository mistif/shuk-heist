import type { GameState } from "@/lib/game-state";
import { SUSPECTS } from "@/lib/suspects";

export default function CaseProgress({ game }: { game: GameState }) {
  const stops = [
    { label: "Files", done: game.chats.assistant.length > 0 },
    ...SUSPECTS.map((s) => ({ label: s.name.split(" ")[0], done: game.chats[s.id].length > 0 })),
    { label: "Accuse", done: game.accused.length > 0 },
  ];
  const doneCount = stops.filter((s) => s.done).length;

  return (
    <ol className="case-trail" aria-label={`Case progress: ${doneCount} of ${stops.length} steps done`}>
      {stops.map((stop) => (
        <li key={stop.label} className={stop.done ? "done" : ""}>
          <span className="case-pin" aria-hidden="true" />
          <span className="typewriter">{stop.label}</span>
        </li>
      ))}
    </ol>
  );
}
