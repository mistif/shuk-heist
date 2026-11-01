"use client";

import { useEffect, useRef } from "react";

// One-point perspective: the walls converge on the far end of the alley.
const wallTop = (x: number) => 120 + (275 * x) / 700;
const wallBottom = (x: number) => 900 - (400 * x) / 700;

function shutterLines(x0: number, x1: number, count: number) {
  return Array.from({ length: count }, (_, i) => {
    const t = (i + 1) / (count + 1);
    const y = (x: number) => (wallTop(x) + (wallBottom(x) - wallTop(x)) * t).toFixed(1);
    return `M${x0} ${y(x0)}L${x1} ${y(x1)}`;
  }).join("");
}

function stallFront(x0: number, x1: number) {
  return `${x0},${wallTop(x0).toFixed(1)} ${x1},${wallTop(x1).toFixed(1)} ${x1},${wallBottom(x1).toFixed(1)} ${x0},${wallBottom(x0).toFixed(1)}`;
}

const STALLS = [
  [0, 290],
  [305, 515],
  [528, 700],
] as const;

const ROOF_ARCHES = [1, 0.68, 0.46, 0.3];

type Point = readonly [number, number];

function pointOnQuad(from: Point, control: Point, to: Point, t: number): Point {
  const u = 1 - t;
  const at = (i: 0 | 1) => u * u * from[i] + 2 * u * t * control[i] + t * t * to[i];
  return [at(0), at(1)];
}

const STRINGS = [
  { from: [0, 150], control: [800, 400], to: [1600, 120], bulbs: 13 },
  { from: [250, 290], control: [800, 430], to: [1350, 280], bulbs: 9 },
] as const;

const STARS = [
  [980, 40], [1040, 90], [1110, 30], [1260, 60], [1330, 25], [1450, 80], [1520, 35],
  [600, 50], [520, 25], [430, 70], [330, 30], [210, 55], [120, 25], [730, 90],
];

const MOTES = Array.from({ length: 22 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  bottom: `${(i * 23 + 5) % 70}%`,
  delay: `${-((i * 1.7) % 14)}s`,
  duration: `${12 + (i * 3) % 11}s`,
  size: 2 + (i % 3),
}));

export default function ShukScene() {
  const lightRef = useRef<HTMLDivElement>(null);

  // The player's pointer is a phone light moving through the dark market. On touch
  // screens it drifts by itself, like the light Noa saw from the gate.
  useEffect(() => {
    const light = lightRef.current;
    if (!light) return;
    const place = (x: number, y: number) => {
      light.style.setProperty("--light-x", `${x}px`);
      light.style.setProperty("--light-y", `${y}px`);
    };
    place(window.innerWidth * 0.72, window.innerHeight * 0.62);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    if (window.matchMedia("(hover: hover)").matches) {
      const move = (e: PointerEvent) => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => place(e.clientX, e.clientY));
      };
      window.addEventListener("pointermove", move, { passive: true });
      return () => {
        cancelAnimationFrame(frame);
        window.removeEventListener("pointermove", move);
      };
    }

    const drift = (time: number) => {
      const t = time / 2600;
      place(
        window.innerWidth * (0.5 + 0.34 * Math.sin(t)),
        window.innerHeight * (0.55 + 0.26 * Math.sin(t * 1.7)),
      );
      frame = requestAnimationFrame(drift);
    };
    frame = requestAnimationFrame(drift);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="scene" aria-hidden="true">
      <svg className="scene-art" viewBox="0 0 1600 900" preserveAspectRatio="xMaxYMax slice">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#060a1c" />
            <stop offset="0.35" stopColor="#141338" />
            <stop offset="0.55" stopColor="#3a1f4a" />
          </linearGradient>
          <linearGradient id="stone" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#2c2622" />
            <stop offset="1" stopColor="#4d3f33" />
          </linearGradient>
          <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5a4632" />
            <stop offset="1" stopColor="#14110f" />
          </linearGradient>
          <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#d9dee3" />
            <stop offset="0.5" stopColor="#7c858e" />
            <stop offset="1" stopColor="#2b3036" />
          </linearGradient>
          <linearGradient id="signboard" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#6d1f16" />
            <stop offset="1" stopColor="#3c100b" />
          </linearGradient>
          <radialGradient id="bulb">
            <stop offset="0" stopColor="#ffdf9e" stopOpacity="0.95" />
            <stop offset="0.25" stopColor="#ffb454" stopOpacity="0.45" />
            <stop offset="1" stopColor="#ffb454" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="pool">
            <stop offset="0" stopColor="#ffbf6b" stopOpacity="0.6" />
            <stop offset="1" stopColor="#ffbf6b" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="moonGlow">
            <stop offset="0" stopColor="#dfe6ff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#dfe6ff" stopOpacity="0" />
          </radialGradient>
          {/* Rina's blue-and-white Armenian tiles, tilted to sit on the stall's wall. */}
          <pattern id="tiles" width="74" height="74" patternUnits="userSpaceOnUse" patternTransform="matrix(1 -0.12 0 1 0 0)">
            <rect width="74" height="74" fill="#eef3f8" />
            <path d="M37 6 47 27 68 37 47 47 37 68 27 47 6 37 27 27Z" fill="#1f5fa8" />
            <circle cx="37" cy="37" r="8" fill="#eef3f8" />
            <circle cx="37" cy="37" r="4" fill="#123f7a" />
            <path d="M0 0H16L0 16ZM74 0H58L74 16ZM0 74H16L0 58ZM74 74H58L74 58Z" fill="#123f7a" />
            <rect width="74" height="74" fill="none" stroke="#9fb4c9" strokeWidth="1.5" />
          </pattern>
        </defs>

        <rect width="1600" height="900" fill="url(#sky)" />
        {STARS.map(([x, y], i) => (
          <circle key={i} className="twinkle" style={{ animationDelay: `${-i * 0.7}s` }} cx={x} cy={y} r={i % 3 === 0 ? 2.2 : 1.4} fill="#f4f1ff" />
        ))}
        <circle cx="1130" cy="120" r="150" fill="url(#moonGlow)" />
        <circle cx="1130" cy="120" r="42" fill="#eef0ff" />
        <circle cx="1146" cy="110" r="38" fill="#1a1740" opacity="0.92" />

        {/* Jerusalem rooftops beyond the end of the alley. */}
        <path d="M480 430V330H540V300H600V345H660V285H720V320H790L800 270 810 320H880V290H950V335H1020V305H1090V430Z" fill="#17142a" />
        {[[560, 325], [630, 365], [700, 310], [860, 345], [930, 315], [1040, 345]].map(([x, y], i) => (
          <rect key={i} className="window" style={{ animationDelay: `${-i * 2.3}s` }} x={x} y={y} width="10" height="16" fill="#e9b566" />
        ))}

        {ROOF_ARCHES.map((s) => (
          <path
            key={s}
            d={`M${800 - 840 * s} ${430 - 40 * s}Q800 ${430 - 560 * s} ${800 + 840 * s} ${430 - 40 * s}`}
            fill="none"
            stroke="#0b0d14"
            strokeWidth={26 * s}
          />
        ))}

        <polygon points="0,900 700,500 900,500 1600,900" fill="url(#floor)" />
        {[-620, -380, -180, -60, 60, 180, 380, 620].map((x) => (
          <line key={x} x1={800 + x * 0.12} y1="500" x2={800 + x * 1.5} y2="900" stroke="#0e0c0a" strokeOpacity="0.55" strokeWidth="2" />
        ))}
        {[530, 575, 640, 730, 850].map((y) => (
          <line key={y} x1="0" y1={y} x2="1600" y2={y} stroke="#0e0c0a" strokeOpacity="0.35" strokeWidth="2" />
        ))}
        <ellipse cx="620" cy="690" rx="300" ry="90" fill="url(#pool)" opacity="0.55" />
        <ellipse cx="1120" cy="760" rx="380" ry="120" fill="url(#pool)" opacity="0.8" />

        {/* The side gate on Agrippas Street, its latch broken and the gate hanging open. */}
        <rect x="700" y="395" width="200" height="105" fill="#0a0912" />
        <g stroke="#2d3340" strokeWidth="4">
          {[712, 730, 748, 766, 784].map((x) => (
            <line key={x} x1={x} y1="405" x2={x} y2="500" />
          ))}
          <line x1="705" y1="415" x2="792" y2="415" />
          <line x1="705" y1="480" x2="792" y2="480" />
          <line x1="816" y1="402" x2="862" y2="418" />
          <line x1="816" y1="498" x2="862" y2="488" />
          <line x1="822" y1="404" x2="822" y2="497" />
          <line x1="842" y1="411" x2="842" y2="492" />
          <line x1="860" y1="418" x2="860" y2="488" />
        </g>
        <text className="neon-sign" x="800" y="385" textAnchor="middle" fontSize="30" fill="#ffe2b0">
          מחנה יהודה
        </text>

        {/* Left wall, then the same stalls mirrored for the right wall. */}
        {[false, true].map((mirrored) => (
          <g key={String(mirrored)} transform={mirrored ? "translate(1600 0) scale(-1 1)" : undefined}>
            <polygon points="0,0 700,395 700,500 0,900" fill="#0f0d0c" />
            {STALLS.map(([x0, x1]) => (
              <g key={x0}>
                <polygon points={stallFront(x0, x1)} fill="url(#stone)" />
                <path d={shutterLines(x0, x1, 12)} stroke="#17130f" strokeOpacity="0.7" strokeWidth="3" fill="none" />
                {/* Canvas tarp tied over the stall at night. */}
                <polygon
                  points={`${x0},${wallTop(x0).toFixed(1)} ${x1},${wallTop(x1).toFixed(1)} ${x1},${(wallTop(x1) + 0.2 * (wallBottom(x1) - wallTop(x1))).toFixed(1)} ${x0},${(wallTop(x0) + 0.2 * (wallBottom(x0) - wallTop(x0))).toFixed(1)}`}
                  fill="#7d6a4c"
                  opacity="0.85"
                />
              </g>
            ))}
          </g>
        ))}

        <g transform="translate(28 196) skewY(21.4)">
          <text className="sign-text" fontSize="30" fill="#ffd9a0">HUMMUS HAMELECH</text>
        </g>

        {/* Stall 14: the tile wall, the sign, the steel counter and the evidence. */}
        <polygon points="1180,335 1600,225 1600,705 1180,545" fill="url(#tiles)" />
        <polygon points="1180,335 1600,225 1600,705 1180,545" fill="#ffb454" opacity="0.12" />
        <polygon points="1180,285 1600,120 1600,225 1180,335" fill="url(#signboard)" />
        <g transform="translate(1208 330) skewY(-21.4)">
          <text className="sign-text sign-glow" fontSize="33" fill="#ffe7bd">HUMMUS SHALEV 14</text>
        </g>
        <polygon points="1180,545 1600,705 1600,900 1180,660" fill="url(#steel)" />
        <polygon points="1180,545 1600,705 1600,728 1180,560" fill="#f5f7f9" opacity="0.75" />
        <circle cx="1400" cy="430" r="280" fill="url(#pool)" />
        <line x1="1400" y1="175" x2="1400" y2="300" stroke="#0b0d14" strokeWidth="4" />
        <circle className="bulb-glow" cx="1400" cy="312" r="70" fill="url(#bulb)" />
        <circle cx="1400" cy="312" r="11" fill="#fff4d6" />

        <g transform="translate(1330 606)">
          <path className="steam" d="M-8 -28C-18 -48 4 -58 -6 -80" stroke="#f4f1ea" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path className="steam steam-late" d="M9 -28C0 -50 20 -60 10 -86" stroke="#f4f1ea" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M-22 -24H22L16 8C15 13 -15 13 -16 8Z" fill="#f7f4ee" />
          <path d="M22 -18C36 -18 36 0 18 0" fill="none" stroke="#f7f4ee" strokeWidth="5" />
          <ellipse cx="0" cy="-24" rx="22" ry="6" fill="#3a2115" />
          <path d="M-22 -22C-19 -18 -13 -17 -9 -18" stroke="#ec5f9a" strokeWidth="4" strokeLinecap="round" fill="none" />
          <ellipse cx="0" cy="12" rx="30" ry="7" fill="#d8d3c8" />
        </g>

        <g transform="translate(1168 806)">
          <ellipse cx="0" cy="6" rx="24" ry="7" fill="#000" opacity="0.5" />
          <ellipse cx="0" cy="0" rx="20" ry="9" fill="#101114" stroke="#454952" strokeWidth="2" />
          <circle className="glint" cx="-7" cy="-3" r="2.6" fill="#fff" />
        </g>

        {STRINGS.map((line, l) => (
          <g key={l} className={l === 0 ? "sway" : "sway sway-late"}>
            <path
              d={`M${line.from[0]} ${line.from[1]}Q${line.control[0]} ${line.control[1]} ${line.to[0]} ${line.to[1]}`}
              fill="none"
              stroke="#07080d"
              strokeWidth="3"
            />
            {Array.from({ length: line.bulbs }, (_, i) => {
              const [x, y] = pointOnQuad(line.from, line.control, line.to, (i + 1) / (line.bulbs + 1));
              return (
                <g key={i} className="string-bulb" style={{ animationDelay: `${-((i * 1.3 + l) % 7)}s` }}>
                  <circle cx={x.toFixed(1)} cy={(y + 9).toFixed(1)} r={l === 0 ? 34 : 22} fill="url(#bulb)" />
                  <circle cx={x.toFixed(1)} cy={(y + 9).toFixed(1)} r={l === 0 ? 5.5 : 3.5} fill="#fff1cf" />
                </g>
              );
            })}
          </g>
        ))}
      </svg>

      <div className="fog" />
      <div className="fog fog-far" />
      {MOTES.map((m, i) => (
        <span
          key={i}
          className="mote"
          style={{
            left: m.left,
            bottom: m.bottom,
            width: m.size,
            height: m.size,
            animationDelay: m.delay,
            animationDuration: m.duration,
          }}
        />
      ))}
      <div ref={lightRef} className="phone-light" />
      <div className="vignette" />
    </div>
  );
}
