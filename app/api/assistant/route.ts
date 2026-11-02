import { AGENT_RUN_LIMITS, getAssistant, prepareSearch } from "@/lib/agents";
import { ASSISTANT_REFUSAL, isOnTopic } from "@/lib/guard";
import { rateLimited } from "@/lib/rate-limit";
import { thiefFor } from "@/lib/solution";
import { badRequest, ChatRequest, parseBody, serverError } from "@/lib/validate";

export async function POST(req: Request) {
  const limited = rateLimited(req);
  if (limited) return limited;

  const parsed = await parseBody(req, ChatRequest);
  if (!parsed.ok) return badRequest();

  try {
    const newest = parsed.data.messages.at(-1)!.content;
    if (!(await isOnTopic(newest))) return Response.json({ reply: ASSISTANT_REFUSAL });

    await prepareSearch();
    const { caseId, messages } = parsed.data;
    const result = await getAssistant(thiefFor(caseId)).invoke({ messages }, AGENT_RUN_LIMITS);
    const reply = result.messages.at(-1)?.text;
    if (!reply) throw new Error("Assistant returned an empty reply");
    return Response.json({ reply });
  } catch (err) {
    return serverError(err);
  }
}
