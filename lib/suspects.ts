export const SUSPECTS = [
  { id: "dani", name: "Dani Levi", role: "Owner of Hummus HaMelech, across the alley" },
  { id: "noa", name: "Noa Shalev", role: "Rina's niece, works at the stall" },
  { id: "yossi", name: "Yossi Ben-David", role: "Night guard" },
  { id: "maya", name: "Maya Katz", role: "Food influencer" },
] as const;

export type SuspectId = (typeof SUSPECTS)[number]["id"];

export const SUSPECT_IDS = SUSPECTS.map((s) => s.id) as [SuspectId, ...SuspectId[]];

export function isSuspectId(value: string): value is SuspectId {
  return (SUSPECT_IDS as string[]).includes(value);
}

export function suspectName(id: SuspectId): string {
  return SUSPECTS.find((s) => s.id === id)!.name;
}
