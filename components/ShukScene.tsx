"use client";

import { useEffect, useRef } from "react";

// One-point perspective: the walls converge on the far end of the alley.
const wallTop = (x: number) => 120 + (275 * x) / 700;
const wallBottom = (x: number) => 900 - (400 * x) / 700;

function courseLines(x0: number, x1: number, count: number) {
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
  [14, 280],
  [318, 505],
  [536, 680],
] as const;

// Iron roof trusses, near to far.
const TRUSSES = [0.44, 0.33, 0.25, 0.19];

type Point = readonly [number, number];

function pointOnQuad(from: Point, control: Point, to: Point, t: number): Point {
  const u = 1 - t;
  const at = (i: 0 | 1) => u * u * from[i] + 2 * u * t * control[i] + t * t * to[i];
  return [at(0), at(1)];
}

const STRINGS = [
  { from: [0, 170], control: [800, 400], to: [1600, 140], bulbs: 13 },
  { from: [250, 300], control: [800, 425], to: [1350, 290], bulbs: 9 },
] as const;

// Warm streaks on the wet stone, under each pool of light.
const REFLECTIONS = [
  [1400, 730, 120, 170, 0.5],
  [800, 590, 34, 90, 0.5],
  [560, 680, 50, 130, 0.22],
  [1040, 680, 50, 130, 0.26],
  [300, 800, 70, 110, 0.16],
];

// A static layer holds the textures. Lights that move live in a layer of their own, so
// the browser never has to redraw these filters during an animation.
function Market() {
  return (
    <svg className="scene-art scene-back" viewBox="0 0 1600 900" preserveAspectRatio="xMaxYMax slice">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#04060b" />
          <stop offset="0.3" stopColor="#0a0d16" />
          <stop offset="0.48" stopColor="#2a2029" />
          <stop offset="0.56" stopColor="#5a3b2a" />
        </linearGradient>
        <linearGradient id="stone" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3a342c" />
          <stop offset="1" stopColor="#8a7a62" />
        </linearGradient>
        <linearGradient id="shutter" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2e3033" />
          <stop offset="1" stopColor="#6a665e" />
        </linearGradient>
        <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6f5a44" />
          <stop offset="0.35" stopColor="#3a3029" />
          <stop offset="1" stopColor="#100e0d" />
        </linearGradient>
        <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c6cbd0" />
          <stop offset="0.35" stopColor="#6f767d" />
          <stop offset="1" stopColor="#15181b" />
        </linearGradient>
        <linearGradient id="signboard" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3a1410" />
          <stop offset="1" stopColor="#5c2019" />
        </linearGradient>
        <linearGradient id="glaze" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0.2" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="pool">
          <stop offset="0" stopColor="#ffbe78" stopOpacity="0.62" />
          <stop offset="0.5" stopColor="#ff9a4a" stopOpacity="0.16" />
          <stop offset="1" stopColor="#ff9a4a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="tileShade" cx="0.52" cy="0.42" r="0.68">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="0.6" stopColor="#120a06" stopOpacity="0.32" />
          <stop offset="1" stopColor="#050304" stopOpacity="0.88" />
        </radialGradient>

        {/* Rough limestone: noise read as a height map and lit from one side. */}
        <filter id="rock" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.022 0.06" numOctaves="5" seed="7" result="noise" />
          <feDiffuseLighting in="noise" surfaceScale="3.2" diffuseConstant="1.15" lightingColor="#fff" result="light">
            <feDistantLight azimuth="215" elevation="56" />
          </feDiffuseLighting>
          <feComposite in="SourceGraphic" in2="light" operator="arithmetic" k1="1.2" result="lit" />
          <feComposite in="lit" in2="SourceAlpha" operator="in" />
        </filter>
        {/* Worn paving, with stretched noise so that it lies flat in perspective. */}
        <filter id="paving" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.016 0.11" numOctaves="4" seed="11" result="noise" />
          <feDiffuseLighting in="noise" surfaceScale="2.4" diffuseConstant="1.2" lightingColor="#fff" result="light">
            <feDistantLight azimuth="90" elevation="62" />
          </feDiffuseLighting>
          <feComposite in="SourceGraphic" in2="light" operator="arithmetic" k1="1.25" result="lit" />
          <feComposite in="lit" in2="SourceAlpha" operator="in" />
        </filter>
        {/* Dirt and rust, darkest in patches. */}
        <filter id="grime" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.009 0.024" numOctaves="5" seed="3" />
          <feColorMatrix values="0 0 0 0 0.05  0 0 0 0 0.03  0 0 0 0 0.02  1.9 0 0 0 -0.72" result="dirt" />
          <feComposite in="dirt" in2="SourceAlpha" operator="in" result="stain" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="stain" />
          </feMerge>
        </filter>
        <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
        <filter id="wetStreak" x="-60%" y="-30%" width="220%" height="160%">
          <feGaussianBlur stdDeviation="20 34" />
        </filter>

        {/* Rina's blue-and-white Armenian tiles, tilted to sit on the stall's wall. */}
        <pattern id="tiles" width="58" height="58" patternUnits="userSpaceOnUse" patternTransform="matrix(1 -0.26 0 1 0 0)">
          <rect width="58" height="58" fill="#e4e6e4" />
          <path d="M29 5 37 21 53 29 37 37 29 53 21 37 5 29 21 21Z" fill="#1c4f8e" />
          <circle cx="29" cy="29" r="6" fill="#e4e6e4" />
          <circle cx="29" cy="29" r="3" fill="#0f3566" />
          <path d="M0 0H12L0 12ZM58 0H46L58 12ZM0 58H12L0 46ZM58 58H46L58 46Z" fill="#0f3566" />
          <rect width="58" height="58" fill="none" stroke="#7b8894" strokeWidth="1.4" />
        </pattern>
      </defs>

      <rect width="1600" height="900" fill="url(#sky)" />
      <ellipse cx="800" cy="440" rx="460" ry="130" fill="#ff9a50" opacity="0.13" filter="url(#soft)" />

      {/* Jerusalem rooftops beyond the end of the alley. */}
      <path
        d="M480 450V345H538V322H566V350H626V300H640V352H700V330H752C752 300 778 282 800 282C822 282 848 300 848 330H892V306H952V350H1020V318H1090V450Z"
        fill="#0d0d13"
      />
      {[[552, 365], [612, 385], [664, 372], [868, 360], [926, 340], [1042, 365]].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="6" height="10" fill="#d9a35c" opacity={i % 2 ? 0.75 : 0.32} />
      ))}

      {/* The paving: texture first, then what the wet stone reflects. */}
      <polygon points="0,900 700,500 900,500 1600,900" fill="url(#floor)" filter="url(#paving)" />
      {[-620, -380, -180, -60, 60, 180, 380, 620].map((x) => (
        <line key={x} x1={800 + x * 0.12} y1="500" x2={800 + x * 1.5} y2="900" stroke="#070605" strokeOpacity="0.5" strokeWidth="1.5" />
      ))}
      {[520, 548, 590, 650, 735, 850].map((y) => (
        <line key={y} x1={800 - (y - 455) * 1.8} y1={y} x2={800 + (y - 455) * 1.8} y2={y} stroke="#070605" strokeOpacity="0.32" strokeWidth="1.5" />
      ))}
      {REFLECTIONS.map(([cx, cy, rx, ry, opacity]) => (
        <ellipse key={cx} cx={cx} cy={cy} rx={rx} ry={ry} fill="#ffb066" opacity={opacity} filter="url(#wetStreak)" />
      ))}

      {/* The side gate on Agrippas Street, its latch broken and the gate hanging open. */}
      <rect x="700" y="395" width="200" height="105" fill="#06060a" />
      <rect x="700" y="465" width="200" height="35" fill="#6d4a2e" opacity="0.32" filter="url(#soft)" />
      <g stroke="#1c1f26" strokeWidth="3">
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

      {/* Left wall, then the same stalls mirrored for the right wall. */}
      {[false, true].map((mirrored) => (
        <g key={String(mirrored)} transform={mirrored ? "translate(1600 0) scale(-1 1)" : undefined}>
          <polygon points="0,0 700,395 700,500 0,900" fill="url(#stone)" filter="url(#rock)" />
          <path d={courseLines(0, 700, 11)} stroke="#100d0a" strokeOpacity="0.55" strokeWidth="1.4" fill="none" />
          {STALLS.map(([x0, x1]) => (
            <g key={x0}>
              <polygon points={stallFront(x0, x1)} fill="url(#shutter)" filter="url(#grime)" />
              <path d={courseLines(x0, x1, 46)} stroke="#050505" strokeOpacity="0.62" strokeWidth="1.3" fill="none" />
              <path d={courseLines(x0, x1, 23)} stroke="#b9b4a8" strokeOpacity="0.12" strokeWidth="1" fill="none" />
              <polygon
                points={`${x0},${wallTop(x0).toFixed(1)} ${x1},${wallTop(x1).toFixed(1)} ${x1},${(wallTop(x1) + 0.14 * (wallBottom(x1) - wallTop(x1))).toFixed(1)} ${x0},${(wallTop(x0) + 0.14 * (wallBottom(x0) - wallTop(x0))).toFixed(1)}`}
                fill="#14110e"
              />
            </g>
          ))}
        </g>
      ))}

      <g transform="translate(30 186) skewY(21.4)">
        <text className="sign-text" fontSize="29" fontWeight="700" fill="#b9a27c">HUMMUS HAMELECH</text>
      </g>

      {/* Stall 14: the tile wall, the sign and the steel counter under one bulb. */}
      <polygon points="1180,335 1600,225 1600,705 1180,545" fill="url(#tiles)" />
      <polygon points="1180,335 1600,225 1600,705 1180,545" fill="url(#glaze)" />
      <polygon points="1180,335 1600,225 1600,705 1180,545" fill="url(#tileShade)" />
      <polygon points="1180,285 1600,120 1600,225 1180,335" fill="url(#signboard)" filter="url(#grime)" />
      <g transform="translate(1206 326) skewY(-21.4)">
        <text className="sign-text" fontSize="36" fontWeight="700" fill="#efd7ac">HUMMUS SHALEV 14</text>
      </g>
      <polygon points="1180,545 1600,705 1600,900 1180,660" fill="url(#steel)" filter="url(#grime)" />
      <polygon points="1180,545 1600,705 1600,711 1180,549" fill="#f2f4f6" opacity="0.8" />
      <ellipse cx="1400" cy="440" rx="310" ry="270" fill="url(#pool)" opacity="0.55" />

      {/* Iron trusses cross the alley overhead. */}
      {TRUSSES.map((s) => (
        <g key={s} fill="none" stroke="#040507">
          <path d={`M${800 - 860 * s} ${430 - 30 * s}Q800 ${430 - 590 * s} ${800 + 860 * s} ${430 - 30 * s}`} strokeWidth={15 * s} />
          <path d={`M${800 - 860 * s} ${430 - 78 * s}Q800 ${430 - 630 * s} ${800 + 860 * s} ${430 - 78 * s}`} strokeWidth={5 * s} />
        </g>
      ))}
    </svg>
  );
}

function Lights() {
  return (
    <svg className="scene-art scene-lights" viewBox="0 0 1600 900" preserveAspectRatio="xMaxYMax slice">
      <defs>
        <radialGradient id="bulb">
          <stop offset="0" stopColor="#ffe9c0" stopOpacity="0.85" />
          <stop offset="0.12" stopColor="#ffbd6d" stopOpacity="0.42" />
          <stop offset="0.45" stopColor="#ff9c45" stopOpacity="0.08" />
          <stop offset="1" stopColor="#ff9c45" stopOpacity="0" />
        </radialGradient>
      </defs>

      <line x1="1400" y1="160" x2="1400" y2="304" stroke="#050608" strokeWidth="2.5" />
      <path d="M1376 304Q1380 288 1400 288Q1420 288 1424 304Z" fill="#111317" />
      <g className="bulb-glow">
        <circle cx="1400" cy="310" r="130" fill="url(#bulb)" />
        <circle cx="1400" cy="310" r="6" fill="#fffaf0" />
      </g>

      {STRINGS.map((line, l) => (
        <g key={l} className={l === 0 ? "sway" : "sway sway-late"}>
          <path
            d={`M${line.from[0]} ${line.from[1]}Q${line.control[0]} ${line.control[1]} ${line.to[0]} ${line.to[1]}`}
            fill="none"
            stroke="#030406"
            strokeWidth={l === 0 ? 2 : 1.4}
          />
          {Array.from({ length: line.bulbs }, (_, i) => {
            const [x, y] = pointOnQuad(line.from, line.control, line.to, (i + 1) / (line.bulbs + 1));
            const size = l === 0 ? 1 : 0.62;
            return (
              <g key={i} className="string-bulb" style={{ animationDelay: `${-((i * 1.3 + l) % 7)}s` }}>
                <line x1={x} y1={y} x2={x} y2={y + 7 * size} stroke="#030406" strokeWidth={2.5 * size} />
                <circle cx={x} cy={y + 12 * size} r={58 * size} fill="url(#bulb)" />
                <circle cx={x} cy={y + 12 * size} r={3.6 * size} fill="#fff7e6" />
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );
}

export default function ShukScene() {
  const rootRef = useRef<HTMLDivElement>(null);

  // The player's pointer is a phone light moving through the dark market, and the alley
  // shifts slightly with it. On touch screens the light drifts by itself.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const place = (x: number, y: number) => {
      root.style.setProperty("--light-x", `${x}px`);
      root.style.setProperty("--light-y", `${y}px`);
      root.style.setProperty("--shift-x", (x / window.innerWidth - 0.5).toFixed(3));
      root.style.setProperty("--shift-y", (y / window.innerHeight - 0.5).toFixed(3));
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
    <div ref={rootRef} className="scene" aria-hidden="true">
      <Market />
      <div className="fog" />
      <Lights />
      <div className="phone-light" />
      <div className="vignette" />
      <div className="grain" />
    </div>
  );
}
