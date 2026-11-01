import { SOLUTION } from "@/lib/solution";
import { suspectName } from "@/lib/suspects";
import { AccuseRequest, badRequest, parseBody } from "@/lib/validate";

export async function POST(req: Request) {
  const parsed = await parseBody(req, AccuseRequest);
  if (!parsed.ok) return badRequest();

  const { suspect, final } = parsed.data;
  const correct = suspect === SOLUTION.culprit;
  if (!correct && !final) return Response.json({ correct: false });

  return Response.json({
    correct,
    culprit: suspectName(SOLUTION.culprit),
    explanation: SOLUTION.explanation,
  });
}
