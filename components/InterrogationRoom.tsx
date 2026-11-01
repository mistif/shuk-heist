import { suspectName, type SuspectId } from "@/lib/suspects";

const MOODS = ["calm", "uneasy", "nervous", "cracking"] as const;

function moodLevel(nervousness: number) {
  if (nervousness <= 2) return 0;
  if (nervousness <= 5) return 1;
  if (nervousness <= 7) return 2;
  return 3;
}

const LOOKS: Record<SuspectId, { skin: string; hair: string; top: string }> = {
  dani: { skin: "#c98f62", hair: "#1d1512", top: "#f1eadb" },
  noa: { skin: "#e0b08a", hair: "#3a2216", top: "#3f7d6a" },
  yossi: { skin: "#b98057", hair: "#55504c", top: "#26374f" },
  maya: { skin: "#e6b796", hair: "#7a3b1e", top: "#a33c5e" },
};

// One set per mood, from relaxed to cracking.
const BROWS = [
  ["M156 133Q170 126 184 132", "M216 132Q230 126 244 133"],
  ["M156 130Q170 125 184 133", "M216 133Q230 125 244 130"],
  ["M156 134Q170 122 184 126", "M216 126Q230 122 244 134"],
  ["M154 138Q168 120 184 120", "M216 120Q232 120 246 138"],
];
const MOUTHS = [
  "M176 196Q200 212 224 196",
  "M178 200Q200 204 222 200",
  "M176 202Q188 196 200 202T224 202",
  "M180 206Q200 186 220 206Q200 216 180 206Z",
];
const SWEAT = [
  [],
  [[252, 128]],
  [[252, 128], [148, 136], [262, 164]],
  [[252, 128], [148, 136], [262, 164], [138, 170], [200, 96], [270, 110]],
] as const;

function Hair({ id, color }: { id: SuspectId; color: string }) {
  if (id === "dani") {
    return (
      <>
        <path d="M138 138C132 86 170 72 200 74C238 74 268 92 262 138C252 112 232 104 200 104C170 104 150 112 138 138Z" fill={color} />
        <path d="M168 186Q200 172 232 186Q200 194 168 186Z" fill={color} />
      </>
    );
  }
  if (id === "yossi") {
    return (
      <>
        <path d="M136 122C136 82 170 66 200 66C232 66 264 82 264 122Z" fill="#1c2a3e" />
        <rect x="126" y="114" width="148" height="13" rx="6" fill="#111b2a" />
        <circle cx="200" cy="92" r="9" fill="#d9b35f" />
        <path d="M172 186Q200 174 228 186Q200 192 172 186Z" fill={color} />
      </>
    );
  }
  if (id === "noa") {
    return (
      <>
        <path d="M134 150C126 88 168 70 200 70C236 70 274 88 266 150C258 118 238 104 200 104C164 104 142 118 134 150Z" fill={color} />
        <path d="M262 136C282 170 276 220 262 250C256 230 252 180 250 150Z" fill={color} />
      </>
    );
  }
  return (
    <>
      <path d="M128 240C112 150 126 72 200 68C274 72 288 150 272 240C262 214 262 170 254 136C240 108 160 108 146 136C138 170 138 214 128 240Z" fill={color} />
      <path d="M146 92Q200 70 254 92L250 104Q200 86 150 104Z" fill="#141018" />
    </>
  );
}

export default function InterrogationRoom({
  id,
  nervousness,
}: {
  id: SuspectId;
  nervousness: number;
}) {
  const level = moodLevel(nervousness);
  const look = LOOKS[id];
  const name = suspectName(id);

  return (
    <div className={`room-stage nerve-${level}`}>
      <div className="room-door room-door-left" aria-hidden="true" />
      <div className="room-door room-door-right" aria-hidden="true" />
      <svg
        className="room-art"
        viewBox="0 -50 400 410"
        preserveAspectRatio="xMidYMax meet"
        role="img"
        aria-label={`${name} sits across the table, looking ${MOODS[level]}`}
      >
        <defs>
          <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffe6b0" stopOpacity="0.55" />
            <stop offset="1" stopColor="#ffe6b0" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="tabletop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6b6f76" />
            <stop offset="1" stopColor="#2a2c31" />
          </linearGradient>
        </defs>

        <g className="room-lamp">
          <polygon points="170,-14 230,-14 380,360 20,360" fill="url(#cone)" />
          <line x1="200" y1="-500" x2="200" y2="-40" stroke="#090a0e" strokeWidth="4" />
          <path d="M170 -14Q176 -40 200 -40Q224 -40 230 -14Z" fill="#17191f" />
          <ellipse cx="200" cy="-14" rx="14" ry="5" fill="#fff4d6" />
        </g>

        <g className="figure-enter">
          <g className="figure-breathe">
            <path
              d={`M92 330C92 268 132 246 168 240H232C268 246 308 268 308 330Z`}
              fill={look.top}
            />
            {id === "dani" && <path d="M160 242H240L252 330H148Z" fill="#c7bda9" />}
            {id === "noa" && <path d="M166 242H234L246 330H154Z" fill="#e6dcc8" />}
            {id === "yossi" && (
              <>
                <path d="M178 240L200 268L222 240Z" fill="#8fa2bc" />
                <circle cx="256" cy="282" r="9" fill="#d9b35f" />
              </>
            )}
            {id === "maya" && <path d="M170 240Q200 280 230 240L222 300H178Z" fill="#f0d9c4" />}
            <rect x="178" y="214" width="44" height="36" fill={look.skin} />

            <g className="figure-head">
              <ellipse cx="200" cy="150" rx="64" ry="76" fill={look.skin} />
              <ellipse className="figure-flush" cx="200" cy="168" rx="58" ry="50" fill="#e0301e" />
              <Hair id={id} color={look.hair} />

              <g className="figure-eyes">
                <ellipse cx="170" cy="150" rx="15" ry={level >= 2 ? 13 : 10} fill="#fff" />
                <ellipse cx="230" cy="150" rx="15" ry={level >= 2 ? 13 : 10} fill="#fff" />
                <g className="figure-pupils">
                  <circle cx="170" cy="151" r={level === 3 ? 4 : 6} fill="#1a1411" />
                  <circle cx="230" cy="151" r={level === 3 ? 4 : 6} fill="#1a1411" />
                </g>
                <g className="figure-lids" fill={look.skin}>
                  <ellipse cx="170" cy="150" rx="16" ry="14" />
                  <ellipse cx="230" cy="150" rx="16" ry="14" />
                </g>
              </g>
              {BROWS[level].map((d) => (
                <path key={d} d={d} fill="none" stroke={id === "maya" ? "#4d2513" : "#1d1512"} strokeWidth="5" strokeLinecap="round" />
              ))}
              <path d="M200 156Q192 176 198 180Q204 182 208 178" fill="none" stroke="#00000055" strokeWidth="3" strokeLinecap="round" />
              <path
                d={MOUTHS[level]}
                fill={level === 3 ? "#3a1512" : "none"}
                stroke={id === "maya" || id === "noa" ? "#a53f4c" : "#4a2418"}
                strokeWidth="5"
                strokeLinecap="round"
              />
              {SWEAT[level].map(([x, y], i) => (
                <path
                  key={i}
                  className="figure-sweat"
                  style={{ animationDelay: `${-i * 0.55}s` }}
                  d={`M${x} ${y}q7 11 0 16q-7 -5 0 -16Z`}
                  fill="#a9dcff"
                />
              ))}
            </g>
          </g>

          <rect x="30" y="306" width="340" height="54" rx="4" fill="url(#tabletop)" />
          <rect x="30" y="306" width="340" height="4" fill="#9a9ea6" />
          <g className="figure-hands" fill={look.skin}>
            <ellipse cx="150" cy="310" rx="30" ry="13" />
            <ellipse cx="250" cy="310" rx="30" ry="13" />
          </g>
          <rect x="280" y="322" width="74" height="26" rx="2" fill="#c9a968" transform="rotate(-5 317 335)" />
        </g>
      </svg>
      <p className="room-caption typewriter">
        {name} looks {MOODS[level]}
      </p>
    </div>
  );
}
