import { AGENT_RUN_LIMITS, getSuspect, prepareSearch } from "@/lib/agents";
import { checkClaims, claimNote } from "@/lib/claims";
import { isOnTopic, SUSPECT_REFUSALS } from "@/lib/guard";
import { rateLimited } from "@/lib/rate-limit";
import { isSuspectId } from "@/lib/suspects";
import { badRequest, ChatRequest, parseBody, serverError, SuspectReply } from "@/lib/validate";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isSuspectId(id)) return Response.json({ error: "Unknown suspect" }, { status: 404 });

  const limited = rateLimited(req);
  if (limited) return limited;

  const parsed = await parseBody(req, ChatRequest);
  if (!parsed.ok) return badRequest();

  try {
    const newest = parsed.data.messages.at(-1)!.content;
    if (!(await isOnTopic(newest))) return Response.json({ reply: SUSPECT_REFUSALS[id] });

    await prepareSearch();
    const { messages, difficulty } = parsed.data;
    // Only Inspector checks claims against the files, so only it pays for the extra call.
    const note =
      difficulty === "inspector"
        ? claimNote(await checkClaims(messages.filter((m) => m.role === "user").map((m) => m.content)))
        : undefined;
    const result = await getSuspect(id, difficulty, note).invoke({ messages }, AGENT_RUN_LIMITS);
    return Response.json(SuspectReply.parse(result.structuredResponse));
  } catch (err) {
    return serverError(err);
  }
}
