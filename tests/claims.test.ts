import { describe, expect, it } from "vitest";
import { claimNote } from "@/lib/claims";

describe("claimNote", () => {
  it("separates real evidence from bluffs", () => {
    const note = claimNote({ real: ["the lens cap"], fake: ["a video of you"] });
    expect(note).toContain("really has:\n- the lens cap");
    expect(note).toContain("bluffing about:\n- a video of you");
  });

  it("says so when there is no evidence", () => {
    expect(claimNote({ real: [], fake: [] })).toContain("really has:\n- nothing");
  });
});
