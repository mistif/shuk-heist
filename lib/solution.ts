import "server-only";
import type { SuspectId } from "./suspects";

export const SOLUTION: { culprit: SuspectId; keyEvidence: string[]; explanation: string } = {
  culprit: "maya",
  keyEvidence: ["C2", "C3", "C5", "S4"],
  explanation:
    "Maya Katz took the notebook. Her lens cap was found under the counter after Rina had swept the floor, and her 01:52 story shows the lipstick cup in front of the only blue-tile wall in the Shuk, so she was at the stall that night, not home in Tel Aviv. " +
    "Dani has a solid alibi, and he has sold his stall and withdrawn from the championship. " +
    "Noa lied because she was out meeting her boyfriend, which makes her a witness. " +
    "Yossi's log looks fake because he slept through the night and filled it in the next morning.",
};
