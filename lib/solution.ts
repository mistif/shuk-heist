import "server-only";
import { createHmac } from "node:crypto";
import { SUSPECT_IDS, type SuspectId } from "./suspects";

// The server keeps no game state, so the thief is worked out from the case ID and a
// server secret: the same for a whole game, and unknowable from the browser.
export function thiefFor(
  caseId: string,
  secret = process.env.CASE_SECRET ?? process.env.OPENAI_API_KEY,
): SuspectId {
  if (!secret) throw new Error("Set CASE_SECRET or OPENAI_API_KEY to pick the thief");
  const byte = createHmac("sha256", secret).update(`thief:${caseId}`).digest()[0];
  return SUSPECT_IDS[byte % SUSPECT_IDS.length];
}

const ENDINGS = {
  dani: "Dani's alibi is solid, and he has sold his stall and withdrawn from the championship.",
  noa: "Noa lied because she was out meeting her boyfriend, which makes her a witness.",
  yossi: "Yossi's log looks fake because he slept through the night and filled it in the next morning.",
  maya: "Maya's alibi holds up. What she was hiding is that brands pay for her reviews.",
};

const others = (thief: SuspectId) =>
  SUSPECT_IDS.filter((id) => id !== thief).map((id) => ENDINGS[id]).join(" ");

export const SOLUTIONS: Record<SuspectId, { keyEvidence: string[]; explanation: string }> = {
  dani: {
    keyEvidence: ["C2", "C3", "C5", "S1"],
    explanation: `Dani Levi took the notebook. A boutonniere from that night's wedding was under the counter after Rina had swept the floor, and the parking record puts his car by the broken side gate at 02:06, so he didn't go straight to his brother's. ${others("dani")}`,
  },
  noa: {
    keyEvidence: ["C2", "C3", "C5", "S2"],
    explanation: `Noa Shalev took the notebook. Her lemon-charm hair tie was under the counter after Rina had swept the floor, and a doorbell camera shows the staff hoodie only she and Rina own leaving her building at 01:22, so she wasn't asleep. ${others("noa")}`,
  },
  yossi: {
    keyEvidence: ["C2", "C3", "C4", "C5"],
    explanation: `Yossi Ben-David took the notebook. His uniform button was under the counter after Rina had swept the floor, and the 01:52 email offering the recipe shows his sleeve and his neatly written log beside the notebook, so the rounds he logged never happened. ${others("yossi")}`,
  },
  maya: {
    keyEvidence: ["C2", "C3", "C5", "S4"],
    explanation: `Maya Katz took the notebook. Her lens cap was found under the counter after Rina had swept the floor, and her 01:52 story shows the lipstick cup in front of the only blue-tile wall in the Shuk, so she was at the stall that night, not home in Tel Aviv. ${others("maya")}`,
  },
};
