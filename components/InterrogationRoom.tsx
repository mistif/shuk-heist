"use client";

import { useEffect, useRef, useState } from "react";
import { suspectName, type SuspectId } from "@/lib/suspects";

const MOODS = ["calm", "uneasy", "nervous", "cracking"] as const;

function moodLevel(nervousness: number) {
  if (nervousness <= 2) return 0;
  if (nervousness <= 5) return 1;
  if (nervousness <= 7) return 2;
  return 3;
}

const LOOKS: Record<SuspectId, { skin: string; lit: string; hair: string; top: string }> = {
  dani: { skin: "#a87650", lit: "#d7a67f", hair: "#17110e", top: "#d9d2c3" },
  noa: { skin: "#bd8c68", lit: "#e8bf9d", hair: "#2c1a11", top: "#35594c" },
  yossi: { skin: "#986a48", lit: "#c99a74", hair: "#4b4744", top: "#1d2a3c" },
  maya: { skin: "#c49474", lit: "#efc6a8", hair: "#5e2d17", top: "#7d2f49" },
};

// One set per mood, from relaxed to cracking.
const BROWS = [
  ["M158 133Q172 128 186 133", "M214 133Q228 128 242 133"],
  ["M158 131Q172 127 186 134", "M214 134Q228 127 242 131"],
  ["M158 135Q172 125 186 128", "M214 128Q228 125 242 135"],
  ["M156 138Q170 123 186 122", "M214 122Q230 123 244 138"],
];
const MOUTHS = [
  "M180 203Q200 209 220 203",
  "M182 205Q200 206 218 205",
  "M180 206Q190 202 200 206T220 206",
  "M184 208Q200 197 216 208Q200 215 184 208Z",
];
const SWEAT = [
  [],
  [[246, 122]],
  [[246, 122], [154, 128], [252, 160]],
  [[246, 122], [154, 128], [252, 160], [148, 166], [200, 100], [236, 186]],
] as const;

const CHANNELS = [
  { label: "PULSE", color: "#a3261b" },
  { label: "RESP", color: "#1d2a3c" },
  { label: "GSR", color: "#3f4a2c" },
];

// How far each pen moves at a moment in time. `n` runs from 0 (calm) to 1 (cornered).
function pen(channel: number, t: number, n: number) {
  if (channel === 0) {
    const beat = Math.sin(t * (6 + n * 8));
    return Math.pow(Math.max(beat, 0), 18) * (0.5 + n * 0.5) - 0.12 * Math.sin(t * (6 + n * 8) * 0.5);
  }
  if (channel === 1) return Math.sin(t * (1.4 + n * 2.6)) * (0.3 + n * 0.45);
  return (Math.sin(t * 0.35) + Math.sin(t * 3.1) * n * 0.5 + Math.sin(t * 7.3) * n * 0.25) * (0.15 + n * 0.5);
}

// A polygraph strip. The pens run faster and wider as the suspect gets more nervous.
function Polygraph({ nervousness }: { nervousness: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const target = useRef(nervousness / 10);
  useEffect(() => {
    target.current = nervousness / 10;
  }, [nervousness]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let frame = 0;
    let n = target.current;

    const draw = (time: number) => {
      const scale = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== Math.round(width * scale)) canvas.width = Math.round(width * scale);
      if (canvas.height !== Math.round(height * scale)) canvas.height = Math.round(height * scale);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const now = time / 1000;
      const pxPerSecond = 46;
      const scroll = (now * pxPerSecond) % 16;
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgb(30 42 60 / 0.14)";
      ctx.beginPath();
      for (let x = -scroll; x < width; x += 16) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 8; y < height; y += 16) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      n += (target.current - n) * 0.02;
      const lane = height / CHANNELS.length;
      CHANNELS.forEach(({ color }, c) => {
        const middle = lane * (c + 0.5);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        for (let x = 0; x <= width; x += 1.5) {
          const y = middle - pen(c, now - (width - x) / pxPerSecond, n) * lane * 0.46;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      draw(0);
      return;
    }
    const loop = (time: number) => {
      draw(time);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="polygraph" aria-hidden="true">
      <div className="polygraph-labels">
        {CHANNELS.map((c) => (
          <span key={c.label}>{c.label}</span>
        ))}
      </div>
      <canvas ref={canvasRef} className="polygraph-paper" />
    </div>
  );
}

function RunningClock() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);
  const part = (value: number) => String(value).padStart(2, "0");
  return <>{`${part(Math.floor(seconds / 60))}:${part(seconds % 60)}`}</>;
}

function Hair({ id, color }: { id: SuspectId; color: string }) {
  if (id === "dani") {
    return (
      <>
        <path d="M140 138C134 88 170 68 200 68C236 68 266 90 260 138C252 112 232 100 200 100C170 100 148 112 140 138Z" fill={color} />
        <path d="M178 193Q200 186 222 193Q214 198 200 196Q186 198 178 193Z" fill={color} opacity="0.7" />
      </>
    );
  }
  if (id === "yossi") {
    return (
      <>
        <path d="M138 120C138 80 170 62 200 62C232 62 262 80 262 120Z" fill="#141e2d" />
        <rect x="128" y="112" width="144" height="11" rx="5" fill="#0b121c" />
        <circle cx="200" cy="90" r="7" fill="#8a7440" />
        <path d="M176 192Q200 184 224 192Q200 198 176 192Z" fill={color} />
      </>
    );
  }
  if (id === "noa") {
    return (
      <>
        <path d="M136 150C128 88 168 66 200 66C236 66 272 88 264 150C256 116 236 100 200 100C164 100 144 116 136 150Z" fill={color} />
        <path d="M258 134C280 170 274 222 260 252C254 232 250 180 248 150Z" fill={color} />
      </>
    );
  }
  return (
    <>
      <path d="M130 240C114 150 128 68 200 64C272 68 286 150 270 240C260 214 260 170 252 134C238 104 162 104 148 134C140 170 140 214 130 240Z" fill={color} />
      <path d="M148 90Q200 68 252 90L248 100Q200 84 152 100Z" fill="#100c12" />
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
  const open = level >= 2 ? 6 : 4.5;

  return (
    <div className={`room-stage nerve-${level}`}>
      <div className="room-feed">
        <div className="room-door room-door-left" aria-hidden="true" />
        <div className="room-door room-door-right" aria-hidden="true" />
        <svg
          className="room-art"
          viewBox="0 -30 400 390"
          preserveAspectRatio="xMidYMax slice"
          role="img"
          aria-label={`${name} sits across the table, looking ${MOODS[level]}`}
        >
          <defs>
            <radialGradient id="face" cx="0.38" cy="0.32" r="0.8">
              <stop offset="0" stopColor={look.lit} />
              <stop offset="0.55" stopColor={look.skin} />
              <stop offset="1" stopColor="#2b1a12" />
            </radialGradient>
            <linearGradient id="neck" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1c110c" />
              <stop offset="0.7" stopColor={look.skin} />
            </linearGradient>
            <linearGradient id="torso" x1="0" y1="0" x2="1" y2="0.3">
              <stop offset="0" stopColor={look.top} />
              <stop offset="1" stopColor="#08090c" />
            </linearGradient>
            <linearGradient id="tabletop" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#8d9096" />
              <stop offset="0.12" stopColor="#4f5258" />
              <stop offset="1" stopColor="#141518" />
            </linearGradient>
            <linearGradient id="falloff" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0.28" stopColor="#000" stopOpacity="0" />
              <stop offset="1" stopColor="#000" stopOpacity="0.82" />
            </linearGradient>
            <radialGradient id="socket">
              <stop offset="0.45" stopColor="#0d0705" stopOpacity="0.88" />
              <stop offset="1" stopColor="#0d0705" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff2d4" stopOpacity="0.3" />
              <stop offset="1" stopColor="#fff2d4" stopOpacity="0" />
            </linearGradient>
          </defs>

          <g className="room-lamp">
            <polygon points="172,-20 228,-20 390,360 10,360" fill="url(#cone)" />
            <line x1="200" y1="-500" x2="200" y2="-36" stroke="#050608" strokeWidth="3" />
            <path d="M172 -20Q178 -36 200 -36Q222 -36 228 -20Z" fill="#0c0d10" />
          </g>

          <g className="room-camera">
            <g className="figure-enter">
              <g className="figure-breathe">
                <path d="M84 340C88 272 130 250 170 242H230C270 250 312 272 316 340Z" fill="url(#torso)" />
                {id === "dani" && <path d="M170 242L200 290L230 242Z" fill="#a89f8c" />}
                {id === "noa" && <path d="M172 244H228L238 340H162Z" fill="#b9b09d" opacity="0.8" />}
                {id === "yossi" && (
                  <>
                    <path d="M178 242L200 270L222 242Z" fill="#5d6d84" />
                    <path d="M200 270V340" stroke="#0a0f18" strokeWidth="2" />
                    <circle cx="212" cy="296" r="2.5" fill="#8a7440" />
                    <circle cx="212" cy="322" r="2.5" fill="#8a7440" />
                  </>
                )}
                {id === "maya" && <path d="M172 242Q200 280 228 242L220 300H180Z" fill="#c7ad98" />}
                <path d="M178 212H222V250Q200 262 178 250Z" fill="url(#neck)" />

                <g className="figure-head">
                  <ellipse cx="139" cy="156" rx="7" ry="15" fill={look.skin} />
                  <ellipse cx="261" cy="156" rx="7" ry="15" fill="#3a241a" />
                  <path
                    d="M140 140C140 92 166 70 200 70C234 70 260 92 260 140C260 176 248 206 226 222C214 231 186 231 174 222C152 206 140 176 140 140Z"
                    fill="url(#face)"
                  />
                  <path
                    className="figure-flush"
                    d="M146 160C150 190 164 212 178 220C190 226 210 226 222 220C236 212 250 190 254 160Z"
                    fill="#c43a22"
                  />
                  <Hair id={id} color={look.hair} />

                  <ellipse cx="172" cy="148" rx="30" ry="22" fill="url(#socket)" />
                  <ellipse cx="228" cy="148" rx="30" ry="22" fill="url(#socket)" />
                  <g className="figure-eyes">
                    <ellipse cx="172" cy="151" rx="10" ry={open} fill="#a39e94" />
                    <ellipse cx="228" cy="151" rx="10" ry={open} fill="#7f7b73" />
                    <g className="figure-pupils">
                      <circle cx="172" cy="151" r="4.6" fill="#2a1a11" />
                      <circle cx="228" cy="151" r="4.6" fill="#2a1a11" />
                      <circle cx="172" cy="151" r={level === 3 ? 1.5 : 2.3} fill="#050403" />
                      <circle cx="228" cy="151" r={level === 3 ? 1.5 : 2.3} fill="#050403" />
                      <circle cx="170" cy="149.5" r="1.1" fill="#fff" />
                      <circle cx="226" cy="149.5" r="1.1" fill="#fff" />
                    </g>
                    <path d={`M160 151Q172 ${150 - open * 1.6} 184 151`} fill="none" stroke="#1a0f0a" strokeWidth="2" strokeLinecap="round" />
                    <path d={`M216 151Q228 ${150 - open * 1.6} 240 151`} fill="none" stroke="#1a0f0a" strokeWidth="2" strokeLinecap="round" />
                    <g className="figure-lids" fill={look.skin}>
                      <ellipse cx="172" cy="151" rx="12" ry="8" />
                      <ellipse cx="228" cy="151" rx="12" ry="8" />
                    </g>
                  </g>
                  {BROWS[level].map((d) => (
                    <path key={d} d={d} fill="none" stroke={id === "maya" ? "#3d1e10" : "#16100c"} strokeWidth="3" strokeOpacity="0.8" strokeLinecap="round" />
                  ))}
                  <path d="M206 150C210 164 214 176 212 184C210 190 202 192 196 190C202 188 206 184 204 176C203 168 203 158 206 150Z" fill="#1c110c" opacity="0.4" />
                  <path d="M190 186Q200 193 212 186" fill="none" stroke="#1c110c" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
                  <path
                    d={MOUTHS[level]}
                    fill={level === 3 ? "#1d0a08" : "none"}
                    stroke={id === "maya" || id === "noa" ? "#6f2a33" : "#3a1c12"}
                    strokeWidth="2.2"
                    strokeOpacity="0.85"
                    strokeLinecap="round"
                  />
                  <path d="M186 214Q200 219 214 214" fill="none" stroke="#1c110c" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />
                  {SWEAT[level].map(([x, y], i) => (
                    <path
                      key={i}
                      className="figure-sweat"
                      style={{ animationDelay: `${-i * 0.55}s` }}
                      d={`M${x} ${y}q3.5 6 0 9q-3.5 -3 0 -9Z`}
                      fill="#f2f6fa"
                    />
                  ))}
                </g>
              </g>

              <rect x="-40" y="312" width="480" height="60" fill="url(#tabletop)" />
              <rect x="-40" y="312" width="480" height="1.5" fill="#c3c6cb" />
              <g className="figure-hands">
                <path d="M120 318C122 306 150 302 176 306C188 308 192 316 188 322C172 328 134 330 120 318Z" fill={look.skin} />
                <path d="M212 306C238 302 278 306 280 318C266 330 228 328 212 322C208 316 202 308 212 306Z" fill="#6b4630" />
                <path d="M146 306V320M158 305V322M170 305V322M230 305V322M242 305V322M254 306V320" stroke="#1c110c" strokeOpacity="0.45" strokeWidth="1.5" />
              </g>
              <g transform="rotate(-4 322 340)">
                <rect x="288" y="328" width="76" height="24" fill="#a58c5a" />
                <rect x="294" y="325" width="64" height="5" fill="#dcd8cc" />
              </g>
            </g>
          </g>

          <rect x="0" y="-30" width="400" height="390" fill="url(#falloff)" />
        </svg>
        <div className="room-scan" aria-hidden="true" />
        <p className="room-hud room-hud-left typewriter" aria-hidden="true">
          <span className="rec-dot" /> REC <RunningClock />
        </p>
        <p className="room-caption typewriter">
          {name} looks {MOODS[level]}
        </p>
      </div>
      <Polygraph nervousness={nervousness} />
    </div>
  );
}
