import { AGENT_RUN_LIMITS, getSuspect, prepareSearch } from "@/lib/agents";
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
    const result = await getSuspect(id).invoke({ messages: parsed.data.messages }, AGENT_RUN_LIMITS);
    return Response.json(SuspectReply.parse(result.structuredResponse));
  } catch (err) {
    return serverError(err);
  }
}
