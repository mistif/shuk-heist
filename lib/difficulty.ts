export const DIFFICULTIES = [
  {
    id: "rookie",
    name: "Rookie",
    description: "They lie badly and slip up. One real piece of evidence is enough to crack them.",
  },
  {
    id: "detective",
    name: "Detective",
    description: "They stick to their story until you meet the conditions that break it.",
  },
  {
    id: "inspector",
    name: "Inspector",
    description: "They lie smoothly and deflect. Every claim is checked against the files, so bluffs fail.",
  },
] as const;

export type DifficultyId = (typeof DIFFICULTIES)[number]["id"];

export const DIFFICULTY_IDS = DIFFICULTIES.map((d) => d.id) as [DifficultyId, ...DifficultyId[]];

export const DEFAULT_DIFFICULTY: DifficultyId = "detective";

export function difficultyName(id: DifficultyId): string {
  return DIFFICULTIES.find((d) => d.id === id)!.name;
}
