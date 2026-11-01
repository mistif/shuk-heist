import "server-only";

type Rule = { limit: number; windowMs: number };

// Returns a check that counts one request and gives the seconds to wait, or null if allowed.
export function makeLimiter({ limit, windowMs }: Rule, now: () => number = Date.now) {
  const windows = new Map<string, { start: number; count: number }>();

  return (key: string): number | null => {
    const time = now();
    let current = windows.get(key);
    if (!current || time - current.start >= windowMs) {
      if (windows.size >= 10_000) windows.clear();
      current = { start: time, count: 0 };
      windows.set(key, current);
    }
    if (current.count >= limit) return Math.ceil((current.start + windowMs - time) / 1000);
    current.count += 1;
    return null;
  };
}

export function clientKey(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

// A reply takes several seconds, so a real game stays well under these.
const perMinute = makeLimiter({ limit: 15, windowMs: MINUTE });
const perDay = makeLimiter({ limit: 150, windowMs: DAY });
// Caps the OpenAI bill even if someone fakes the forwarded address.
const wholeGamePerDay = makeLimiter({ limit: 1500, windowMs: DAY });

// TODO(lean): counts live in this server's memory, so they reset on restart and aren't shared
// between instances; move them to a shared store if this is ever deployed publicly.
export function rateLimited(req: Request): Response | null {
  const key = clientKey(req);
  const wait = perMinute(key) ?? perDay(key) ?? wholeGamePerDay("all");
  if (wait === null) return null;
  return Response.json(
    { error: "Too many questions. Take a breath and try again soon." },
    { status: 429, headers: { "Retry-After": String(wait) } },
  );
}
