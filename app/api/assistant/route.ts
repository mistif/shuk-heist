import { getAssistant, prepareSearch } from "@/lib/agents";
import { badRequest, ChatRequest, parseBody, serverError } from "@/lib/validate";

export async function POST(req: Request) {
  const parsed = await parseBody(req, ChatRequest);
  if (!parsed.ok) return badRequest();

  try {
    await prepareSearch();
    const result = await getAssistant().invoke({ messages: parsed.data.messages });
    const reply = result.messages.at(-1)?.text;
    if (!reply) throw new Error("Assistant returned an empty reply");
    return Response.json({ reply });
  } catch (err) {
    return serverError(err);
  }
}
