import { describe, expect, it } from "vitest";
import { clientKey, makeLimiter } from "@/lib/rate-limit";

const request = (headers: Record<string, string>) => new Request("http://test", { headers });

describe("makeLimiter", () => {
  it("allows up to the limit, then says when to retry", () => {
    let time = 0;
    const check = makeLimiter({ limit: 2, windowMs: 60_000 }, () => time);
    expect(check("a")).toBeNull();
    expect(check("a")).toBeNull();
    time = 15_000;
    expect(check("a")).toBe(45);
  });

  it("opens again when the window ends", () => {
    let time = 0;
    const check = makeLimiter({ limit: 1, windowMs: 1000 }, () => time);
    check("a");
    expect(check("a")).toBe(1);
    time = 1000;
    expect(check("a")).toBeNull();
  });

  it("counts each client separately", () => {
    const check = makeLimiter({ limit: 1, windowMs: 1000 }, () => 0);
    expect(check("a")).toBeNull();
    expect(check("b")).toBeNull();
    expect(check("a")).toBe(1);
  });
});

describe("clientKey", () => {
  it("uses the first forwarded address", () => {
    expect(clientKey(request({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("1.2.3.4");
  });

  it("falls back to one shared key", () => {
    expect(clientKey(request({}))).toBe("local");
  });
});
