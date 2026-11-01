const CRACKING_AT = 8;

export default function SuspectCard({
  name,
  role,
  nervousness,
  selected,
  accused,
  onSelect,
}: {
  name: string;
  role: string;
  nervousness: number;
  selected: boolean;
  accused: boolean;
  onSelect: () => void;
}) {
  const cracking = nervousness >= CRACKING_AT;
  return (
    <button
      onClick={onSelect}
      aria-pressed={selected}
      className={`person-card ${cracking ? "is-cracking" : ""}`}
    >
      <span className="flex items-center gap-2">
        <span className="monogram" aria-hidden="true">
          {name[0]}
        </span>
        <span className="min-w-0 font-semibold leading-tight">{name}</span>
      </span>
      <span className="mt-2 block text-xs leading-snug text-muted">{role}</span>
      {accused && <span className="stamp-small typewriter">Wrongly accused</span>}
      <span className="typewriter mt-2 block text-xs text-muted">Nervousness: {nervousness}/10</span>
      <span
        role="progressbar"
        aria-label={`${name} nervousness`}
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={nervousness}
        className={`meter mt-1 ${nervousness >= 7 ? "hot" : ""}`}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={i < nervousness ? "on" : ""} />
        ))}
      </span>
    </button>
  );
}
