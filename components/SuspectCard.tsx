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
  return (
    <button
      onClick={onSelect}
      aria-pressed={selected}
      className={`rounded-lg border p-3 text-left ${
        selected ? "border-accent bg-panel" : "border-line"
      }`}
    >
      <span className="block font-semibold">{name}</span>
      <span className="block text-sm text-muted">{role}</span>
      {accused && <span className="block text-sm text-danger">Wrongly accused</span>}
      <span className="mt-2 block text-xs text-muted">Nervousness: {nervousness}/10</span>
      <span
        role="progressbar"
        aria-label={`${name} nervousness`}
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={nervousness}
        className="mt-1 block h-2 overflow-hidden rounded bg-line"
      >
        <span className="block h-full bg-danger" style={{ width: `${nervousness * 10}%` }} />
      </span>
    </button>
  );
}
