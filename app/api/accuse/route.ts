import { SOLUTIONS, thiefFor } from "@/lib/solution";
import { suspectName } from "@/lib/suspects";
import { AccuseRequest, badRequest, parseBody, serverError } from "@/lib/validate";

export async function POST(req: Request) {
  const parsed = await parseBody(req, AccuseRequest);
  if (!parsed.ok) return badRequest();

  try {
    const { caseId, suspect, final } = parsed.data;
    const thief = thiefFor(caseId);
    const correct = suspect === thief;
    if (!correct && !final) return Response.json({ correct: false });

    return Response.json({
      correct,
      culprit: suspectName(thief),
      explanation: SOLUTIONS[thief].explanation,
    });
  } catch (err) {
    return serverError(err);
  }
}
